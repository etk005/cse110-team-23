
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ResultsScreenModel } from "./ResultsScreenModel.ts";
import { ResultsScreenView } from "./ResultsScreenView.ts";

/** Controls the results screen: displays final score and routes Play Again / Main Menu. */
export class ResultsScreenController extends ScreenController {
    private model: ResultsScreenModel;
    private view: ResultsScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();

        this.model = new ResultsScreenModel();

        this.view = new ResultsScreenView(
            () => screenSwitcher.switchToScreen({ type: "game" }),
            () => screenSwitcher.switchToScreen({ type: "menu" })
        );
    }

    /** Stores the score, renders the results, and shows the screen. */
    showResults(score: number): void {
        this.model.setScore(score);

        this.view.render(
            this.model.getScore(),
            this.model.isWin()
        );

        this.show();
    }

    getView(): ResultsScreenView {
        return this.view;
    }
}
