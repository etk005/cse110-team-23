/** A single card in the Risk/Reward deck. */
export type RiskRewardCard = "risk" | "reward";

// Fixed deck composition: 7 Risk + 14 Reward = 21 cards (a 7x3 grid on screen).
export const RISK_CARD_COUNT = 7;
export const REWARD_CARD_COUNT = 14;

/**
 * Holds the state of one Risk/Reward minigame: the shuffled deck and the
 * temporary chip balance. Chips earned here are separate from the player's
 * main coins until they cash out.
 */
export class RiskRewardScreenModel {
    // Cards in their shuffled order; index i is the card at grid position i.
    private deck: RiskRewardCard[] = [];
    // Temporary chips won during this minigame (lost if a Risk card is flipped).
    private chips = 0;

    /**
     * @param random Source of randomness for shuffling. Defaults to Math.random;
     *               tests can pass a fixed function to get a predictable order.
     */
    constructor(private random: () => number = Math.random) {
        this.start();
    }

    /** Builds a fresh shuffled deck and resets the temporary chip balance. */
    start(): void {
        this.deck = RiskRewardScreenModel.shuffle(
            RiskRewardScreenModel.createDeck(),
            this.random
        );
        this.chips = 0;
    }

    /** Creates an unshuffled deck with the fixed number of Risk and Reward cards. */
    static createDeck(): RiskRewardCard[] {
        return [
            ...Array<RiskRewardCard>(RISK_CARD_COUNT).fill("risk"),
            ...Array<RiskRewardCard>(REWARD_CARD_COUNT).fill("reward"),
        ];
    }

    /**
     * Fisher-Yates shuffle. Returns a new array and leaves the input unchanged.
     * Walks from the last item to the first, swapping each with a random item
     * at or before it, so every ordering is equally likely.
     */
    static shuffle<T>(items: T[], random: () => number = Math.random): T[] {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            // Random index in the range [0, i]
            const j = Math.floor(random() * (i + 1));
            // Swap items i and j (the casts are safe: both indexes are in range)
            [result[i], result[j]] = [result[j] as T, result[i] as T];
        }
        return result;
    }

    /** Returns a copy of the deck so callers can't change the model's state. */
    getDeck(): RiskRewardCard[] {
        return [...this.deck];
    }

    /** Current temporary chip balance for this minigame. */
    getChips(): number {
        return this.chips;
    }

    /** Number of Risk cards left in the deck. */
    getRiskCount(): number {
        return this.deck.filter((card) => card === "risk").length;
    }

    /** Number of Reward cards left in the deck. */
    getRewardCount(): number {
        return this.deck.filter((card) => card === "reward").length;
    }
}
