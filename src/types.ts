import Konva from "konva";
import type { Level } from "./shared/types";
import type { Loader } from "./screens/LoadingScreen/LoadingScreenController";

/** 
 * Union of all screens the app can navigate to. 
 * */
export type Screen =
    | { type: "menu" }
    | { type: "game", level?: Level }
    | { type: "result"; won: boolean; points: number }
    | { type: "levels" }
    | { type: "riskReward" } // Risk/Reward minigame; starts a fresh game each time
    | { type: "loading"; loader: Loader };

/** 
 * Implemented by the top-level App to handle screen transitions. 
 * */
export interface ScreenSwitcher {
    switchToScreen(screen: Screen): void;
}

/** 
 * Common interface for every renderable screen view. 
 * */
export interface View {
    show(): void;
    hide(): void;
    getGroup(): Konva.Group;
}

/** 
 * Base class for screen controllers - delegates show/hide to the view. 
 * */
export abstract class ScreenController {
    abstract getView(): View;

    show(): void {
        this.getView().show();
    }

    hide(): void {
        this.getView().hide();
    }
}
