import { ScreenController } from "../../types.ts";
import { RiskRewardScreenModel } from "./RiskRewardScreenModel.ts";
import { RiskRewardScreenView } from "./RiskRewardScreenView.ts";

/** Controls the Risk/Reward minigame screen. */
export class RiskRewardScreenController extends ScreenController {
    private model: RiskRewardScreenModel;
    private view: RiskRewardScreenView;

    constructor() {
        super();
        this.model = new RiskRewardScreenModel();
        this.view = new RiskRewardScreenView();
    }

    /** Starts a new minigame: fresh shuffled deck, chips reset to 0. */
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

    getModel(): RiskRewardScreenModel {
        return this.model;
    }

    getView(): RiskRewardScreenView {
        return this.view;
    }
}
