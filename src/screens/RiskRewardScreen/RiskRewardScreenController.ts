import { ScreenController } from "../../types.ts";
import { RiskRewardScreenModel } from "./RiskRewardScreenModel.ts";
import { RiskRewardScreenView } from "./RiskRewardScreenView.ts";

/**
 * Controls the Risk/Reward minigame screen. Connects the model (deck and
 * chips) to the view (what's drawn). show()/hide() come from ScreenController.
 */
export class RiskRewardScreenController extends ScreenController {
    private model: RiskRewardScreenModel;
    private view: RiskRewardScreenView;

    constructor() {
        super();
        this.model = new RiskRewardScreenModel();
        this.view = new RiskRewardScreenView();
    }

    /**
     * Starts a new minigame: builds a fresh shuffled deck, resets chips to 0,
     * draws the screen with the starting counts, then shows it.
     */
    startGame(): void {
        this.model.start();
        this.view.render({
            cardCount: this.model.getDeck().length,
            riskCount: this.model.getRiskCount(),
            rewardCount: this.model.getRewardCount(),
            chips: this.model.getChips(),
        });
        this.show();
    }

    /** Exposes the model (useful for tests). */
    getModel(): RiskRewardScreenModel {
        return this.model;
    }

    /** Required by ScreenController; main.ts uses it to add the view to the layer. */
    getView(): RiskRewardScreenView {
        return this.view;
    }
}
