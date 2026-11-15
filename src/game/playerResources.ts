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
 */
export class PlayerResources {
    private coins: number;
    // best points earned on each level, by level id
    private bestLevelPoints = new Map<number, number>();
    private listeners: (() => void)[] = [];

    constructor(startingCoins = STARTING_COINS) {
        this.coins = startingCoins;
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

    earnCoins(amount: number): void {
        if (amount <= 0) {
            throw new RangeError("amount must be positive");
        }

        this.coins += amount;
        this.notify();
    }

    /**
     * Takes coins if the player has enough.
     * @returns true if the coins were spent, false if the balance was too low.
     */
    spendCoins(amount: number): boolean {
        if (amount <= 0) {
            throw new RangeError("amount must be positive");
        }

        if (amount > this.coins) {
            return false;
        }

        this.coins -= amount;
        this.notify();
        return true;
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
