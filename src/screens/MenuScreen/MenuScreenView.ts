import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, COLORS, MENU_SCREEN_CONSTANTS } from "../../constants.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    constructor(onStartClick: () => void) {
        this.group = new Konva.Group({ visible: true });
        const c = MENU_SCREEN_CONSTANTS;

        const title = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.TITLE_Y,
            text: "PROBABILITY GAME",
            fontSize: c.TITLE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        title.offsetX(title.width() / 2);
        this.group.add(title);

        const subtitle = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.SUBTITLE_Y,
            text: "Learn probability through cards and strategy",
            fontSize: c.SUBTITLE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        subtitle.offsetX(subtitle.width() / 2);
        this.group.add(subtitle);

        const startButtonGroup = new Konva.Group();

        const startButton = new Konva.Rect({
            x: (STAGE_WIDTH - c.BUTTON_WIDTH) / 2,
            y: c.BUTTON_Y,
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fill: COLORS.button,
            cornerRadius: c.BUTTON_RADIUS,
            stroke: COLORS.buttonDark,
            strokeWidth: c.BUTTON_STROKE,
        });

        const startText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "START GAME",
            fontSize: c.BUTTON_FONT_SIZE,
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
