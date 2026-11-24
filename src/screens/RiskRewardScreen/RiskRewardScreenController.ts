import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RiskRewardScreenModel } from "./RiskRewardScreenModel.ts";
import type { AnswerCheck, CalcField } from "./RiskRewardScreenModel.ts";
import { RiskRewardScreenView } from "./RiskRewardScreenView.ts";
import type { RiskRewardViewState } from "./RiskRewardScreenView.ts";
import { PlayerResources } from "../../game/playerResources.ts";
import { parseNumber, parseProbability } from "../../game/numberInput.ts";
import type { ParseResult } from "../../game/numberInput.ts";

const CALC_FIELDS: CalcField[] = ["risk", "reward", "expectedValue"];

/**
 * Controls the Risk/Reward minigame screen. Each round: the player enters
 * P(Risk), P(Reward) and the expected value of a flip, submits, and once all
 * three are correct flips a card. A Reward lets them cash out or continue;
 * a Risk ends the game and loses their temporary chips.
 */
export class RiskRewardScreenController extends ScreenController {
    private model: RiskRewardScreenModel;
    private view: RiskRewardScreenView;
    // Status line shown in the calculations panel
    private message = "";
    private messageTone: RiskRewardViewState["messageTone"] = "info";

    /**
     * @param screenSwitcher Used by the Menu buttons to leave the minigame
     * @param resources The player's coins; Cash Out turns minigame chips into coins
     */
    constructor(
        screenSwitcher: ScreenSwitcher,
        private resources: PlayerResources = new PlayerResources(),
        random: () => number = Math.random
    ) {
        super();
        this.model = new RiskRewardScreenModel(random);
        this.view = new RiskRewardScreenView({
            onMenu: () => screenSwitcher.switchToScreen({ type: "menu" }),
            onInputChange: (field, text) => this.handleInputChange(field, text),
            onSubmit: () => this.submitAnswers(),
            onFlip: (index) => this.flipCard(index),
            onCashOut: () => this.cashOut(),
            onContinue: () => this.continueRound(),
        });
    }

    /** Starts a new minigame: fresh shuffled deck, 0 temporary chips, empty inputs. */
    startGame(): void {
        this.model.start();
        this.view.clearInputs();
        // a new game starts with Quick Rules closed, so the inputs aren't hidden
        this.view.setRulesOpen(false);
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
            coins: this.resources.getCoins(),
            phase: this.model.getPhase(),
            canContinue: this.model.canContinue(),
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
            const chips = this.model.getChips();
            this.setMessage(
                this.model.canContinue()
                    ? `Reward +${card.value}! You now have ${chips} chips. Cash out to keep them, or continue for more.`
                    : `Reward +${card.value}! That was the last card — cash out your ${chips} chips.`,
                "success"
            );
        } else {
            this.setMessage("Risk! You lost all your minigame chips. Game over.", "error");
        }
        this.refresh();
    }

    /** Turns the temporary chips into coins and ends the minigame. */
    cashOut(): void {
        if (this.model.getPhase() !== "reward") {
            return;
        }
        const banked = this.model.cashOut();
        if (banked > 0) {
            this.resources.earnCoins(banked);
        }
        this.setMessage(
            `You cashed out ${banked} chips for ${banked} coins! Total game coins: ${this.resources.getCoins()}.`,
            "success"
        );
        this.refresh();
    }

    /** Next round with the remaining deck: chips kept, inputs cleared, cards locked again. */
    continueRound(): void {
        if (!this.model.continueRound()) {
            return;
        }
        this.view.clearInputs();
        this.setMessage("New round: recalculate with the cards that are left.", "info");
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
