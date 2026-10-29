
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";

export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new MenuScreenView(() => this.handleStartClick());
    }

    private handleStartClick(): void {
        this.screenSwitcher.switchToScreen({ type: "game" });
    }

    getView(): MenuScreenView {
        return this.view;
    }
}
