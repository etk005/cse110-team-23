import type { Screen, ScreenController, ScreenSwitcher, View } from "../../types";
import { LoadingScreenView } from "./LoadingScreenView";

export type Loader = () => Screen | Promise<Screen>;

export class LoadingScreenController implements ScreenController {
    private view: LoadingScreenView;

    constructor(private screenSwitcher: ScreenSwitcher) {
        this.view = new LoadingScreenView();
    }

    wait(loader: Loader): void {
        Promise.resolve(loader()).then(x => this.screenSwitcher.switchToScreen(x));
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