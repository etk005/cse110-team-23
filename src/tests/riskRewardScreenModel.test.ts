import { describe, expect, it } from "vitest";
import {
    RiskRewardScreenModel,
    RISK_CARD_COUNT,
    REWARD_CARD_COUNT,
} from "../screens/RiskRewardScreen/RiskRewardScreenModel.ts";

describe("RiskRewardScreenModel", () => {
    it("creates a deck with the fixed number of Risk and Reward cards", () => {
        const deck = RiskRewardScreenModel.createDeck();

        expect(deck).toHaveLength(RISK_CARD_COUNT + REWARD_CARD_COUNT);
        expect(deck.filter((c) => c === "risk")).toHaveLength(RISK_CARD_COUNT);
        expect(deck.filter((c) => c === "reward")).toHaveLength(REWARD_CARD_COUNT);
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
        expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it("rebuilds the deck and resets chips when restarted", () => {
        const model = new RiskRewardScreenModel();
        model.start();

        expect(model.getDeck()).toHaveLength(21);
        expect(model.getRiskCount()).toBe(7);
        expect(model.getChips()).toBe(0);
    });
});
