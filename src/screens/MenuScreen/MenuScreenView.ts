import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, COLORS } from "../../constants.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    constructor(onStartClick: () => void) {
        this.group = new Konva.Group({ visible: true });

        const title = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 270,
            text: "PROBABILITY GAME",
            fontSize: 79,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        title.offsetX(title.width() / 2);
        this.group.add(title);

        const subtitle = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 378,
            text: "Learn probability through cards and strategy",
            fontSize: 36,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        subtitle.offsetX(subtitle.width() / 2);
        this.group.add(subtitle);

        const startButtonGroup = new Konva.Group();

        const startButton = new Konva.Rect({
            x: STAGE_WIDTH / 2 - 240,
            y: 540,
            width: 480,
            height: 108,
            fill: COLORS.button,
            cornerRadius: 24,
            stroke: COLORS.buttonDark,
            strokeWidth: 7,
        });

        const startText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 567,
            text: "START GAME",
            fontSize: 43,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        startText.offsetX(startText.width() / 2);

        startButtonGroup.add(startButton);
        startButtonGroup.add(startText);
        startButtonGroup.on("click tap", onStartClick);

        this.group.add(startButtonGroup);
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
