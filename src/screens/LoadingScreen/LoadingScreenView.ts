import Konva from "konva";
import type { View } from "../../types";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants";

export class LoadingScreenView implements View {
    private group: Konva.Group;

    constructor() {
        this.group = new Konva.Group({
            visible: false,
            offsetX: -STAGE_WIDTH / 2,
            offsetY: -STAGE_HEIGHT / 2
        });
        const text = new Konva.Text({
            text: "Loading...",
            fill: "white",
            align: "center",
            verticalAlign: "middle"
        });
        this.group.add(text);
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
}