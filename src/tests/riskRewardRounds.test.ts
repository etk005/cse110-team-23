import { describe, expect, it } from "vitest";
import {
    RiskRewardScreenModel,
} from "../screens/RiskRewardScreen/RiskRewardScreenModel.ts";
import type { CalcField } from "../screens/RiskRewardScreen/RiskRewardScreenModel.ts";

/** Typed answers matching the model's current correct values. */
function correctInputs(model: RiskRewardScreenModel): Record<CalcField, string> {
    const answers = model.getCorrectAnswers();
    return {
        risk: String(answers.risk),
        reward: String(answers.reward),
        expectedValue: String(answers.expectedValue),
    };
}

/** Grid position of the first face-down card of the given type. */
function indexOf(model: RiskRewardScreenModel, type: "risk" | "reward"): number {
    return model.getDeck().findIndex((card, i) => card.type === type && !model.isRevealed(i));
}

/** Submits correct answers so a card can be flipped. */
function unlock(model: RiskRewardScreenModel): void {
    model.checkAnswers(correctInputs(model));
}

describe("Risk/Reward answer feedback (#15)", () => {
    it("starts with cards locked", () => {
        const model = new RiskRewardScreenModel();
        expect(model.getPhase()).toBe("calculating");
        expect(model.flip(0)).toBeNull();
    });

    it("marks each answer correct, incorrect or invalid", () => {
        const model = new RiskRewardScreenModel();
        const result = model.checkAnswers({ risk: "7/21", reward: "1/2", expectedValue: "abc" });
        expect(result).toEqual({ risk: "correct", reward: "incorrect", expectedValue: "invalid" });
        expect(model.getPhase()).toBe("calculating");
    });

    it("accepts fractions and 2-decimal answers", () => {
        const model = new RiskRewardScreenModel();
        // 7 risk / 14 reward worth 1 / 0 chips: EV = 14/21 = 2/3
        const result = model.checkAnswers({ risk: "0.33", reward: "2/3", expectedValue: "0.67" });
        expect(Object.values(result)).toEqual(["correct", "correct", "correct"]);
    });

    it("unlocks flipping once all answers are correct, after a wrong try", () => {
        const model = new RiskRewardScreenModel();
        model.checkAnswers({ risk: "1/2", reward: "1/2", expectedValue: "1" });
        expect(model.getPhase()).toBe("calculating");
        unlock(model);
        expect(model.getPhase()).toBe("flipping");
    });
});

describe("Risk/Reward flipping (#16)", () => {
    it("reveals the chosen card and removes it from the counts", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        const index = indexOf(model, "reward");

        expect(model.flip(index)?.type).toBe("reward");
        expect(model.isRevealed(index)).toBe(true);
        expect(model.getCardFaces()[index]?.type).toBe("reward");
        expect(model.getTotalCount()).toBe(20);
        expect(model.getRewardCount()).toBe(13);
        expect(model.getRiskCount()).toBe(7);
    });

    it("a Reward adds its chips and starts the next round with cards locked", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        model.flip(indexOf(model, "reward"));
        expect(model.getChips()).toBe(1);
        expect(model.getPhase()).toBe("calculating");
        expect(model.flip(indexOf(model, "reward"))).toBeNull();
    });

    it("chips build up over several rewards", () => {
        const model = new RiskRewardScreenModel();
        for (let round = 0; round < 3; round++) {
            unlock(model);
            expect(model.flip(indexOf(model, "reward"))).toEqual({ type: "reward", value: 1 });
        }
        expect(model.getChips()).toBe(3);
    });

    it("a Risk ends the game and blocks further flips", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        expect(model.flip(indexOf(model, "risk"))).toEqual({ type: "risk" });
        expect(model.getPhase()).toBe("lost");
        model.checkAnswers(correctInputs(model));
        expect(model.getPhase()).toBe("lost");
        expect(model.flip(indexOf(model, "reward"))).toBeNull();
    });

    it("allows only one flip per round", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        model.flip(indexOf(model, "reward"));
        expect(model.flip(indexOf(model, "reward"))).toBeNull();
    });

    it("won't flip an already revealed card", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        const index = indexOf(model, "reward");
        model.flip(index);
        unlock(model);
        expect(model.flip(index)).toBeNull();
        expect(model.getPhase()).toBe("flipping");
    });

    it("ignores out-of-range positions", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        expect(model.flip(-1)).toBeNull();
        expect(model.flip(21)).toBeNull();
    });

    it("updates the correct answers after a flip", () => {
        const model = new RiskRewardScreenModel();
        unlock(model);
        model.flip(indexOf(model, "reward"));
        // 7 risk / 13 reward / 1 chip: 13/20 - 7/20 * 1 = 6/20
        expect(model.getCorrectAnswers().risk).toBeCloseTo(7 / 20);
        expect(model.getCorrectAnswers().reward).toBeCloseTo(13 / 20);
        expect(model.getCorrectAnswers().expectedValue).toBeCloseTo(6 / 20);
    });
});
