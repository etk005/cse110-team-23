/** A single card in the Risk/Reward deck. A Reward adds `value` chips; a Risk loses them all. */
export type RiskRewardCard = { type: "risk" } | { type: "reward"; value: number };

// Fixed deck composition: 7 Risk + 14 Reward = 21 cards (a 7x3 grid on screen).
export const RISK_CARD_COUNT = 7;

// Reward cards by chip value -> how many cards. Every Reward is worth 1 chip
// for now; add more values (e.g. { 1: 7, 2: 5, 5: 2 }) to make the expected
// value a weighted sum.
export const REWARD_CARD_VALUES: Record<number, number> = { 1: 14 };

// Reward values in ascending order, e.g. [1, 2, 5]
export const REWARD_VALUES = Object.keys(REWARD_CARD_VALUES).map(Number).sort((a, b) => a - b);

export const REWARD_CARD_COUNT = Object.values(REWARD_CARD_VALUES).reduce((sum, n) => sum + n, 0);

/** The three values the player calculates before each flip. */
export type CalcField = "risk" | "reward" | "expectedValue";

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

    /** Creates an unshuffled deck: RISK_CARD_COUNT Risk cards plus the REWARD_CARD_VALUES mix. */
    static createDeck(): RiskRewardCard[] {
        const deck: RiskRewardCard[] = [];
        for (let i = 0; i < RISK_CARD_COUNT; i++) {
            deck.push({ type: "risk" });
        }
        for (const value of REWARD_VALUES) {
            for (let i = 0; i < (REWARD_CARD_VALUES[value] ?? 0); i++) {
                deck.push({ type: "reward", value });
            }
        }
        return deck;
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
        return this.deck.map((card) => ({ ...card }));
    }

    /** Current temporary chip balance for this minigame. */
    getChips(): number {
        return this.chips;
    }

    /** Number of Risk cards in the deck. */
    getRiskCount(): number {
        return this.countRemaining("risk");
    }

    /** Number of Reward cards in the deck. */
    getRewardCount(): number {
        return this.countRemaining("reward");
    }

    /** Number of cards in the deck. */
    getTotalCount(): number {
        return this.deck.length;
    }

    /** Reward cards for each value, e.g. { 1: 7, 2: 5, 5: 2 }. */
    getRewardCountByValue(): Record<number, number> {
        const counts: Record<number, number> = {};
        for (const value of REWARD_VALUES) {
            counts[value] = 0;
        }
        this.deck.forEach((card) => {
            if (card.type === "reward") {
                counts[card.value] = (counts[card.value] ?? 0) + 1;
            }
        });
        return counts;
    }

    private countRemaining(type: RiskRewardCard["type"]): number {
        return this.deck.filter((card) => card.type === type).length;
    }

    /** The correct value for each input, from the cards left and current chips. */
    getCorrectAnswers(): Record<CalcField, number> {
        return {
            risk: this.getRiskProbability(),
            reward: this.getRewardProbability(),
            expectedValue: this.getExpectedValue(),
        };
    }

    /** Chance the next flip is a Risk card, from the cards still in the deck. */
    getRiskProbability(): number {
        return RiskRewardScreenModel.probability(this.getRiskCount(), this.getTotalCount());
    }

    /** Chance the next flip is a Reward card, from the cards still in the deck. */
    getRewardProbability(): number {
        return RiskRewardScreenModel.probability(this.getRewardCount(), this.getTotalCount());
    }

    /** Expected chip change from flipping one more card right now. */
    getExpectedValue(): number {
        return RiskRewardScreenModel.expectedValue(
            this.getRiskCount(),
            this.getRewardCountByValue(),
            this.chips
        );
    }

    /** count / total, or 0 when the deck is empty. */
    static probability(count: number, total: number): number {
        return total === 0 ? 0 : count / total;
    }

    /**
     * Expected change in temporary chips from flipping one more card. Each
     * Reward value counts in proportion to how many of those cards are left,
     * and a Risk loses every current chip:
     *     EV = sum over values v of P(+v) * v  -  P(Risk) * chips
     * e.g. the starting deck (14 Rewards worth 1): 14/21 * 1 - 0 = 2/3.
     * Positive means flipping pays off on average; negative means cash out.
     * @param rewardsByValue face-down Reward cards per value, e.g. { 1: 7, 2: 5, 5: 2 }
     */
    static expectedValue(
        riskCount: number,
        rewardsByValue: Record<number, number>,
        chips: number
    ): number {
        const entries = Object.entries(rewardsByValue).map(([value, count]) => [Number(value), count]);
        const total = riskCount + entries.reduce((sum, [, count]) => sum + (count ?? 0), 0);
        const gain = entries.reduce(
            (sum, [value, count]) =>
                sum + RiskRewardScreenModel.probability(count ?? 0, total) * (value ?? 0),
            0
        );
        return gain - RiskRewardScreenModel.probability(riskCount, total) * chips;
    }
}
