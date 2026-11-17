import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";

export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.view = new MenuScreenView(
            () => screenSwitcher.switchToScreen({ type: "game" }),
            () => screenSwitcher.switchToScreen({ type: "riskReward" }),
            () => screenSwitcher.switchToScreen({ type: "dieMiniGame" }) // <--- Triggers your new minigame
        );
    }

    getView(): MenuScreenView {
        return this.view;
    }
}