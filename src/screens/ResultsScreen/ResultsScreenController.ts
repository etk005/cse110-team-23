
import { ScreenController } from "../../types.ts";
import type { Screen, ScreenSwitcher } from "../../types.ts";
import { levelSchema } from "../../shared/schemas.ts";
import { ResultsScreenModel } from "./ResultsScreenModel.ts";
import { ResultsScreenView } from "./ResultsScreenView.ts";

/** Controls the results screen: displays final score and routes Play Again / Main Menu. */
export class ResultsScreenController extends ScreenController {
    private model: ResultsScreenModel;
    private view: ResultsScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;

        this.model = new ResultsScreenModel();

        this.view = new ResultsScreenView(
            () => this.screenSwitcher.switchToScreen({ type: "game" }),
            () => this.goToNextLevel(),
            () => this.screenSwitcher.switchToScreen({ type: "levels" })
        );
    }

    /** Stores the score, renders the results, and shows the screen. */
    showResults(result: Extract<Screen, { type: "result" }>): void {
        this.model.setResult(result);

        this.view.render(
            this.model.getResult()
        );

        this.show();
    }

    private goToNextLevel(): void {
        const currentLevelId = this.model.getResult().levelId;
        const nextLevelId = currentLevelId + 1;

        this.screenSwitcher.switchToScreen({
            type: "loading",
            loader: async (): Promise<Screen> => {
                try {
                    const response = await fetch(`levels/${nextLevelId}.json`);
                    if (!response.ok) {
                        return { type: "levels" };
                    }

                    const levelData = await response.json();
                    const level = levelSchema.parse(levelData);

                    return { type: "game", level };
                } catch {
                    return { type: "levels" };
                }
            },
        });
    }

    getView(): ResultsScreenView {
        return this.view;
    }
}
