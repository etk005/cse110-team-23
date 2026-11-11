import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS, RISK_REWARD_SCREEN_CONSTANTS } from "../../constants.ts";
import { REWARD_VALUES } from "./RiskRewardScreenModel.ts";
import type { CalcField } from "./RiskRewardScreenModel.ts";

export type { CalcField };

// Short alias so layout code stays readable
const c = RISK_REWARD_SCREEN_CONSTANTS;

/** Everything the view needs to draw the current state of the minigame. */
export interface RiskRewardViewState {
    cardCount: number;   // total cards in the deck (one grid slot each)
    riskCount: number;   // Risk cards in the deck
    rewardCount: number; // Reward cards in the deck
    rewardCounts: Record<number, number>; // Reward cards per chip value
    chips: number;       // temporary minigame chips
}

/** What the screen's buttons and inputs do; wired up by the controller. */
export interface RiskRewardHandlers {
    onMenu: () => void;
    onInputChange: (field: CalcField, text: string) => void;
}

const CALC_FIELDS: { field: CalcField; label: string; placeholder: string }[] = [
    { field: "risk", label: "P(Risk) on the next flip", placeholder: "e.g. 1/3 or 0.33" },
    { field: "reward", label: "P(Reward) on the next flip", placeholder: "e.g. 2/3 or 0.67" },
    { field: "expectedValue", label: "Expected chip gain/loss from the next flip", placeholder: "e.g. 4/3 or 1.33" },
];

/**
 * Renders the Risk/Reward minigame: the title, a stats panel, the card grid
 * on the left, and on the right the calculations panel where the player
 * enters P(Risk), P(Reward) and the expected value before each flip.
 */
export class RiskRewardScreenView implements View {
    // Root group for the whole screen (hidden until the minigame starts)
    private group: Konva.Group;
    // Holds the stats panel and cards; cleared and redrawn on every render()
    private content: Konva.Group;
    // Error text under each input (Konva, so it sits on the canvas)
    private errorTexts = new Map<CalcField, Konva.Text>();
    // Real <input> elements, placed over the canvas (Konva can't draw text boxes)
    private overlay: HTMLDivElement | null = null;
    private inputs = new Map<CalcField, HTMLInputElement>();

    /** @param handlers What each button / input does (see RiskRewardHandlers) */
    constructor(private handlers: RiskRewardHandlers) {
        this.group = new Konva.Group({ visible: false });

        // Full-screen background
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        }));

        // The title never changes, so it's drawn once here instead of in render()
        this.group.add(this.createTitle());

        // Lets the player leave the minigame (also static, so drawn once)
        this.group.add(this.createMenuButton(handlers.onMenu));

        this.content = new Konva.Group();
        this.group.add(this.content);

        // The calculations panel layout never changes; only the inputs' text does
        this.group.add(this.createCalcPanel());
    }

    /** Right-hand panel: title, short instructions and one labelled slot per input. */
    private createCalcPanel(): Konva.Group {
        const panel = new Konva.Group({ x: c.CALC_X, y: c.STATS_PANEL_Y });
        const innerWidth = c.CALC_WIDTH - 2 * c.CALC_PADDING;
        panel.add(new Konva.Rect({
            width: c.CALC_WIDTH,
            height: c.CALC_PANEL_HEIGHT,
            fill: c.PANEL_FILL,
            stroke: c.PANEL_STROKE,
            strokeWidth: 2,
            cornerRadius: c.PANEL_RADIUS,
        }));
        panel.add(new Konva.Text({
            x: c.CALC_PADDING,
            y: c.CALC_PADDING,
            text: "Your Calculations",
            fontSize: c.CALC_TITLE_FONT_SIZE,
            fontFamily: "Georgia",
            fontStyle: "bold",
            fill: COLORS.text,
        }));
        panel.add(new Konva.Text({
            x: c.CALC_PADDING,
            y: c.CALC_PADDING + c.CALC_TITLE_FONT_SIZE * 1.4,
            width: innerWidth,
            text: `Use the cards left and your current chips. ${REWARD_VALUES.length > 1 ? `Rewards are worth ${REWARD_VALUES.map((v) => `+${v}`).join(", ")} chips` : `A Reward adds ${REWARD_VALUES[0] ?? 1} chip${REWARD_VALUES[0] === 1 ? "" : "s"}`}; a Risk loses them all. Fractions or decimals are fine.`,
            fontSize: c.CALC_HINT_FONT_SIZE,
            fontFamily: "Arial",
            lineHeight: 1.3,
            fill: COLORS.text,
        }));

        CALC_FIELDS.forEach(({ field, label }, i) => {
            const y = c.CALC_FIELD_TOP + i * c.CALC_FIELD_GAP;
            panel.add(new Konva.Text({
                x: c.CALC_PADDING,
                y,
                text: label,
                fontSize: c.CALC_LABEL_FONT_SIZE,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: COLORS.text,
            }));
            const error = new Konva.Text({
                x: c.CALC_PADDING,
                y: y + c.CALC_INPUT_Y + c.CALC_INPUT_HEIGHT + c.CALC_ERROR_FONT_SIZE / 2,
                width: innerWidth,
                text: "",
                fontSize: c.CALC_ERROR_FONT_SIZE,
                fontFamily: "Arial",
                fill: c.ERROR_COLOR,
            });
            this.errorTexts.set(field, error);
            panel.add(error);
        });
        return panel;
    }

    /** Builds the HTML inputs once, the first time the screen is shown. */
    private ensureInputs(): void {
        if (this.overlay || typeof document === "undefined") {
            return;
        }
        // Same size as the stage and scaled with CSS, so inputs use stage coordinates
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

        CALC_FIELDS.forEach(({ field, label, placeholder }, i) => {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = placeholder;
            input.autocomplete = "off";
            input.setAttribute("aria-label", label);
            input.style.cssText = [
                "position: absolute",
                "box-sizing: border-box",
                "pointer-events: auto", // ...except on the inputs themselves
                `left: ${c.CALC_X + c.CALC_PADDING}px`,
                `top: ${c.STATS_PANEL_Y + c.CALC_FIELD_TOP + i * c.CALC_FIELD_GAP + c.CALC_INPUT_Y}px`,
                `width: ${c.CALC_WIDTH - 2 * c.CALC_PADDING}px`,
                `height: ${c.CALC_INPUT_HEIGHT}px`,
                `padding: 0 ${c.CALC_PADDING}px`,
                `font: ${c.CALC_INPUT_FONT_SIZE}px Arial, sans-serif`,
                `background: ${c.INPUT_FILL}`,
                `border: 2px solid ${c.CARD_STROKE}`,
                `border-radius: ${c.RADIUS}px`,
                `color: ${COLORS.background}`,
                "outline: none",
            ].join(";");
            input.addEventListener("input", () => this.handlers.onInputChange(field, input.value));
            this.inputs.set(field, input);
            overlay.appendChild(input);
        });

        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Keep the overlay lined up with the canvas (wait a frame for main.ts to resize the stage)
        window.addEventListener("resize", () => requestAnimationFrame(() => this.positionOverlay()));
    }

    /** Shows/hides the inputs with the screen and lines them up with the scaled canvas. */
    private positionOverlay(): void {
        if (!this.overlay) {
            return;
        }
        const stage = this.group.getStage();
        const visible = this.group.visible() && stage !== null;
        this.overlay.style.display = visible ? "block" : "none";
        if (!visible || !stage) {
            return;
        }
        const box = stage.container().getBoundingClientRect();
        this.overlay.style.left = `${box.left}px`;
        this.overlay.style.top = `${box.top}px`;
        this.overlay.style.transform = `scale(${stage.scaleX()})`;
    }

    /** Shows an error under an input and turns its border red (null clears it). */
    setFieldFeedback(field: CalcField, message: string | null): void {
        this.errorTexts.get(field)?.text(message ?? "");
        const input = this.inputs.get(field);
        if (input) {
            input.style.borderColor = message === null ? c.CARD_STROKE : c.RISK_COLOR;
        }
        this.group.getLayer()?.batchDraw();
    }

    /** Current text in each input (empty strings before the inputs exist). */
    getInputValues(): Record<CalcField, string> {
        return {
            risk: this.inputs.get("risk")?.value ?? "",
            reward: this.inputs.get("reward")?.value ?? "",
            expectedValue: this.inputs.get("expectedValue")?.value ?? "",
        };
    }

    /** Empties every input and clears its error (used when a new round starts). */
    clearInputs(): void {
        for (const { field } of CALC_FIELDS) {
            const input = this.inputs.get(field);
            if (input) {
                input.value = "";
            }
            this.setFieldFeedback(field, null);
        }
    }

    /** "Menu" button in the bottom-right corner. */
    private createMenuButton(onClick: () => void): Konva.Group {
        const button = new Konva.Group({
            x: STAGE_WIDTH - c.MENU_BUTTON_MARGIN - c.MENU_BUTTON_WIDTH,
            y: STAGE_HEIGHT - c.MENU_BUTTON_MARGIN - c.MENU_BUTTON_HEIGHT,
        });
        // Same red style as the Menu button on the main game screen
        button.add(new Konva.Rect({
            width: c.MENU_BUTTON_WIDTH,
            height: c.MENU_BUTTON_HEIGHT,
            fill: COLORS.button,
            stroke: COLORS.buttonDark,
            strokeWidth: c.MENU_BUTTON_STROKE,
            cornerRadius: c.MENU_BUTTON_RADIUS,
        }));
        button.add(new Konva.Text({
            width: c.MENU_BUTTON_WIDTH,
            height: c.MENU_BUTTON_HEIGHT,
            text: "Menu",
            fontSize: c.MENU_BUTTON_FONT_SIZE,
            fill: COLORS.text,
            align: "center",
            verticalAlign: "middle",
        }));

        button.on("click tap", onClick);
        // Show a pointer cursor on hover so it reads as clickable
        button.on("mouseenter", () => {
            const stage = button.getStage();
            if (stage) stage.container().style.cursor = "pointer";
        });
        button.on("mouseleave", () => {
            const stage = button.getStage();
            if (stage) stage.container().style.cursor = "default";
        });
        return button;
    }

    /** "Risk" in red, "/" in gold, "Reward" in green, centered on the screen. */
    private createTitle(): Konva.Group {
        const title = new Konva.Group({ y: c.TITLE_Y });
        const parts: [string, string][] = [
            ["Risk", c.RISK_COLOR],
            ["/", COLORS.accent],
            ["Reward", c.TITLE_REWARD_COLOR],
        ];

        // Konva.Text has one color, so each part is its own text node,
        // placed right after the previous one.
        let x = 0;
        for (const [text, fill] of parts) {
            const node = new Konva.Text({
                x,
                text,
                fontSize: c.TITLE_FONT_SIZE,
                fontFamily: "Georgia",
                fontStyle: "bold",
                fill,
            });
            title.add(node);
            x += node.width();
        }

        // x is now the total width of the title, so center the whole group
        title.x((STAGE_WIDTH - x) / 2);
        return title;
    }

    /**
     * Draws the stat boxes and one face-down card per card in the deck.
     * Safe to call again: the previous drawing is cleared first.
     */
    render(stats: RiskRewardViewState): void {
        this.content.destroyChildren();

        // ---- Stats panel ----
        // Each entry is [label, value]; boxes fill left to right, wrapping
        // to a new row after STATS_COLUMNS boxes.
        const statBoxes: [string, number][] = [
            ["CARDS REMAINING", stats.cardCount],
            ["RISK REMAINING", stats.riskCount],
            ["REWARD REMAINING", stats.rewardCount],
            // Per-value boxes only matter when Rewards are worth different amounts
            ...(REWARD_VALUES.length > 1
                ? REWARD_VALUES.map((value): [string, number] => [`+${value} REWARDS LEFT`, stats.rewardCounts[value] ?? 0])
                : []),
            ["CURRENT MINIGAME CHIPS", stats.chips],
        ];
        // Box width is whatever fits STATS_COLUMNS boxes (plus gaps) inside
        // the panel's padding; panel height grows with the number of rows.
        const statRows = Math.ceil(statBoxes.length / c.STATS_COLUMNS);
        const innerWidth = c.LEFT_WIDTH - 2 * c.PANEL_PADDING;
        const statWidth = (innerWidth - (c.STATS_COLUMNS - 1) * c.STAT_GAP) / c.STATS_COLUMNS;
        const statsPanelHeight =
            2 * c.PANEL_PADDING + statRows * c.STAT_HEIGHT + (statRows - 1) * c.STAT_GAP;

        // Panel background behind the boxes
        this.content.add(new Konva.Rect({
            x: c.LEFT_X,
            y: c.STATS_PANEL_Y,
            width: c.LEFT_WIDTH,
            height: statsPanelHeight,
            fill: c.PANEL_FILL,
            stroke: c.PANEL_STROKE,
            strokeWidth: 2,
            cornerRadius: c.PANEL_RADIUS,
        }));

        statBoxes.forEach(([label, value], i) => {
            // Turn the list index into a (column, row) position
            const col = i % c.STATS_COLUMNS;
            const row = Math.floor(i / c.STATS_COLUMNS);
            const box = new Konva.Group({
                x: c.LEFT_X + c.PANEL_PADDING + col * (statWidth + c.STAT_GAP),
                y: c.STATS_PANEL_Y + c.PANEL_PADDING + row * (c.STAT_HEIGHT + c.STAT_GAP),
            });
            box.add(new Konva.Rect({
                width: statWidth,
                height: c.STAT_HEIGHT,
                fill: c.CARD_FILL,
                stroke: c.CARD_STROKE,
                strokeWidth: 1,
                cornerRadius: c.RADIUS,
            }));
            // Small red label at the top of the box
            box.add(new Konva.Text({
                x: c.STAT_PADDING,
                y: c.STAT_PADDING,
                text: label,
                fontSize: c.STAT_LABEL_FONT_SIZE,
                fontFamily: "Arial",
                letterSpacing: 1,
                fill: c.RISK_COLOR,
            }));
            // Large bold value in the bottom half
            box.add(new Konva.Text({
                x: c.STAT_PADDING,
                y: c.STAT_HEIGHT / 2,
                text: String(value),
                fontSize: c.STAT_VALUE_FONT_SIZE,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: COLORS.background,
            }));
            this.content.add(box);
        });

        // ---- Card grid panel ----
        // Starts just below the stats panel, so moving STATS_PANEL_Y moves
        // the grid too. Card width is whatever fits GRID_COLUMNS cards.
        const gridPanelY = c.STATS_PANEL_Y + statsPanelHeight + c.GRID_PANEL_GAP;
        const rows = Math.ceil(stats.cardCount / c.GRID_COLUMNS);
        const gridInnerWidth = c.LEFT_WIDTH - 2 * c.GRID_PADDING;
        const cardWidth = (gridInnerWidth - (c.GRID_COLUMNS - 1) * c.CARD_GAP) / c.GRID_COLUMNS;
        const gridPanelHeight =
            2 * c.GRID_PADDING + rows * c.CARD_HEIGHT + (rows - 1) * c.CARD_GAP;

        // Dark background behind the cards
        this.content.add(new Konva.Rect({
            x: c.LEFT_X,
            y: gridPanelY,
            width: c.LEFT_WIDTH,
            height: gridPanelHeight,
            fill: c.GRID_FILL,
            stroke: c.PANEL_STROKE,
            strokeWidth: 2,
            cornerRadius: c.PANEL_RADIUS,
        }));

        // One card per deck slot, filled left to right, top to bottom
        for (let i = 0; i < stats.cardCount; i++) {
            const col = i % c.GRID_COLUMNS;
            const row = Math.floor(i / c.GRID_COLUMNS);
            this.content.add(this.createCard(
                c.LEFT_X + c.GRID_PADDING + col * (cardWidth + c.CARD_GAP),
                gridPanelY + c.GRID_PADDING + row * (c.CARD_HEIGHT + c.CARD_GAP),
                cardWidth
            ));
        }

        this.group.getLayer()?.draw();
    }

    /**
     * A face-down card showing a red "R/" and a green "R".
     * Every card looks the same, so the player can't tell Risk from Reward.
     */
    private createCard(x: number, y: number, width: number): Konva.Group {
        const card = new Konva.Group({ x, y });
        // Card body
        card.add(new Konva.Rect({
            width,
            height: c.CARD_HEIGHT,
            fill: c.CARD_FILL,
            stroke: c.CARD_STROKE,
            strokeWidth: 2,
            cornerRadius: c.RADIUS,
        }));

        // "R/R" label: three text nodes side by side (same trick as the title)
        const label = new Konva.Group();
        let textX = 0;
        const parts: [string, string][] = [["R", c.RISK_COLOR], ["/", c.RISK_COLOR], ["R", c.REWARD_COLOR]];
        for (const [text, fill] of parts) {
            const node = new Konva.Text({
                x: textX,
                text,
                fontSize: c.CARD_FONT_SIZE,
                fontFamily: "Arial",
                fill,
            });
            label.add(node);
            textX += node.width();
        }
        // Center the label on the card
        label.x((width - textX) / 2);
        label.y((c.CARD_HEIGHT - c.CARD_FONT_SIZE) / 2);
        card.add(label);
        return card;
    }

    /** Makes the screen visible and redraws the layer. */
    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
        this.ensureInputs();
        this.positionOverlay();
    }

    /** Hides the screen and redraws the layer. */
    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
        this.positionOverlay();
    }

    /** Root group, added to the shared layer by main.ts. */
    getGroup(): Konva.Group {
        return this.group;
    }
}
