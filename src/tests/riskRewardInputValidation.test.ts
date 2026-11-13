import { describe, expect, it } from "vitest";
import { RiskRewardScreenController } from "../screens/RiskRewardScreen/RiskRewardScreenController.ts";

const validate = RiskRewardScreenController.validateInput;

describe("Risk/Reward input validation", () => {
    it("doesn't flag an empty box", () => {
        expect(validate("risk", "")).toBeNull();
        expect(validate("expectedValue", "  ")).toBeNull();
    });

    it("accepts fractions and decimals for the probabilities", () => {
        expect(validate("risk", "1/3")?.ok).toBe(true);
        expect(validate("reward", "0.67")?.ok).toBe(true);
    });

    it("rejects probabilities above 1 or badly formatted", () => {
        expect(validate("risk", "3/2")?.ok).toBe(false);
        expect(validate("reward", "abc")?.ok).toBe(false);
    });

    it("allows negative and greater-than-1 expected values", () => {
        expect(validate("expectedValue", "-36/17")?.ok).toBe(true);
        expect(validate("expectedValue", "1.33")?.ok).toBe(true);
        expect(validate("expectedValue", "2..0")?.ok).toBe(false);
    });
});
