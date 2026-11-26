
import Konva from "konva";
import type { View } from "../../types.ts";
import type { Card, GameState, HintKind, Rank, Suit } from "../../shared/types.ts";
import {addPanel} from "../../ui/widgets.ts";
import {
    STAGE_WIDTH,
    STAGE_HEIGHT,
    COLORS,
    GAME_SCREEN_CONSTANTS,
} from "../../constants.ts";

const COIN_SPEND_DISPLAY_MS = 1000;
const SUIT_ORDER: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANK_ORDER: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUIT_SYMBOLS: Record<Suit, string> = {
    spades: "\u2660",
    hearts: "\u2665",
    diamonds: "\u2666",
    clubs: "\u2663",
};

export class GameScreenView implements View {
    private group: Konva.Group;
    private onAnswer: (answer: string) => void;
    private onMenu: () => void;
    private onNext: () => void;
    private onBuyInfo: () => void;
    private onChooseHint: (kind: HintKind) => void;

    // coins and score readout, updated without a full re-render
    private coins = 0;
    private score = 0;
    private levelPoints = 0;
    private coinsText: Konva.Text | null = null;
    private scoreText: Konva.Text | null = null;
    private coinsSpent: { label: Konva.Text; timeout: ReturnType<typeof setTimeout> } | null = null;

    // HTML text input drawn on top of the canvas (created on first use)
    private overlay: HTMLDivElement | null = null;
    private input: HTMLInputElement | null = null;
    private wantInput = false;
    private inputRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = null;

    // Guess input in the finalGuess panel
    private guessInput: HTMLInputElement | null = null;
    private wantGuessInput = false;
    private guessInputRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null = null;
    private currentDeck: Card[] = [];
    private lastAction: "guess" | "probability" | "hint" = "probability";
    private guessFeedbackText: Konva.Text | null = null;
    private guessError = false;
    private canGuess = false;

    // True while the "View Possible Cards" popup is open
    private modalOpen = false;

    constructor(
        onAnswer: (answer: string) => void,
        onMenu: () => void,
        onNext: () => void,
        onBuyInfo: () => void,
        onChooseHint: (kind: HintKind) => void,
        private onGuess: (card: Card) => void = () => {},
    ) {
        this.group = new Konva.Group({ visible: false });
        this.onAnswer = onAnswer;
        this.onMenu = onMenu;
        this.onNext = onNext;
        this.onBuyInfo = onBuyInfo;
        this.onChooseHint = onChooseHint;
    }

    render(
        state: GameState,
        options: string[],
        feedback = "",
        showNext = false
    ): void {
        this.clearCoinsSpent();
        this.group.destroyChildren();
        this.modalOpen = false;
        this.currentDeck = state.deck;

        const background = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        });

        this.group.add(background);
        const imageGroup = new Konva.Group();
        this.group.add(imageGroup);

        //Logo
        Konva.Image.fromURL("/Brand.png", (logo) => {
            const c = GAME_SCREEN_CONSTANTS;
            logo.x(c.LOGO_X);
            logo.y(c.LOGO_Y);
            logo.width(c.LOGO_WIDTH);
            logo.height(c.LOGO_HEIGHT);
            logo.offsetX(0);
            logo.offsetY(0);
            imageGroup.add(logo);
            this.group.getLayer()?.draw();
        });

        
        const layout = GAME_SCREEN_CONSTANTS;
        const pad = layout.PANEL_PADDING;
        const infoPanel = addPanel(this.group, 
             layout.RIGHT_COLUMN_X,
             layout.INFO_PANEL_Y, 
             layout.RIGHT_COLUMN_WIDTH, 
             layout.INFO_PANEL_HEIGHT, 
             "Known Information");
        // Clues go inside the panel. (x, y) are relative to the panel's top-left.
        let clueLines = "";
        for (const info of state.knownInformation) {
            clueLines += "• " + info.description + "\n";
        }
        infoPanel.add(
            new Konva.Text({
                x: pad,
                y: layout.PANEL_BODY_Y,
                width: layout.RIGHT_COLUMN_WIDTH - 2 * pad,
                text: clueLines,
                fontSize: layout.PANEL_BODY_FONT_SIZE,
                lineHeight: 1.5,
                fontFamily: "Georgia, serif",
                fill: layout.PANEL_TEXT,
            })
        );
        this.addText(
            `Strikes: ${state.strikes}/${state.maxStrikes}`,
            layout.STATS_X,
            layout.STATS_Y_STRIKES,
            layout.STATS_FONT_SIZE
        );

        this.addText(
            `Progress: ${state.questionsAnswered}/${state.questionsRequired}`,
            layout.STATS_X,
            layout.STATS_Y_PROGRESS,
            layout.STATS_FONT_SIZE
        );

        if (state.canViewRemainingCards) {
            this.addRemainingPanel(state.remainingPossibleCards);
        }
        this.addResourcesBar(state.deck);
        this.coinsText = this.addText(
            "",
            layout.RESOURCES_X,
            layout.STATS_Y_STRIKES,
            layout.STATS_FONT_SIZE
        );

        this.scoreText = this.addText(
            "",
            layout.RESOURCES_X,
            layout.STATS_Y_PROGRESS,
            layout.STATS_FONT_SIZE
        );
        this.setResourceText();

        // Hidden card
        Konva.Image.fromURL("/card.png", (card) => {
            card.x(GAME_SCREEN_CONSTANTS.CARD_X);
            card.y(GAME_SCREEN_CONSTANTS.CARD_Y);
            card.width(GAME_SCREEN_CONSTANTS.CARD_WIDTH);
            card.height(GAME_SCREEN_CONSTANTS.CARD_HEIGHT);
            imageGroup.add(card);
            this.group.getLayer()?.draw();
        });


        // "Work out the probability" panel
        const probabilityPanel = addPanel(
            this.group,
            layout.RIGHT_COLUMN_X,
            layout.PROBABILITY_PANEL_Y,
            layout.RIGHT_COLUMN_WIDTH,
            layout.PROBABILITY_PANEL_HEIGHT,
            "Work out the probability"
        );

        // Everything below is positioned relative to the panel's top-left.
        const rowY = layout.PANEL_ROW_Y; // the input + Submit row
        const inputWidth = layout.INPUT_WIDTH;
        const submitWidth = layout.SUBMIT_WIDTH;
        const rowHeight = layout.BUTTON_HEIGHT;

        // The question being asked
        probabilityPanel.add(
            new Konva.Text({
                x: pad,
                y: layout.PANEL_BODY_Y,
                width: layout.RIGHT_COLUMN_WIDTH - 2 * pad,
                text: state.currentQuestion?.text ?? "",
                fontSize: layout.PANEL_BODY_FONT_SIZE,
                fontFamily: "Arial",
                fill: layout.PANEL_TEXT,
            })
        );

        // Small hint under the input
        const range = state.probabilityRange;
        const hintText = range
            ? `Hint: the probability is between ${range.low} and ${range.high}.`
            : "Enter a fraction or decimal, like 1/4 or 0.25.";
        probabilityPanel.add(
            new Konva.Text({
                x: pad,
                y: rowY + rowHeight + layout.PANEL_HINT_GAP,
                text: hintText,
                fontSize: layout.PANEL_HINT_FONT_SIZE,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: layout.PANEL_HINT_TEXT,
            })
        );

        // Input + Submit are only shown while a question is waiting for an answer
        const canAnswer = !showNext && state.status === "playing";
        const rowAbsY = layout.PROBABILITY_PANEL_Y + rowY;
        const inputAbsX = layout.RIGHT_COLUMN_X + pad;
        const submitAbsX = inputAbsX + inputWidth + pad;

        this.wantInput = canAnswer;
        this.inputRect = {
            x: inputAbsX,
            y: rowAbsY,
            width: inputWidth,
            height: rowHeight,
        };

        if (canAnswer) {
            this.addButton(
                "Submit",
                submitAbsX,
                rowAbsY,
                submitWidth,
                () => this.submitInput()
            );
            const buyX = state.canViewRemainingCards
                ? layout.REMAINING_PANEL_X +
                  layout.REMAINING_PANEL_WIDTH +
                  pad * 2
                : layout.REMAINING_PANEL_X;

            const buttonY =
                layout.REMAINING_PANEL_Y +
                layout.REMAINING_PANEL_HEIGHT -
                layout.BUTTON_HEIGHT;
            const hintButtonWidth = layout.NEXT_BUTTON_WIDTH;

            if (state.choosingHint) {
                const hintOptions: { label: string; kind: HintKind }[] = [];
                if (!state.canViewRemainingCards) {
                    hintOptions.push({
                        label: "See remaining cards",
                        kind: "cards",
                    });
                }
                if (state.probabilityRange === null) {
                    hintOptions.push({
                        label: "Probability range",
                        kind: "range",
                    });
                }

                hintOptions.forEach((option, index) => {
                    const y =
                        hintOptions.length > 1
                            ? buttonY - (hintOptions.length - 1 - index) * (layout.BUTTON_HEIGHT + pad)
                            : buttonY;

                    this.addButton(
                        option.label,
                        buyX,
                        y,
                        hintButtonWidth,
                        () => {
                            this.lastAction = "hint";
                            this.onChooseHint(option.kind);
                        }
                    );
                });
            } else {
                this.addButton(
                    "Buy Clue",
                    buyX,
                    buttonY,
                    layout.MENU_BUTTON_WIDTH,
                    () => {
                        this.lastAction = "hint";
                        this.onBuyInfo();
                    }
                );
            }
        }

        // Feedback message: beside Submit, or where the input was
        const isGuessFeedback =
            this.lastAction === "guess"
                ? feedback === "You guessed it!" ||
                  feedback === "Keep trying!" ||
                  feedback === "Not enough coins!" ||
                  feedback === "Already guessed this question!"
                : feedback === "You guessed it!" || feedback === "Keep trying!";
        if (feedback && !isGuessFeedback) {
            this.group.add(
                new Konva.Text({
                    x: canAnswer ? submitAbsX + submitWidth + pad * 1.5 : inputAbsX,
                    y: rowAbsY,
                    height: rowHeight,
                    verticalAlign: "middle",
                    text: feedback,
                    fontSize: layout.FEEDBACK_FONT_SIZE,
                    fontFamily: "Arial",
                    // dark colors, because the panel is cream
                    fill: showNext ? "#1c7a3c" : COLORS.button,
                })
            );
        }

        // Navigation buttons
        if (showNext) {
            const label = state.status === "won"
                ? "Finish Level"
                : "Next Question";

            // Menu and Next side by side, centered as a pair.
            const pairWidth =
                layout.MENU_BUTTON_WIDTH +
                layout.FOOTER_BUTTON_GAP +
                layout.NEXT_BUTTON_WIDTH;
            const pairX = (STAGE_WIDTH - pairWidth) / 2;

            this.addButton(
                "Menu",
                pairX,
                layout.FOOTER_Y,
                layout.MENU_BUTTON_WIDTH,
                this.onMenu
            );

            this.addButton(
                label,
                pairX + layout.MENU_BUTTON_WIDTH + layout.FOOTER_BUTTON_GAP,
                layout.FOOTER_Y,
                layout.NEXT_BUTTON_WIDTH,
                this.onNext
            );
        } else {
            this.addButton(
                "Menu",
                (STAGE_WIDTH - layout.MENU_BUTTON_WIDTH) / 2,
                layout.FOOTER_Y,
                layout.MENU_BUTTON_WIDTH,
                this.onMenu
            );
        }

        const finalGuessPanel = addPanel(
            this.group,
            layout.RIGHT_COLUMN_X,
            layout.GUESS_PANEL_Y,
            layout.RIGHT_COLUMN_WIDTH,
            layout.GUESS_PANEL_HEIGHT,
            "Make a guess"
        );

        const guessRowY = layout.PANEL_BODY_Y;
        const guessRowAbsY = layout.GUESS_PANEL_Y + guessRowY;
        const guessInputAbsX = layout.RIGHT_COLUMN_X + pad;
        const guessSubmitAbsX = guessInputAbsX + inputWidth + pad;

        const showGuessInput = state.status === "playing" || state.status === "won";
        const canGuess =
            !showNext &&
            state.status === "playing" &&
            !state.hasGuessedThisQuestion;

        this.canGuess = canGuess;
        this.wantGuessInput = showGuessInput;
        this.guessInputRect = {
            x: guessInputAbsX,
            y: guessRowAbsY,
            width: inputWidth,
            height: rowHeight,
        };

        if (canGuess) {
            this.addButton(
                "Guess",
                guessSubmitAbsX,
                guessRowAbsY,
                submitWidth,
                () => this.submitGuess()
            );
        }

        finalGuessPanel.add(
            new Konva.Text({
                x: pad,
                y: guessRowY + rowHeight + layout.PANEL_HINT_GAP,
                text: "Enter a rank and suit, like AH or 10S.",
                fontSize: layout.PANEL_HINT_FONT_SIZE,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: layout.PANEL_HINT_TEXT,
            })
        );

        const guessFeedbackMsg = isGuessFeedback ? feedback : (this.guessError ? "Invalid format!" : "");
        this.guessFeedbackText = new Konva.Text({
            x: canGuess ? guessSubmitAbsX + submitWidth + pad * 1.5 : guessSubmitAbsX,
            y: guessRowAbsY,
            height: rowHeight,
            verticalAlign: "middle",
            text: guessFeedbackMsg,
            fontSize: layout.FEEDBACK_FONT_SIZE,
            fontFamily: "Arial",
            fill: guessFeedbackMsg === "You guessed it!" ? "#1c7a3c" : COLORS.button,
        });
        this.group.add(this.guessFeedbackText);

        this.group.getLayer()?.draw();

        this.ensureInput();
        this.updateInput();
        this.focusInput();
    }
   

    /** Shows new coin and score values, plus what the current level is worth. */
    updateResources(coins: number, score: number, levelPoints: number): void {
        this.coins = coins;
        this.score = score;
        this.levelPoints = levelPoints;
        this.setResourceText();
        this.group.getLayer()?.batchDraw();
    }

    showCoinsSpent(amount: number): void {
        const balance = this.coinsText;
        if (!balance) {
            return;
        }

        this.clearCoinsSpent();
        const label = this.addText(
            `−${amount} coins`,
            balance.x() + balance.width() + GAME_SCREEN_CONSTANTS.PANEL_PADDING,
            balance.y(),
            balance.fontSize(),
            COLORS.accent
        ).listening(false);
        const timeout = setTimeout(() => {
            this.clearCoinsSpent();
            this.group.getLayer()?.batchDraw();
        }, COIN_SPEND_DISPLAY_MS);
        this.coinsSpent = { label, timeout };
        this.group.getLayer()?.batchDraw();
    }

    private clearCoinsSpent(): void {
        if (this.coinsSpent) {
            clearTimeout(this.coinsSpent.timeout);
            this.coinsSpent.label.destroy();
            this.coinsSpent = null;
        }
    }

    private setResourceText(): void {
        this.coinsText?.text(`Coins: ${this.coins}`);
        this.scoreText?.text(`Score: ${this.score} (+${this.levelPoints} this level)`);
    }

    // ---- HTML text input -------------------------------------------------
    // Konva can't draw a text box you can type in, so the input is a real
    // <input> placed on top of the canvas. The overlay <div> is the same size
    // as the 1920x1080 stage and is scaled with CSS, so the input can use the
    // same stage coordinates as everything else.

    private ensureInput(): void {
        if (typeof document === "undefined") {
            return;
        }

        if (!this.overlay && (this.wantInput || this.wantGuessInput)) {
            const overlay = document.createElement("div");
            overlay.style.cssText = [
                "position: fixed",
                "left: 0",
                "top: 0",
                `width: ${STAGE_WIDTH}px`,
                `height: ${STAGE_HEIGHT}px`,
                "transform-origin: 0 0",
                "pointer-events: none", // clicks fall through to the canvas...
                "display: none",
            ].join(";");
            document.body.appendChild(overlay);
            this.overlay = overlay;

            // Keep the overlay lined up with the canvas when the window resizes.
            // (Wait a frame so main.ts has resized the stage first.)
            window.addEventListener("resize", () =>
                requestAnimationFrame(() => this.updateInput())
            );
        }

        if (this.overlay && !this.input) {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Enter your probability";
            input.autocomplete = "off";
            input.style.cssText = [
                "position: absolute",
                "box-sizing: border-box",
                "pointer-events: auto", // ...except on the input itself
                `padding: 0 ${GAME_SCREEN_CONSTANTS.INPUT_PADDING_X}px`,
                `font: ${GAME_SCREEN_CONSTANTS.BUTTON_FONT_SIZE}px Arial, sans-serif`,
                "background: #f4efe6",
                "border: 2px solid #d9d0b8",
                `border-radius: ${GAME_SCREEN_CONSTANTS.BUTTON_RADIUS}px`,
                `color: ${GAME_SCREEN_CONSTANTS.PANEL_TEXT}`,
                "outline: none",
            ].join(";");

            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    this.submitInput();
                }
            });

            this.overlay.appendChild(input);
            this.input = input;
        }

        if (this.overlay && !this.guessInput) {
            const guessInput = document.createElement("input");
            guessInput.type = "text";
            guessInput.placeholder = "Enter card (e.g. AH)";
            guessInput.autocomplete = "off";
            guessInput.style.cssText = [
                "position: absolute",
                "box-sizing: border-box",
                "pointer-events: auto", // ...except on the input itself
                `padding: 0 ${GAME_SCREEN_CONSTANTS.INPUT_PADDING_X}px`,
                `font: ${GAME_SCREEN_CONSTANTS.BUTTON_FONT_SIZE}px Arial, sans-serif`,
                "background: #f4efe6",
                "border: 2px solid #d9d0b8",
                `border-radius: ${GAME_SCREEN_CONSTANTS.BUTTON_RADIUS}px`,
                `color: ${GAME_SCREEN_CONSTANTS.PANEL_TEXT}`,
                "outline: none",
            ].join(";");

            guessInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    this.submitGuess();
                }
            });

            guessInput.addEventListener("input", () => {
                this.clearGuessError();
            });

            this.overlay.appendChild(guessInput);
            this.guessInput = guessInput;
        }
    }

    private updateInput(): void {
        if (!this.overlay) {
            return;
        }

        const stage = this.group.getStage();
        const anyVisible =
            (this.wantInput || this.wantGuessInput) &&
            !this.modalOpen &&
            this.group.visible() &&
            stage !== null;

        this.overlay.style.display = anyVisible ? "block" : "none";

        if (!anyVisible || !stage) {
            return;
        }

        const canvasBox = stage.container().getBoundingClientRect();
        this.overlay.style.left = `${canvasBox.left}px`;
        this.overlay.style.top = `${canvasBox.top}px`;
        this.overlay.style.transform = `scale(${stage.scaleX()})`;

        if (this.input && this.inputRect) {
            this.input.style.display = this.wantInput ? "block" : "none";
            this.input.style.left = `${this.inputRect.x}px`;
            this.input.style.top = `${this.inputRect.y}px`;
            this.input.style.width = `${this.inputRect.width}px`;
            this.input.style.height = `${this.inputRect.height}px`;
        }

        if (this.guessInput && this.guessInputRect) {
            this.guessInput.style.display = this.wantGuessInput ? "block" : "none";
            this.guessInput.style.left = `${this.guessInputRect.x}px`;
            this.guessInput.style.top = `${this.guessInputRect.y}px`;
            this.guessInput.style.width = `${this.guessInputRect.width}px`;
            this.guessInput.style.height = `${this.guessInputRect.height}px`;
        }
    }

    private focusInput(): void {
        if (this.modalOpen || !this.group.visible()) {
            return;
        }
        if (this.wantInput) {
            this.input?.focus();
        } else if (this.wantGuessInput) {
            this.guessInput?.focus();
        }
    }

    private submitInput(): void {
        if (!this.input) {
            return;
        }

        const value = this.input.value.trim();

        if (value === "") {
            return; // nothing typed, so don't count it as a wrong answer
        }

        this.lastAction = "probability";
        this.input.value = "";
        this.onAnswer(value);
    }

    private submitGuess(): void {
        if (!this.guessInput || !this.canGuess) {
            return;
        }

        const raw = this.guessInput.value.trim();
        if (raw === "") {
            this.showGuessError();
            return;
        }

        const card = this.parseCardInput(raw);
        if (!card) {
            this.showGuessError();
            return;
        }

        this.clearGuessError();
        this.lastAction = "guess";
        this.guessInput.value = "";
        this.onGuess(card);
    }

    private showGuessError(): void {
        this.guessError = true;
        if (this.guessFeedbackText) {
            this.guessFeedbackText.text("Invalid format!");
            this.guessFeedbackText.fill(COLORS.button);
        }
        this.group.getLayer()?.batchDraw();
    }

    private clearGuessError(): void {
        if (!this.guessError) {
            return;
        }
        this.guessError = false;
        if (this.guessFeedbackText && this.guessFeedbackText.text() === "Invalid format!") {
            this.guessFeedbackText.text("");
            this.group.getLayer()?.batchDraw();
        }
    }

    private parseCardInput(text: string): Card | null {
        const cleaned = text.trim().toUpperCase().replace(/[\s-_]+/g, "");
        if (!cleaned) return null;

        // Direct match on card.id (e.g. "H-A" or "HA")
        const directMatch = this.currentDeck.find(
            (c) =>
                c.id.toUpperCase() === text.trim().toUpperCase() ||
                c.id.replace(/[-_]/g, "").toUpperCase() === cleaned
        );
        if (directMatch) return directMatch;

        const suitMap: Record<string, Suit> = {
            H: "hearts",
            D: "diamonds",
            C: "clubs",
            S: "spades",
        };

        const suitPrefixes: Record<Suit, string> = {
            hearts: "H",
            diamonds: "D",
            clubs: "C",
            spades: "S",
        };

        const validRanks = new Set([
            "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
        ]);

        // Match <rank><suit> (e.g., "AH", "10S", "1S", "KC", "4D")
        const rankSuitMatch = cleaned.match(/^([A-Z0-9]{1,2})([HDCS])$/);
        if (rankSuitMatch && rankSuitMatch[1] && rankSuitMatch[2]) {
            let rank = rankSuitMatch[1];
            const suitKey = rankSuitMatch[2];
            const suit = suitMap[suitKey];
            if (rank === "1") rank = "A";

            if (suit && validRanks.has(rank)) {
                const found = this.currentDeck.find(
                    (c) => c.suit === suit && c.rank.toUpperCase() === rank
                );
                if (found) return found;

                return { id: `${suitPrefixes[suit]}-${rank}`, suit, rank: rank as Rank };
            }
        }

        // Match <suit><rank> (e.g., "HA", "S10", "S1", "CK", "D4")
        const suitRankMatch = cleaned.match(/^([HDCS])([A-Z0-9]{1,2})$/);
        if (suitRankMatch && suitRankMatch[1] && suitRankMatch[2]) {
            const suitKey = suitRankMatch[1];
            const suit = suitMap[suitKey];
            let rank = suitRankMatch[2];
            if (rank === "1") rank = "A";

            if (suit && validRanks.has(rank)) {
                const found = this.currentDeck.find(
                    (c) => c.suit === suit && c.rank.toUpperCase() === rank
                );
                if (found) return found;

                return { id: `${suitPrefixes[suit]}-${rank}`, suit, rank: rank as Rank };
            }
        }

        return null;
    }

    private addText(
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color = COLORS.text
    ): Konva.Text {
        const label = new Konva.Text({
            x,
            y,
            text,
            fontSize,
            fontFamily: "Arial",
            fill: color,
        });

        this.group.add(label);
        return label;
    }

    private addButton(
        label: string,
        x: number,
        y: number,
        width: number,
        onClick: () => void,
        parent: Konva.Group = this.group
    ): void {
        const buttonGroup = new Konva.Group({ x, y });

        const buttonHeight = GAME_SCREEN_CONSTANTS.BUTTON_HEIGHT;

        const rectangle = new Konva.Rect({
            width,
            height: buttonHeight,
            fill: COLORS.button,
            stroke: COLORS.buttonDark,
            strokeWidth: GAME_SCREEN_CONSTANTS.BUTTON_STROKE,
            cornerRadius: GAME_SCREEN_CONSTANTS.BUTTON_RADIUS,
        });

        const text = new Konva.Text({
            text: label,
            width,
            height: buttonHeight,
            align: "center",
            verticalAlign: "middle",
            fontSize: GAME_SCREEN_CONSTANTS.BUTTON_FONT_SIZE,
            fill: COLORS.text,
        });

        buttonGroup.add(rectangle, text);

        buttonGroup.on("click tap", onClick);

        buttonGroup.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
        });

        buttonGroup.on("mouseleave", () => {
            document.body.style.cursor = "default";
        });

        parent.add(buttonGroup);
    }

    // ---- Remaining possible cards ---------------------------------------

    /** Panel under the hidden card: count + "View Possible Cards" button. */
    private addRemainingPanel(cards: Card[]): void {
        const c = GAME_SCREEN_CONSTANTS;
        const pad = c.PANEL_PADDING;
        const width = c.REMAINING_PANEL_WIDTH;

        const panel = addPanel(
            this.group,
            c.REMAINING_PANEL_X,
            c.REMAINING_PANEL_Y,
            width,
            c.REMAINING_PANEL_HEIGHT,
            "Remaining possible cards"
        );

        panel.add(
            new Konva.Text({
                x: pad,
                y: pad,
                width: width - 2 * pad,
                height: c.PANEL_TITLE_FONT_SIZE,
                align: "right",
                verticalAlign: "middle",
                text: `${cards.length} total`,
                fontSize: c.PANEL_BODY_FONT_SIZE,
                fontFamily: "Arial",
                fill: c.PANEL_HINT_TEXT,
            })
        );

        const button = new Konva.Group({
            x: pad,
            y: c.REMAINING_PANEL_HEIGHT - pad - c.BUTTON_HEIGHT,
        });
        button.add(
            new Konva.Rect({
                width: width - 2 * pad,
                height: c.BUTTON_HEIGHT,
                fill: c.OUTLINE_BUTTON_FILL,
                stroke: c.OUTLINE_BUTTON_BORDER,
                strokeWidth: 2,
                cornerRadius: c.BUTTON_RADIUS,
            }),
            new Konva.Text({
                width: width - 2 * pad,
                height: c.BUTTON_HEIGHT,
                align: "center",
                verticalAlign: "middle",
                text: "View Possible Cards",
                fontSize: c.BUTTON_FONT_SIZE,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: c.PANEL_TEXT,
            })
        );
        this.makeClickable(button, () => this.showCardsPopup("Possible Cards", cards));
        panel.add(button);
    }

    /**
     * Bottom bar: "Resources" + Formulas / Calculator / Rules (placeholders,
     * no action yet) and View Deck, which shows the level's full deck.
     */
    private addResourcesBar(deck: Card[]): void {
        const c = GAME_SCREEN_CONSTANTS;
        const pad = c.PANEL_PADDING;
        const bar = new Konva.Group({ x: c.RESOURCES_BAR_X, y: c.RESOURCES_BAR_Y });
        bar.add(
            new Konva.Rect({
                width: c.RESOURCES_BAR_WIDTH,
                height: c.RESOURCES_BAR_HEIGHT,
                fill: c.PANEL_FILL,
                cornerRadius: c.PANEL_RADIUS,
            })
        );

        const title = new Konva.Text({
            x: pad * 2,
            height: c.RESOURCES_BAR_HEIGHT,
            verticalAlign: "middle",
            text: "Resources",
            fontSize: c.RESOURCES_TITLE_FONT_SIZE,
            fontFamily: "Georgia, serif",
            fill: c.PANEL_TEXT,
        });
        bar.add(title);

        const buttons: [string, (() => void) | null][] = [
            ["Formulas", null],
            ["Calculator", null],
            ["Rules / Tutorial", null],
            ["View Deck", () => this.showCardsPopup("Full Deck", deck)],
        ];
        let x = title.x() + title.width() + pad * 1.5;
        const y = (c.RESOURCES_BAR_HEIGHT - c.BUTTON_HEIGHT) / 2;
        for (const [label, onClick] of buttons) {
            const button = this.makeOutlineButton(label, x, y);
            if (onClick) {
                this.makeClickable(button, onClick);
            }
            bar.add(button);
            x += button.width() + c.RESOURCES_BUTTON_GAP;
        }

        this.group.add(bar);
    }

    /** Cream button with a tan outline, sized to fit its label. */
    private makeOutlineButton(label: string, x: number, y: number): Konva.Group {
        const c = GAME_SCREEN_CONSTANTS;
        const text = new Konva.Text({
            text: label,
            padding: c.INPUT_PADDING_X * 1.2,
            height: c.BUTTON_HEIGHT,
            verticalAlign: "middle",
            fontSize: c.BUTTON_FONT_SIZE * 0.85,
            fontStyle: "bold",
            fontFamily: "Arial",
            fill: c.PANEL_TEXT,
        });
        const button = new Konva.Group({ x, y, width: text.width() });
        // Konva.Text padding applies vertically too; keep the label centered
        text.padding(0);
        text.x(c.INPUT_PADDING_X * 1.2);
        button.add(
            new Konva.Rect({
                width: button.width(),
                height: c.BUTTON_HEIGHT,
                fill: c.OUTLINE_BUTTON_FILL,
                stroke: c.OUTLINE_BUTTON_BORDER,
                strokeWidth: 2,
                cornerRadius: c.BUTTON_RADIUS,
            }),
            text
        );
        return button;
    }

    /** Opens the remaining-possible-cards popup after a paid hint. */
    showRemainingCards(cards: Card[]): void {
        this.showCardsPopup("Possible Cards", cards);
    }

    /** Popup listing every remaining possible card as a mini card tile. */
    private showCardsPopup(title: string, cards: Card[]): void {
        if (this.modalOpen) {
            return;
        }
        const c = GAME_SCREEN_CONSTANTS;
        const pad = c.PANEL_PADDING;
        const modal = new Konva.Group();

        const close = (): void => {
            modal.destroy();
            this.modalOpen = false;
            document.body.style.cursor = "default";
            this.updateInput();
            this.focusInput();
            this.group.getLayer()?.draw();
        };

        const backdrop = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: c.MODAL_BACKDROP,
        });
        backdrop.on("click tap", close);
        modal.add(backdrop);

        const panelX = (STAGE_WIDTH - c.MODAL_WIDTH) / 2;
        const panelY = (STAGE_HEIGHT - c.MODAL_HEIGHT) / 2;
        const panel = addPanel(
            modal,
            panelX,
            panelY,
            c.MODAL_WIDTH,
            c.MODAL_HEIGHT,
            `${title} (${cards.length})`
        );

        // Grid of mini cards, sorted by suit then rank
        const sorted = [...cards].sort(
            (a, b) =>
                SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) ||
                RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
        );
        const gridWidth = c.MODAL_WIDTH - 2 * pad;
        const perRow = Math.max(
            1,
            Math.floor((gridWidth + c.MINI_CARD_GAP) / (c.MINI_CARD_WIDTH + c.MINI_CARD_GAP))
        );
        sorted.forEach((card, i) => {
            panel.add(
                this.makeMiniCard(
                    card,
                    pad + (i % perRow) * (c.MINI_CARD_WIDTH + c.MINI_CARD_GAP),
                    c.PANEL_BODY_Y + Math.floor(i / perRow) * (c.MINI_CARD_HEIGHT + c.MINI_CARD_GAP)
                )
            );
        });

        if (cards.length === 0) {
            panel.add(
                new Konva.Text({
                    x: pad,
                    y: c.PANEL_BODY_Y,
                    text: "No cards match the known information.",
                    fontSize: c.PANEL_BODY_FONT_SIZE,
                    fontFamily: "Arial",
                    fill: c.PANEL_TEXT,
                })
            );
        }

        this.addButton(
            "Close",
            panelX + (c.MODAL_WIDTH - c.MENU_BUTTON_WIDTH) / 2,
            panelY + c.MODAL_HEIGHT - pad - c.BUTTON_HEIGHT,
            c.MENU_BUTTON_WIDTH,
            close,
            modal
        );

        this.group.add(modal);
        this.modalOpen = true;
        this.updateInput(); // hide the HTML input so it doesn't float over the popup
        this.group.getLayer()?.draw();
    }

    private makeMiniCard(card: Card, x: number, y: number): Konva.Group {
        const c = GAME_SCREEN_CONSTANTS;
        const red = card.suit === "hearts" || card.suit === "diamonds";
        const tile = new Konva.Group({ x, y });
        tile.add(
            new Konva.Rect({
                width: c.MINI_CARD_WIDTH,
                height: c.MINI_CARD_HEIGHT,
                fill: "#ffffff",
                stroke: c.OUTLINE_BUTTON_BORDER,
                strokeWidth: 2,
                cornerRadius: c.BUTTON_RADIUS / 2,
            }),
            new Konva.Text({
                width: c.MINI_CARD_WIDTH,
                height: c.MINI_CARD_HEIGHT,
                align: "center",
                verticalAlign: "middle",
                text: `${card.rank}\n${SUIT_SYMBOLS[card.suit]}`,
                lineHeight: 1.1,
                fontSize: c.MINI_CARD_FONT_SIZE,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: red ? c.MINI_CARD_RED : c.MINI_CARD_BLACK,
            })
        );
        return tile;
    }

    private makeClickable(node: Konva.Group, onClick: () => void): void {
        node.on("click tap", onClick);
        node.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
        });
        node.on("mouseleave", () => {
            document.body.style.cursor = "default";
        });
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
        this.updateInput();
        this.focusInput();
    }

    hide(): void {
        this.clearCoinsSpent();
        this.group.visible(false);
        this.group.getLayer()?.draw();
        this.updateInput();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
