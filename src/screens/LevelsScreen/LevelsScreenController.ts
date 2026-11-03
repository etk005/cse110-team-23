import type { LevelManifest } from "../../shared/types";
import type { Screen, ScreenController, ScreenSwitcher, View } from "../../types";
import { LevelsScreenModel } from "./LevelsScreenModel";
import { LevelsScreenView } from "./LevelsScreenView";

export class LevelsScreenController implements ScreenController {
    private model: LevelsScreenModel;
    private view: LevelsScreenView;

    constructor(private screenSwitcher: ScreenSwitcher) {
        const onLevelSelect = (name: string): void => {
            this.screenSwitcher.switchToScreen({
                type: "loading",
                loader: async (): Promise<Screen> => {
                    const level = this.model.getLevel(name) ?? await this.model.loadLevel(name);
                    return { type: "game", level };
                }
            })
        };

        this.model = new LevelsScreenModel();
        this.view = new LevelsScreenView(onLevelSelect);
    }

    getView(): View {
        return this.view;
    }

    show(): void {
        this.view.show();
    }

    hide(): void {
        this.view.hide();
    }

    init(manifest: LevelManifest): void {
        this.view.init(manifest);
    }

    load(): void {
        this.screenSwitcher.switchToScreen({
            type: "loading",
            loader: async (): Promise<Screen> => {
                this.init(await this.model.loadLevelManifest());
                return { type: "levels" };
            }
        });
    }

    isLoaded(): boolean {
        return this.model.getLevelManifest() !== null;
    }
}