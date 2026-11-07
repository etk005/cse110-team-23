import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS, RISK_REWARD_SCREEN_CONSTANTS } from "../../constants.ts";

// Short alias so layout code stays readable
const c = RISK_REWARD_SCREEN_CONSTANTS;

/** The numbers the view needs to draw the stats panel and card grid. */
export interface RiskRewardStats {
    cardCount: number;   // total cards in the deck (one grid slot each)
    riskCount: number;   // Risk cards remaining
    rewardCount: number; // Reward cards remaining
    chips: number;       // temporary minigame coins
}

/**
 * Renders the Risk/Reward minigame: the title, a stats panel with the
 * starting counts, and a grid of face-down cards. Everything sits in a
 * column on the left side of the screen.
 */
export class RiskRewardScreenView implements View {
    // Root group for the whole screen (hidden until the minigame starts)
    private group: Konva.Group;
    // Holds the stats panel and cards; cleared and redrawn on every render()
    private content: Konva.Group;

    constructor() {
        this.group = new Konva.Group({ visible: false });

        // Full-screen background
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        }));

        // The title never changes, so it's drawn once here instead of in render()
        this.group.add(this.createTitle());

        this.content = new Konva.Group();
        this.group.add(this.content);
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
    render(stats: RiskRewardStats): void {
        this.content.destroyChildren();

        // ---- Stats panel ----
        // Each entry is [label, value]; boxes fill left to right, wrapping
        // to a new row after STATS_COLUMNS boxes.
        const statBoxes: [string, number][] = [
            ["CARDS REMAINING", stats.cardCount],
            ["RISK REMAINING", stats.riskCount],
            ["REWARD REMAINING", stats.rewardCount],
            ["CURRENT MINIGAME COINS", stats.chips],
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
    }

    /** Hides the screen and redraws the layer. */
    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    /** Root group, added to the shared layer by main.ts. */
    getGroup(): Konva.Group {
        return this.group;
    }
}
