
import Konva from "konva";
import type { View } from "../../types.ts";
import type { GameState } from "../../shared/types.ts";
import {addPanel} from "../../ui/widgets.ts";
import {
    STAGE_WIDTH,
    STAGE_HEIGHT,
    COLORS,
    GAME_SCREEN_CONSTANTS,
} from "../../constants.ts";


export class GameScreenView implements View {
    private group: Konva.Group;
    private onAnswer: (answer: string) => void;
    private onMenu: () => void;
    private onNext: () => void;

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

    constructor(
        onAnswer: (answer: string) => void,
        onMenu: () => void,
        onNext: () => void
    ) {
        this.group = new Konva.Group({ visible: false });
        this.onAnswer = onAnswer;
        this.onMenu = onMenu;
        this.onNext = onNext;
    }

    render(
        state: GameState,
        options: string[],
        feedback = "",
        showNext = false
    ): void {
        this.group.destroyChildren();

        const background = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        });

        this.group.add(background);

        //Logo
        Konva.Image.fromURL("/Brand.png", (logo) => {
            const c = GAME_SCREEN_CONSTANTS;
            logo.x(c.LOGO_X);
            logo.y(c.LOGO_Y);
            logo.width(c.LOGO_WIDTH);
            logo.height(c.LOGO_HEIGHT);
            logo.offsetX(0);
            logo.offsetY(0);
            this.group.add(logo);
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

        // Hidden card
        Konva.Image.fromURL("/card.png", (card) => {
            card.x(GAME_SCREEN_CONSTANTS.CARD_X);
            card.y(GAME_SCREEN_CONSTANTS.CARD_Y);
            card.width(GAME_SCREEN_CONSTANTS.CARD_WIDTH);
            card.height(GAME_SCREEN_CONSTANTS.CARD_HEIGHT);
            this.group.add(card);
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
        probabilityPanel.add(
            new Konva.Text({
                x: pad,
                y: rowY + rowHeight + layout.PANEL_HINT_GAP,
                text: "Enter a fraction, decimal, or percentage.",
                fontSize: layout.PANEL_HINT_FONT_SIZE,
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
        }

        // Feedback message: beside Submit, or where the input was
        if (feedback) {
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

        this.group.getLayer()?.draw();

        this.ensureInput();
        this.updateInput();
        this.focusInput();
    }

    // ---- HTML text input -------------------------------------------------
    // Konva can't draw a text box you can type in, so the input is a real
    // <input> placed on top of the canvas. The overlay <div> is the same size
    // as the 1920x1080 stage and is scaled with CSS, so the input can use the
    // same stage coordinates as everything else.

    private ensureInput(): void {
        if (this.overlay || !this.wantInput || typeof document === "undefined") {
            return;
        }

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

        overlay.appendChild(input);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.input = input;

        // Keep the overlay lined up with the canvas when the window resizes.
        // (Wait a frame so main.ts has resized the stage first.)
        window.addEventListener("resize", () =>
            requestAnimationFrame(() => this.updateInput())
        );
    }

    private updateInput(): void {
        if (!this.overlay || !this.input || !this.inputRect) {
            return;
        }

        const stage = this.group.getStage();
        const visible = this.wantInput && this.group.visible() && stage !== null;

        this.overlay.style.display = visible ? "block" : "none";

        if (!visible || !stage) {
            return;
        }

        const canvasBox = stage.container().getBoundingClientRect();
        this.overlay.style.left = `${canvasBox.left}px`;
        this.overlay.style.top = `${canvasBox.top}px`;
        this.overlay.style.transform = `scale(${stage.scaleX()})`;

        this.input.style.left = `${this.inputRect.x}px`;
        this.input.style.top = `${this.inputRect.y}px`;
        this.input.style.width = `${this.inputRect.width}px`;
        this.input.style.height = `${this.inputRect.height}px`;
    }

    private focusInput(): void {
        if (this.wantInput && this.group.visible()) {
            this.input?.focus();
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

        this.input.value = "";
        this.onAnswer(value);
    }

    private addText(
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color = COLORS.text
    ): void {
        const label = new Konva.Text({
            x,
            y,
            text,
            fontSize,
            fontFamily: "Arial",
            fill: color,
        });

        this.group.add(label);
    }

    private addButton(
        label: string,
        x: number,
        y: number,
        width: number,
        onClick: () => void
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

        this.group.add(buttonGroup);
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
        this.updateInput();
        this.focusInput();
    }

    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
        this.updateInput();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
