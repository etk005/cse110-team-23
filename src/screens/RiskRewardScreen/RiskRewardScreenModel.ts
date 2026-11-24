import { matchesAnswer, parseNumber, parseProbability } from "../../game/numberInput.ts";

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

/**
 * Where the player is in the current round:
 * - "calculating": entering P(Risk), P(Reward) and expected value; cards locked
 * - "flipping":    all three answers were correct; the player may flip one card
 * - "reward":      a Reward was flipped; choose Cash Out or Continue
 * - "lost":        a Risk was flipped; temporary chips are gone, game over
 * - "cashedOut":   the player banked their chips; game over
 */
export type RiskRewardPhase = "calculating" | "flipping" | "reward" | "lost" | "cashedOut";

/** The three values the player calculates before each flip. */
export type CalcField = "risk" | "reward" | "expectedValue";

/** Per-field result of checking the player's answers. */
export type AnswerCheck = Record<CalcField, "correct" | "incorrect" | "invalid">;

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
    // revealed[i] is true once the card at grid position i has been flipped
    private revealed: boolean[] = [];
    private phase: RiskRewardPhase = "calculating";

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
        this.revealed = this.deck.map(() => false);
        this.phase = "calculating";
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

    /** Number of Risk cards not yet flipped. */
    getRiskCount(): number {
        return this.countRemaining("risk");
    }

    /** Number of Reward cards not yet flipped. */
    getRewardCount(): number {
        return this.countRemaining("reward");
    }

    /** Number of cards not yet flipped. */
    getTotalCount(): number {
        return this.revealed.filter((isRevealed) => !isRevealed).length;
    }

    /** Face-down Reward cards for each value, e.g. { 1: 7, 2: 5, 5: 2 }. */
    getRewardCountByValue(): Record<number, number> {
        const counts: Record<number, number> = {};
        for (const value of REWARD_VALUES) {
            counts[value] = 0;
        }
        this.deck.forEach((card, i) => {
            if (card.type === "reward" && !this.revealed[i]) {
                counts[card.value] = (counts[card.value] ?? 0) + 1;
            }
        });
        return counts;
    }

    private countRemaining(type: RiskRewardCard["type"]): number {
        return this.deck.filter((card, i) => card.type === type && !this.revealed[i]).length;
    }

    getPhase(): RiskRewardPhase {
        return this.phase;
    }

    /** What each grid slot shows: null while face-down, otherwise the flipped card. */
    getCardFaces(): (RiskRewardCard | null)[] {
        return this.deck.map((card, i) => (this.revealed[i] ? card : null));
    }

    /** True if the card at grid position `index` has been flipped. */
    isRevealed(index: number): boolean {
        return this.revealed[index] === true;
    }

    /** The correct value for each input, from the cards left and current chips. */
    getCorrectAnswers(): Record<CalcField, number> {
        return {
            risk: this.getRiskProbability(),
            reward: this.getRewardProbability(),
            expectedValue: this.getExpectedValue(),
        };
    }

    /**
     * Checks the player's typed answers. If all three are correct, cards
     * unlock ("flipping" phase); otherwise they stay locked and the player
     * can fix the wrong ones and submit again. Ignored outside "calculating".
     */
    checkAnswers(inputs: Record<CalcField, string>): AnswerCheck {
        const correct = this.getCorrectAnswers();
        const check = (field: CalcField): AnswerCheck[CalcField] => {
            const parsed =
                field === "expectedValue" ? parseNumber(inputs[field]) : parseProbability(inputs[field]);
            if (!parsed.ok) return "invalid";
            return matchesAnswer(parsed.value, correct[field]) ? "correct" : "incorrect";
        };
        const result: AnswerCheck = {
            risk: check("risk"),
            reward: check("reward"),
            expectedValue: check("expectedValue"),
        };
        if (
            this.phase === "calculating" &&
            Object.values(result).every((value) => value === "correct")
        ) {
            this.phase = "flipping";
        }
        return result;
    }

    /**
     * Flips the card at grid position `index`. Only allowed in the "flipping"
     * phase and on a card that hasn't been flipped. A Reward adds its value in
     * chips; a Risk loses every temporary chip and ends the game.
     * @returns the revealed card, or null if the flip isn't allowed
     */
    flip(index: number): RiskRewardCard | null {
        const card = this.deck[index];
        if (this.phase !== "flipping" || card === undefined || this.revealed[index]) {
            return null;
        }
        this.revealed[index] = true;
        if (card.type === "reward") {
            this.chips += card.value;
            this.phase = "reward";
        } else {
            this.chips = 0;
            this.phase = "lost";
        }
        return { ...card };
    }

    /** True if the player can play another round (a Reward was just flipped and cards remain). */
    canContinue(): boolean {
        return this.phase === "reward" && this.getTotalCount() > 0;
    }

    /** After a Reward: start the next round with the remaining deck, keeping chips. */
    continueRound(): boolean {
        if (!this.canContinue()) {
            return false;
        }
        this.phase = "calculating";
        return true;
    }

    /**
     * After a Reward: ends the minigame and hands back the chips to add to
     * the player's total balance.
     * @returns the chips banked, or 0 if cashing out isn't allowed right now
     */
    cashOut(): number {
        if (this.phase !== "reward") {
            return 0;
        }
        const banked = this.chips;
        this.chips = 0;
        this.phase = "cashedOut";
        return banked;
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
