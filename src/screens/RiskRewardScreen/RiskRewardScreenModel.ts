export type RiskRewardCard = "risk" | "reward";

export const RISK_CARD_COUNT = 7;
export const REWARD_CARD_COUNT = 14;

/** Holds the state of one Risk/Reward minigame: the shuffled deck and temporary chips. */
export class RiskRewardScreenModel {
    private deck: RiskRewardCard[] = [];
    private chips = 0;

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

    /** Fisher-Yates shuffle; returns a new array. */
    static shuffle<T>(items: T[], random: () => number = Math.random): T[] {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j] as T, result[i] as T];
        }
        return result;
    }

    getDeck(): RiskRewardCard[] {
        return [...this.deck];
    }

    getChips(): number {
        return this.chips;
    }

    getRiskCount(): number {
        return this.deck.filter((card) => card === "risk").length;
    }

    getRewardCount(): number {
        return this.deck.filter((card) => card === "reward").length;
    }
}
