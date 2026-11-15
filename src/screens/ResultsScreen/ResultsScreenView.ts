
import Konva from "konva";
import type { View } from "../../types.ts";
import {
    STAGE_WIDTH,
    STAGE_HEIGHT,
    COLORS,
    RESULTS_SCREEN_CONSTANTS,
} from "../../constants.ts";

const c = RESULTS_SCREEN_CONSTANTS;

/** Renders the end-of-level screen with title, points, totals, and Play Again / Main Menu buttons. */
export class ResultsScreenView implements View {
    private group: Konva.Group;

    constructor(onRestart: () => void, onMenu: () => void) {
        this.group = new Konva.Group({ visible: false });

        const background = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        });

        this.group.add(background);

        this.addButton("Play Again", c.PLAY_AGAIN_X, c.BUTTON_Y, onRestart);
        this.addButton("Main Menu", c.MENU_X, c.BUTTON_Y, onMenu);
    }

    render(points: number, won: boolean, totalScore: number, coins: number): void {
        this.group.find(".resultText").forEach((node) => node.destroy());

        const title = new Konva.Text({
            name: "resultText",
            x: c.TEXT_X,
            y: c.TITLE_Y,
            width: c.TEXT_WIDTH,
            text: won ? "LEVEL COMPLETE!" : "GAME OVER",
            fontSize: c.TITLE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        const scoreText = new Konva.Text({
            name: "resultText",
            x: c.TEXT_X,
            y: c.SCORE_Y,
            width: c.TEXT_WIDTH,
            text: `Points this level: ${points}`,
            fontSize: c.SCORE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        const totalsText = new Konva.Text({
            name: "resultText",
            x: c.TEXT_X,
            y: c.TOTALS_Y,
            width: c.TEXT_WIDTH,
            text: `Total score: ${totalScore}    Coins: ${coins}`,
            fontSize: c.TOTALS_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        this.group.add(title, scoreText, totalsText);
        this.group.getLayer()?.draw();
    }

    private addButton(
        label: string,
        x: number,
        y: number,
        onClick: () => void
    ): void {
        const group = new Konva.Group({ x, y });

        group.add(new Konva.Rect({
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fill: COLORS.button,
            cornerRadius: c.BUTTON_RADIUS,
        }));

        group.add(new Konva.Text({
            text: label,
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fontSize: c.BUTTON_FONT_SIZE,
            fill: COLORS.text,
            align: "center",
            verticalAlign: "middle",
        }));

        group.on("click tap", onClick);
        this.group.add(group);
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
