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

    it("adds earned coins", async () => {
        await resources.earnCoins(5);

        expect(resources.getCoins()).toBe(15);
    });

    it("spends coins when the balance is enough", async () => {
        expect(await resources.spendCoins(4)).toBe(true);
        expect(resources.getCoins()).toBe(6);
    });

    it("can spend the whole balance", async () => {
        expect(await resources.spendCoins(10)).toBe(true);
        expect(resources.getCoins()).toBe(0);
    });

    it("refuses to spend more coins than the player has", async () => {
        expect(await resources.spendCoins(11)).toBe(false);
        expect(resources.getCoins()).toBe(10);
    });

    it("rejects zero or negative amounts", async () => {
        await expect(resources.earnCoins(0)).rejects.toThrow(RangeError);
        await expect(resources.earnCoins(-1)).rejects.toThrow(RangeError);
        await expect(resources.spendCoins(0)).rejects.toThrow(RangeError);
        await expect(resources.spendCoins(-3)).rejects.toThrow(RangeError);
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

    it("notifies listeners when coins or score change", async () => {
        const listener = vi.fn();
        resources.onChange(listener);

        await resources.earnCoins(1);
        await resources.spendCoins(2);
        resources.recordLevelResult(1, 5);

        expect(listener).toHaveBeenCalledTimes(3);
    });

    it("does not notify when nothing changes", async () => {
        const listener = vi.fn();
        resources.recordLevelResult(1, 5);
        resources.onChange(listener);

        await resources.spendCoins(100); // not enough coins
        resources.recordLevelResult(1, 4); // not a new best

        expect(listener).not.toHaveBeenCalled();
    });

    it("stops notifying a removed listener", async () => {
        const listener = vi.fn();
        const remove = resources.onChange(listener);

        remove();
        await resources.earnCoins(1);

        expect(listener).not.toHaveBeenCalled();
    });

    it("resets coins and level points", () => {
        resources.recordLevelResult(1, 10);
        resources.setCoins(50);
        expect(resources.getCoins()).toBe(50);
        expect(resources.getScore()).toBe(10);

        resources.reset();
        expect(resources.getCoins()).toBe(STARTING_COINS);
        expect(resources.getScore()).toBe(0);
    });
});

describe("PlayerResources - Supabase Integration", () => {
    function makeMockClient(user: { id: string } | null = { id: "test-user-id" }) {
        const selectSingleMock = vi.fn().mockResolvedValue({ data: { coins: 42 }, error: null });
        const updateSingleMock = vi.fn().mockResolvedValue({ data: { coins: 32 }, error: null });
        const insertMock = vi.fn().mockResolvedValue({ error: null });

        const fromMock = vi.fn((_table: string) => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: selectSingleMock,
                    single: selectSingleMock,
                })),
            })),
            update: vi.fn((_updates: any) => ({
                eq: vi.fn((_col1: string, _val1: any) => ({
                    eq: vi.fn((_col2: string, _val2: any) => ({
                        select: vi.fn(() => ({
                            single: updateSingleMock,
                        })),
                    })),
                })),
            })),
            insert: insertMock,
        }));

        const authMock = {
            getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
        };

        return {
            client: {
                from: fromMock as any,
                auth: authMock as any,
            } as any,
            fromMock,
            authMock,
            selectSingleMock,
            updateSingleMock,
            insertMock,
        };
    }

    it("loads coins from Supabase for authenticated user", async () => {
        const { client, selectSingleMock } = makeMockClient();
        const resources = new PlayerResources(10, client);

        const coins = await resources.load();

        expect(coins).toBe(42);
        expect(resources.getCoins()).toBe(42);
        expect(selectSingleMock).toHaveBeenCalled();
    });

    it("inserts initial coins row if user has none in Supabase", async () => {
        const { client, selectSingleMock, insertMock } = makeMockClient();
        selectSingleMock.mockResolvedValueOnce({ data: null, error: null });
        const resources = new PlayerResources(15, client);

        const coins = await resources.load();

        expect(coins).toBe(15);
        expect(insertMock).toHaveBeenCalledWith({ user_id: "test-user-id", coins: 15 });
    });

    it("persists coin spending to Supabase with optimistic check", async () => {
        const { client, updateSingleMock } = makeMockClient();
        const resources = new PlayerResources(20, client);

        const spent = await resources.spendCoins(5);

        expect(spent).toBe(true);
        expect(resources.getCoins()).toBe(15);
        expect(updateSingleMock).toHaveBeenCalled();
    });

    it("persists coin earning to Supabase with optimistic check", async () => {
        const { client, updateSingleMock } = makeMockClient();
        const resources = new PlayerResources(20, client);

        await resources.earnCoins(10);

        expect(resources.getCoins()).toBe(30);
        expect(updateSingleMock).toHaveBeenCalled();
    });

    it("fails to spend and preserves balance if Supabase update fails", async () => {
        const { client, updateSingleMock } = makeMockClient();
        updateSingleMock.mockResolvedValueOnce({ data: null, error: new Error("DB Error") });
        const resources = new PlayerResources(20, client);

        await expect(resources.spendCoins(5)).rejects.toThrow("DB Error");
        expect(resources.getCoins()).toBe(20);
    });

    it("fails to earn and preserves balance if Supabase update fails", async () => {
        const { client, updateSingleMock } = makeMockClient();
        updateSingleMock.mockResolvedValueOnce({ data: null, error: new Error("Network Error") });
        const resources = new PlayerResources(20, client);

        await expect(resources.earnCoins(5)).rejects.toThrow("Network Error");
        expect(resources.getCoins()).toBe(20);
    });
});
