
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";

/** 
 * Controls the main menu screen and routes the Start button to the game. 
 * */
export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new MenuScreenView(
            () => this.handleStartClick(),
            // Risk/Reward button goes straight to the minigame
            () => this.screenSwitcher.switchToScreen({ type: "riskReward" })
        );
    }

    private handleStartClick(): void {
        this.screenSwitcher.switchToScreen({ type: "levels" });
    }

    getView(): MenuScreenView {
        return this.view;
    }
}
