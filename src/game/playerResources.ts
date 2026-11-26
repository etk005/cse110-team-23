import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

export const STARTING_COINS = 10;

// points for clearing a level, minus a penalty for each strike
export const LEVEL_POINTS = 10;
export const STRIKE_PENALTY = 1;

/**
 * Points earned for one attempt at a level. Failing earns nothing,
 * and strikes never take the result below zero.
 */
export function levelPoints(won: boolean, strikes: number): number {
    if (!won) {
        return 0;
    }

    return Math.max(0, LEVEL_POINTS - strikes * STRIKE_PENALTY);
}

/**
 * The player's coins and score, shared by every screen.
 * Created once by the App so the values stay the same across screens.
 * Uses Supabase behind the scenes when a client / session is available.
 */
export class PlayerResources {
    private coins: number;
    // best points earned on each level, by level id
    private bestLevelPoints = new Map<number, number>();
    private listeners: (() => void)[] = [];
    private client: SupabaseClient | null;

    constructor(startingCoins = STARTING_COINS, client: SupabaseClient | null = supabase) {
        this.coins = startingCoins;
        this.client = client;
    }

    getCoins(): number {
        return this.coins;
    }

    /** Total score: the best result on each level, added together. */
    getScore(): number {
        let total = 0;
        for (const points of this.bestLevelPoints.values()) {
            total += points;
        }
        return total;
    }

    getBestLevelPoints(levelId: number): number {
        return this.bestLevelPoints.get(levelId) ?? 0;
    }

    /**
     * Loads the coins from Supabase for the specified or current user.
     * If the player does not have a row yet, one is created with the current coin balance.
     */
    async load(userId?: string): Promise<number> {
        if (!this.client) {
            return this.coins;
        }

        let targetUserId = userId;
        if (!targetUserId) {
            const { data: { user }, error: authError } = await this.client.auth.getUser();
            if (authError || !user) {
                return this.coins;
            }
            targetUserId = user.id;
        }

        const { data, error } = await this.client
            .from("player_resources")
            .select("coins")
            .eq("user_id", targetUserId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            this.coins = data.coins;
        } else {
            const { error: insertError } = await this.client
                .from("player_resources")
                .insert({ user_id: targetUserId, coins: this.coins });
            if (insertError) {
                const { data: refetched } = await this.client
                    .from("player_resources")
                    .select("coins")
                    .eq("user_id", targetUserId)
                    .maybeSingle();
                if (refetched) {
                    this.coins = refetched.coins;
                }
            }
        }

        this.notify();
        return this.coins;
    }

    async earnCoins(amount: number): Promise<void> {
        if (amount <= 0) {
            throw new RangeError("amount must be positive");
        }

        const previousBalance = this.coins;
        const nextBalance = previousBalance + amount;

        this.coins = nextBalance;
        this.notify();

        try {
            await this.persistCoins(previousBalance, nextBalance);
        } catch (error) {
            this.coins = previousBalance;
            this.notify();
            throw error;
        }
    }

    /**
     * Sets the coins in memory.
     * @param coins number of coins to set
     */
    setCoins(coins: number): void {
        this.coins = coins;
        this.notify();
    }

    /**
     * Resets in-memory coins and level points (e.g. on user sign out).
     */
    reset(startingCoins = STARTING_COINS): void {
        this.coins = startingCoins;
        this.bestLevelPoints.clear();
        this.notify();
    }

    /**
     * Takes coins if the player has enough, persisting to Supabase if authenticated.
     * @returns true if the coins were spent, false if the balance was too low.
     */
    async spendCoins(amount: number): Promise<boolean> {
        if (amount <= 0) {
            throw new RangeError("amount must be positive");
        }

        if (amount > this.coins) {
            return false;
        }

        const previousBalance = this.coins;
        const nextBalance = previousBalance - amount;

        this.coins = nextBalance;
        this.notify();

        try {
            await this.persistCoins(previousBalance, nextBalance);
            return true;
        } catch (error) {
            this.coins = previousBalance;
            this.notify();
            throw error;
        }
    }

    private async persistCoins(previousBalance: number, nextBalance: number): Promise<void> {
        if (!this.client) {
            return;
        }

        const { data: { user }, error: authError } = await this.client.auth.getUser();
        if (authError || !user) {
            // Unauthenticated / offline mode
            return;
        }

        const { data, error } = await this.client
            .from("player_resources")
            .update({ coins: nextBalance })
            .eq("user_id", user.id)
            .eq("coins", previousBalance)
            .select("coins")
            .single();

        if (error) {
            throw error;
        }
    }

    /** Records an attempt at a level, keeping only the best result. */
    recordLevelResult(levelId: number, points: number): void {
        if (points <= this.getBestLevelPoints(levelId)) {
            return;
        }

        this.bestLevelPoints.set(levelId, points);
        this.notify();
    }

    /**
     * Calls the listener whenever coins or score change.
     * @returns a function that removes the listener.
     */
    onChange(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notify(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
