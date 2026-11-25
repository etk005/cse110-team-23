
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ResultsScreenModel } from "./ResultsScreenModel.ts";
import { ResultsScreenView } from "./ResultsScreenView.ts";
import type { PlayerResources } from "../../game/playerResources.ts";

/** Controls the results screen: displays the level's points and totals, and routes Play Again / Main Menu. */
export class ResultsScreenController extends ScreenController {
    private model: ResultsScreenModel;
    private view: ResultsScreenView;
    private resources: PlayerResources;

    constructor(screenSwitcher: ScreenSwitcher, resources: PlayerResources) {
        super();

        this.resources = resources;

        this.model = new ResultsScreenModel();

        this.view = new ResultsScreenView(
            () => screenSwitcher.switchToScreen({ type: "game" }),
            () => screenSwitcher.switchToScreen({ type: "menu" })
        );
    }

    /** Stores the outcome, renders the results, and shows the screen. */
    showResults(won: boolean, points: number): void {
        this.model.setResult(won, points);

        this.view.render(
            this.model.getPoints(),
            this.model.isWin(),
            this.resources.getScore(),
            this.resources.getCoins()
        );

        this.show();
    }

    getView(): ResultsScreenView {
        return this.view;
    }
}
