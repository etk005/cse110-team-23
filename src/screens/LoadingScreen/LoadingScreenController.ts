import type { Screen, ScreenController, ScreenSwitcher, View } from "../../types";
import { LoadingScreenView } from "./LoadingScreenView";

export type Loader = () => Screen | Promise<Screen>;

export class LoadingScreenController implements ScreenController {
    private view: LoadingScreenView;

    constructor(private screenSwitcher: ScreenSwitcher) {
        this.view = new LoadingScreenView();
    }

    wait(loader: Loader): void {
        Promise.resolve()
            .then(loader)
            .then(x => this.screenSwitcher.switchToScreen(x))
            .catch(error => {
                // don't leave the player stuck on "Loading..." if a level fails to load
                console.error("Failed to load screen", error);
                this.screenSwitcher.switchToScreen({ type: "menu" });
            });
        this.show();
    }

    show(): void {
        this.view.show();
    }

    hide(): void {
        this.view.hide();
    }

    getView(): View {
        return this.view;
    }
}