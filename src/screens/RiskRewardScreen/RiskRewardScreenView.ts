import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS, RISK_REWARD_SCREEN_CONSTANTS } from "../../constants.ts";

const c = RISK_REWARD_SCREEN_CONSTANTS;

export interface RiskRewardStats {
    cardCount: number;
    riskCount: number;
    rewardCount: number;
    chips: number;
}

/** Renders the Risk/Reward minigame: starting counts and a face-down card grid. */
export class RiskRewardScreenView implements View {
    private group: Konva.Group;
    private content: Konva.Group;

    constructor() {
        this.group = new Konva.Group({ visible: false });

        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        }));

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

        title.x((STAGE_WIDTH - x) / 2);
        return title;
    }

    /** Draws the stat boxes and one face-down card per card in the deck. */
    render(stats: RiskRewardStats): void {
        this.content.destroyChildren();

        // Stats panel
        const statBoxes: [string, number][] = [
            ["CARDS REMAINING", stats.cardCount],
            ["RISK REMAINING", stats.riskCount],
            ["REWARD REMAINING", stats.rewardCount],
            ["CURRENT MINIGAME COINS", stats.chips],
        ];
        const statRows = Math.ceil(statBoxes.length / c.STATS_COLUMNS);
        const innerWidth = c.LEFT_WIDTH - 2 * c.PANEL_PADDING;
        const statWidth = (innerWidth - (c.STATS_COLUMNS - 1) * c.STAT_GAP) / c.STATS_COLUMNS;
        const statsPanelHeight =
            2 * c.PANEL_PADDING + statRows * c.STAT_HEIGHT + (statRows - 1) * c.STAT_GAP;

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
            box.add(new Konva.Text({
                x: c.STAT_PADDING,
                y: c.STAT_PADDING,
                text: label,
                fontSize: c.STAT_LABEL_FONT_SIZE,
                fontFamily: "Arial",
                letterSpacing: 1,
                fill: c.RISK_COLOR,
            }));
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

        // Card grid panel
        const gridPanelY = c.STATS_PANEL_Y + statsPanelHeight + c.GRID_PANEL_GAP;
        const rows = Math.ceil(stats.cardCount / c.GRID_COLUMNS);
        const gridInnerWidth = c.LEFT_WIDTH - 2 * c.GRID_PADDING;
        const cardWidth = (gridInnerWidth - (c.GRID_COLUMNS - 1) * c.CARD_GAP) / c.GRID_COLUMNS;
        const gridPanelHeight =
            2 * c.GRID_PADDING + rows * c.CARD_HEIGHT + (rows - 1) * c.CARD_GAP;

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

    /** A face-down card showing a red "R", "/" and green "R". */
    private createCard(x: number, y: number, width: number): Konva.Group {
        const card = new Konva.Group({ x, y });
        card.add(new Konva.Rect({
            width,
            height: c.CARD_HEIGHT,
            fill: c.CARD_FILL,
            stroke: c.CARD_STROKE,
            strokeWidth: 2,
            cornerRadius: c.RADIUS,
        }));

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
        label.x((width - textX) / 2);
        label.y((c.CARD_HEIGHT - c.CARD_FONT_SIZE) / 2);
        card.add(label);
        return card;
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
