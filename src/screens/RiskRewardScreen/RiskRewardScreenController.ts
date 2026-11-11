import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RiskRewardScreenModel } from "./RiskRewardScreenModel.ts";
import type { AnswerCheck, CalcField } from "./RiskRewardScreenModel.ts";
import { RiskRewardScreenView } from "./RiskRewardScreenView.ts";
import type { RiskRewardViewState } from "./RiskRewardScreenView.ts";
import { parseNumber, parseProbability } from "../../game/numberInput.ts";
import type { ParseResult } from "../../game/numberInput.ts";

const CALC_FIELDS: CalcField[] = ["risk", "reward", "expectedValue"];

/**
 * Controls the Risk/Reward minigame screen. Each round: the player enters
 * P(Risk), P(Reward) and the expected value of a flip, submits, and once all
 * three are correct flips a card. A Reward adds chips and starts the next
 * round; a Risk ends the game.
 */
export class RiskRewardScreenController extends ScreenController {
    private model: RiskRewardScreenModel;
    private view: RiskRewardScreenView;
    // Status line shown in the calculations panel
    private message = "";
    private messageTone: RiskRewardViewState["messageTone"] = "info";

    /** @param screenSwitcher Used by the Menu button to leave the minigame */
    constructor(screenSwitcher: ScreenSwitcher, random: () => number = Math.random) {
        super();
        this.model = new RiskRewardScreenModel(random);
        this.view = new RiskRewardScreenView({
            onMenu: () => screenSwitcher.switchToScreen({ type: "menu" }),
            onInputChange: (field, text) => this.handleInputChange(field, text),
            onSubmit: () => this.submitAnswers(),
            onFlip: (index) => this.flipCard(index),
        });
    }

    /** Starts a new minigame: fresh shuffled deck, 0 temporary chips, empty inputs. */
    startGame(): void {
        this.model.start();
        this.view.clearInputs();
        this.setMessage("Work out the three values, then press Submit.", "info");
        this.refresh();
        this.show();
    }

    /** Redraws the screen from the model. */
    refresh(): void {
        this.view.render({
            cards: this.model.getCardFaces(),
            cardCount: this.model.getTotalCount(),
            riskCount: this.model.getRiskCount(),
            rewardCount: this.model.getRewardCount(),
            rewardCounts: this.model.getRewardCountByValue(),
            chips: this.model.getChips(),
            phase: this.model.getPhase(),
            message: this.message,
            messageTone: this.messageTone,
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
        if (this.model.getPhase() !== "calculating") {
            return;
        }
        const result = RiskRewardScreenController.validateInput(field, text);
        this.view.setFieldFeedback(field, result && !result.ok ? result.error : null);
    }

    /** Submit: mark each answer, and unlock the cards if all three are right. */
    submitAnswers(): AnswerCheck | null {
        if (this.model.getPhase() !== "calculating") {
            return null;
        }
        const inputs = this.view.getInputValues();
        const result = this.model.checkAnswers(inputs);

        for (const field of CALC_FIELDS) {
            if (result[field] === "correct") {
                this.view.setFieldFeedback(field, "✓ Correct", "success");
            } else if (result[field] === "incorrect") {
                this.view.setFieldFeedback(field, "✗ Not quite — try again.");
            } else {
                const parsed = RiskRewardScreenController.validateInput(field, inputs[field]);
                this.view.setFieldFeedback(field, parsed && !parsed.ok ? parsed.error : "Enter a value.");
            }
        }

        if (this.model.getPhase() === "flipping") {
            this.setMessage("All correct! Click a card to flip it.", "success");
        } else {
            const wrong = CALC_FIELDS.filter((field) => result[field] !== "correct").length;
            this.setMessage(
                `${wrong} answer${wrong === 1 ? " needs" : "s need"} fixing before you can flip.`,
                "error"
            );
        }
        this.refresh();
        return result;
    }

    /** Flips the card at grid position `index` (ignored unless cards are unlocked). */
    flipCard(index: number): void {
        const card = this.model.flip(index);
        if (card === null) {
            return;
        }
        if (card.type === "reward") {
            this.view.clearInputs();
            this.setMessage(
                `Reward +${card.value}! You now have ${this.model.getChips()} chips. Recalculate for the next flip.`,
                "success"
            );
        } else {
            this.setMessage("Risk! Game over.", "error");
        }
        this.refresh();
    }

    private setMessage(message: string, tone: RiskRewardViewState["messageTone"]): void {
        this.message = message;
        this.messageTone = tone;
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
