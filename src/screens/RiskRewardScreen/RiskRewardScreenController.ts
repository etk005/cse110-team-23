import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RiskRewardScreenModel } from "./RiskRewardScreenModel.ts";
import type { CalcField } from "./RiskRewardScreenModel.ts";
import { RiskRewardScreenView } from "./RiskRewardScreenView.ts";
import { parseNumber, parseProbability } from "../../game/numberInput.ts";
import type { ParseResult } from "../../game/numberInput.ts";

/**
 * Controls the Risk/Reward minigame screen: draws the deck and chip counts,
 * and checks the format of the values the player types into the
 * calculations panel.
 */
export class RiskRewardScreenController extends ScreenController {
    private model: RiskRewardScreenModel;
    private view: RiskRewardScreenView;

    /** @param screenSwitcher Used by the Menu button to leave the minigame */
    constructor(screenSwitcher: ScreenSwitcher, random: () => number = Math.random) {
        super();
        this.model = new RiskRewardScreenModel(random);
        this.view = new RiskRewardScreenView({
            onMenu: () => screenSwitcher.switchToScreen({ type: "menu" }),
            onInputChange: (field, text) => this.handleInputChange(field, text),
        });
    }

    /** Starts a new minigame: fresh shuffled deck, 0 temporary chips, empty inputs. */
    startGame(): void {
        this.model.start();
        this.view.clearInputs();
        this.refresh();
        this.show();
    }

    /** Redraws the screen from the model. */
    refresh(): void {
        this.view.render({
            cardCount: this.model.getTotalCount(),
            riskCount: this.model.getRiskCount(),
            rewardCount: this.model.getRewardCount(),
            rewardCounts: this.model.getRewardCountByValue(),
            chips: this.model.getChips(),
        });
    }

    /**
     * Checks the format of a typed value: probabilities must be a fraction or
     * decimal between 0 and 1; the expected value can be any number, including
     * negatives. An empty box isn't flagged while the player is still typing.
     */
    static validateInput(field: CalcField, text: string): ParseResult | null {
        if (text.trim() === "") {
            return null;
        }
        return field === "expectedValue" ? parseNumber(text) : parseProbability(text);
    }

    /** Shows or clears the format error under the input that changed. */
    private handleInputChange(field: CalcField, text: string): void {
        const result = RiskRewardScreenController.validateInput(field, text);
        this.view.setFieldFeedback(field, result && !result.ok ? result.error : null);
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
