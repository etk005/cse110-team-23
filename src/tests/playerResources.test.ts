import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    PlayerResources,
    STARTING_COINS,
    levelPoints,
} from "../game/playerResources.ts";

describe("levelPoints", () => {
    it("gives full points for a level cleared with no strikes", () => {
        expect(levelPoints(true, 0)).toBe(10);
    });

    it("takes one point off for each strike", () => {
        expect(levelPoints(true, 2)).toBe(8);
    });

    it("never goes below zero", () => {
        expect(levelPoints(true, 50)).toBe(0);
    });

    it("gives nothing for a failed level", () => {
        expect(levelPoints(false, 0)).toBe(0);
        expect(levelPoints(false, 3)).toBe(0);
    });
});

describe("PlayerResources", () => {
    let resources: PlayerResources;

    beforeEach(() => {
        resources = new PlayerResources();
    });

    it("starts with the starting coins and no score", () => {
        expect(resources.getCoins()).toBe(STARTING_COINS);
        expect(STARTING_COINS).toBe(10);
        expect(resources.getScore()).toBe(0);
    });

    it("adds earned coins", () => {
        resources.earnCoins(5);

        expect(resources.getCoins()).toBe(15);
    });

    it("spends coins when the balance is enough", () => {
        expect(resources.spendCoins(4)).toBe(true);
        expect(resources.getCoins()).toBe(6);
    });

    it("can spend the whole balance", () => {
        expect(resources.spendCoins(10)).toBe(true);
        expect(resources.getCoins()).toBe(0);
    });

    it("refuses to spend more coins than the player has", () => {
        expect(resources.spendCoins(11)).toBe(false);
        expect(resources.getCoins()).toBe(10);
    });

    it("rejects zero or negative amounts", () => {
        expect(() => resources.earnCoins(0)).toThrow(RangeError);
        expect(() => resources.earnCoins(-1)).toThrow(RangeError);
        expect(() => resources.spendCoins(0)).toThrow(RangeError);
        expect(() => resources.spendCoins(-3)).toThrow(RangeError);
        expect(resources.getCoins()).toBe(10);
    });

    it("adds up the results of different levels", () => {
        resources.recordLevelResult(1, 8);
        resources.recordLevelResult(2, 10);

        expect(resources.getScore()).toBe(18);
    });

    it("keeps only the best result for a replayed level", () => {
        resources.recordLevelResult(1, 6);
        resources.recordLevelResult(1, 9);
        resources.recordLevelResult(1, 3);

        expect(resources.getBestLevelPoints(1)).toBe(9);
        expect(resources.getScore()).toBe(9);
    });

    it("notifies listeners when coins or score change", () => {
        const listener = vi.fn();
        resources.onChange(listener);

        resources.earnCoins(1);
        resources.spendCoins(2);
        resources.recordLevelResult(1, 5);

        expect(listener).toHaveBeenCalledTimes(3);
    });

    it("does not notify when nothing changes", () => {
        const listener = vi.fn();
        resources.recordLevelResult(1, 5);
        resources.onChange(listener);

        resources.spendCoins(100); // not enough coins
        resources.recordLevelResult(1, 4); // not a new best

        expect(listener).not.toHaveBeenCalled();
    });

    it("stops notifying a removed listener", () => {
        const listener = vi.fn();
        const remove = resources.onChange(listener);

        remove();
        resources.earnCoins(1);

        expect(listener).not.toHaveBeenCalled();
    });
});
