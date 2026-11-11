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

/** Submits correct answers so the cards unlock. */
function unlock(model: RiskRewardScreenModel): void {
    model.checkAnswers(correctInputs(model));
}

describe("Risk/Reward answer feedback (#15)", () => {
    it("starts with cards locked", () => {
        expect(new RiskRewardScreenModel().getPhase()).toBe("calculating");
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
