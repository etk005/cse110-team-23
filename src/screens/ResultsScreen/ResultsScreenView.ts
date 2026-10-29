
import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS } from "../../constants.ts";

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

        this.addButton("Play Again", 230, 350, onRestart);
        this.addButton("Main Menu", 430, 350, onMenu);
    }

    render(score: number, won: boolean): void {
        this.group.find(".resultText").forEach((node) => node.destroy());

        const title = new Konva.Text({
            name: "resultText",
            x: 100,
            y: 150,
            width: 600,
            text: won ? "LEVEL COMPLETE!" : "GAME OVER",
            fontSize: 40,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        const scoreText = new Konva.Text({
            name: "resultText",
            x: 100,
            y: 245,
            width: 600,
            text: `Questions Answered: ${score}/3`,
            fontSize: 25,
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

        group.add(new Konva.Rect({
            width: 150,
            height: 55,
            fill: COLORS.button,
            cornerRadius: 10,
        }));

        group.add(new Konva.Text({
            text: label,
            width: 150,
            height: 55,
            fontSize: 18,
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
