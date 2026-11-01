import Konva from "konva";
import type { View } from "../../types.ts";
import {
    STAGE_WIDTH,
    STAGE_HEIGHT,
    COLORS,
} from "../../constants.ts";

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

        this.addButton("Play Again", 552, 630, onRestart);
        this.addButton("Main Menu", 1032, 630, onMenu);
    }

    render(score: number, won: boolean): void {
        this.group.find(".resultText").forEach((node) => node.destroy());

        const title = new Konva.Text({
            name: "resultText",
            x: 240,
            y: 270,
            width: 1440,
            text: won ? "LEVEL COMPLETE!" : "GAME OVER",
            fontSize: 72,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        const scoreText = new Konva.Text({
            name: "resultText",
            x: 240,
            y: 441,
            width: 1440,
            text: `Questions Answered: ${score}/3`,
            fontSize: 45,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        this.group.add(title, scoreText);
        this.group.getLayer()?.draw();
    }

    private addButton(
        label: string,
        x: number,
        y: number,
        onClick: () => void
    ): void {
        const group = new Konva.Group({ x, y });

        const buttonWidth = 360;
        const buttonHeight = 99;

        group.add(new Konva.Rect({
            width: buttonWidth,
            height: buttonHeight,
            fill: COLORS.button,
            cornerRadius: 24,
        }));

        group.add(new Konva.Text({
            text: label,
            width: buttonWidth,
            height: buttonHeight,
            fontSize: 32,
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
