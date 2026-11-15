import { describe, expect, it } from "vitest";
import {
    RiskRewardScreenModel,
    RISK_CARD_COUNT,
    REWARD_CARD_COUNT,
    REWARD_CARD_VALUES,
} from "../screens/RiskRewardScreen/RiskRewardScreenModel.ts";

describe("RiskRewardScreenModel", () => {
    it("creates a deck with the fixed number of Risk and Reward cards", () => {
        const deck = RiskRewardScreenModel.createDeck();

        expect(deck).toHaveLength(RISK_CARD_COUNT + REWARD_CARD_COUNT);
        expect(deck.filter((c) => c.type === "risk")).toHaveLength(RISK_CARD_COUNT);
        expect(deck.filter((c) => c.type === "reward")).toHaveLength(REWARD_CARD_COUNT);
    });

    it("mixes Reward values as listed in REWARD_CARD_VALUES", () => {
        const deck = RiskRewardScreenModel.createDeck();
        for (const [value, count] of Object.entries(REWARD_CARD_VALUES)) {
            expect(
                deck.filter((c) => c.type === "reward" && c.value === Number(value))
            ).toHaveLength(count);
        }
        expect(REWARD_CARD_COUNT).toBe(14);
        expect(new RiskRewardScreenModel().getRewardCountByValue()).toEqual({ 1: 14 });
    });

    it("starts with the correct card counts", () => {
        const model = new RiskRewardScreenModel();

        expect(model.getDeck()).toHaveLength(21);
        expect(model.getRiskCount()).toBe(7);
        expect(model.getRewardCount()).toBe(14);
    });

    it("starts with a temporary chip balance of 0", () => {
        expect(new RiskRewardScreenModel().getChips()).toBe(0);
    });

    it("shuffles the deck without changing its contents", () => {
        const original = RiskRewardScreenModel.createDeck();
        const shuffled = RiskRewardScreenModel.shuffle(original, () => 0);

        expect(shuffled).not.toEqual(original);
        const key = (card: (typeof original)[number]): string =>
            card.type === "risk" ? "risk" : `reward+${card.value}`;
        expect(shuffled.map(key).sort()).toEqual(original.map(key).sort());
    });

    it("rebuilds the deck and resets chips when restarted", () => {
        const model = new RiskRewardScreenModel();
        model.start();

        expect(model.getDeck()).toHaveLength(21);
        expect(model.getRiskCount()).toBe(7);
        expect(model.getChips()).toBe(0);
    });

    it("starts with the probabilities from the full deck", () => {
        const model = new RiskRewardScreenModel();

        expect(model.getTotalCount()).toBe(21);
        expect(model.getRiskProbability()).toBeCloseTo(7 / 21);
        expect(model.getRewardProbability()).toBeCloseTo(14 / 21);
        expect(model.getRiskProbability() + model.getRewardProbability()).toBeCloseTo(1);
    });

    it("starts with P(Reward) * 1 chip as the expected value, since there are no chips to lose", () => {
        expect(new RiskRewardScreenModel().getExpectedValue()).toBeCloseTo(14 / 21);
    });

    it("calculates probabilities from any remaining deck", () => {
        expect(RiskRewardScreenModel.probability(6, 18)).toBeCloseTo(1 / 3);
        expect(RiskRewardScreenModel.probability(0, 10)).toBe(0);
        expect(RiskRewardScreenModel.probability(0, 0)).toBe(0);
    });

    it("weights each Reward value and the chips at stake", () => {
        // 7 risk, {+1: 6, +2: 5, +5: 1}, 3 chips: (6 + 10 + 5)/19 - 7/19 * 3 = 0
        expect(RiskRewardScreenModel.expectedValue(7, { 1: 6, 2: 5, 5: 1 }, 3)).toBeCloseTo(0);
        // 7 risk, {+1: 7, +2: 3, +5: 0}, 8 chips: (7 + 6)/17 - 7/17 * 8 = -43/17
        expect(RiskRewardScreenModel.expectedValue(7, { 1: 7, 2: 3, 5: 0 }, 8)).toBeCloseTo(-43 / 17);
        // No risk cards left: just the average reward
        expect(RiskRewardScreenModel.expectedValue(0, { 1: 1, 5: 1 }, 20)).toBeCloseTo(3);
        // Only risk cards left: you lose everything
        expect(RiskRewardScreenModel.expectedValue(3, { 1: 0, 2: 0, 5: 0 }, 6)).toBeCloseTo(-6);
        // Empty deck
        expect(RiskRewardScreenModel.expectedValue(0, {}, 4)).toBe(0);
    });

    it("depends on which Reward cards are gone, not just how many", () => {
        // Same counts (7 risk, 13 reward, 0 chips), different card taken out
        const tookA5 = RiskRewardScreenModel.expectedValue(7, { 1: 7, 2: 5, 5: 1 }, 0);
        const tookA1 = RiskRewardScreenModel.expectedValue(7, { 1: 6, 2: 5, 5: 2 }, 0);
        expect(tookA5).toBeCloseTo(22 / 20);
        expect(tookA1).toBeCloseTo(26 / 20);
        expect(tookA5).toBeLessThan(tookA1);
        expect(RiskRewardScreenModel.probability(7, 20)).toBeGreaterThan(
            RiskRewardScreenModel.probability(7, 21)
        );
    });
});
