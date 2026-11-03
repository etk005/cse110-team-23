import Konva from "konva";
import type { View } from "../../types";
import type { LevelManifest } from "../../shared/types";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS } from "../../constants";

const BUTTONS_PER_ROW = 4;
const ROWS_PER_PAGE = 3;
const BUTTON_WIDTH = 100;
const BUTTON_HEIGHT = 100;
const BUTTON_SPACING_X = 40;
const BUTTON_SPACING_Y = 40;

export type OnLevelSelect = (name: string) => void;

export class LevelsScreenView implements View {
    private group: Konva.Group;

    constructor(private onLevelSelect: OnLevelSelect) {
        this.group = new Konva.Group({
            visible: false,
            offsetX: -STAGE_WIDTH / 2,
            offsetY: -STAGE_HEIGHT / 2
        });

        const background = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        });

        this.group.add(background);
    }

    show(): void {
        this.group.show();
    }

    hide(): void {
        this.group.hide();
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    init(manifest: LevelManifest): void {
        manifest.forEach((level, index) => {
            const column = index % BUTTONS_PER_ROW, row = Math.floor(index / BUTTONS_PER_ROW);
            if (row >= ROWS_PER_PAGE) return;

            const group = new Konva.Group({
                offsetX: ((BUTTONS_PER_ROW - 1) / 2 - column) * (BUTTON_WIDTH + BUTTON_SPACING_X),
                offsetY: ((ROWS_PER_PAGE - 1) / 2 - row) * (BUTTON_HEIGHT + BUTTON_SPACING_Y)
            });
            const button = new Konva.Rect({
                width: BUTTON_WIDTH,
                height: BUTTON_HEIGHT,
                offsetX: BUTTON_WIDTH / 2,
                offsetY: BUTTON_HEIGHT / 2,
                fill: "white"
            });
            group.add(button);
            const label = new Konva.Text({
                text: level,
                fill: "red",
                align: "center",
                verticalAlign: "middle"
            });
            group.add(label);

            group.on("click", () => this.onLevelSelect(level));
            this.group.add(group);
        });
    }
}