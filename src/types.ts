
import Konva from "konva";

export type Screen =
    | { type: "menu" }
    | { type: "game" }
    | { type: "result"; score: number };

export interface ScreenSwitcher {
    switchToScreen(screen: Screen): void;
}

export interface View {
    show(): void;
    hide(): void;
    getGroup(): Konva.Group;
}

export abstract class ScreenController {
    abstract getView(): View;

    show(): void {
        this.getView().show();
    }

    hide(): void {
        this.getView().hide();
    }
}
