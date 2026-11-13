import type {
    GameState,
    Card,
    ProbabilityQuestion,
    Level,
    HintKind
} from "../../shared/types.ts";
import { getRemainingPossibleCards } from "../../cardFilter.ts";
import { getNextInformation } from "../../game/informationEngine.ts";
import { STARTING_CHIPS, COST_OF_CLUE } from "../../constants.ts";
import { calculateReward, CHIPS_PER_GUESS } from "../../game/rewardEngine.ts";

const questions: ProbabilityQuestion[] = [
    {
        id: "question-1",
        text: "What is the probability that the hidden card is an Ace?",
        answerType: "fraction",
    },
    {
        id: "question-2",
        text: "What is the probability that the hidden card is a spade?",
        answerType: "fraction",
    },
    {
        id: "question-3",
        text: "What is the probability that the hidden card is red?",
        answerType: "fraction",
    },
];

/**
 * Manages game state for an active level.
 * */
export class GameScreenModel {
    private state: GameState;
    private waitingForNext = false;
    private level: Level | null;
    private hiddenCard: Card | null = null;
    private chips = STARTING_CHIPS;

    /** Accepts a random source so hidden-card selection can be tested deterministically. */
    constructor(private random: () => number = Math.random) {
        // nil value for now
        // TODO: make game screen properly handle before init
        this.state = {
            "currentQuestion": null,
            "deck": [],
            "gameId": "",
            "hiddenCard": { "isRevealed": false },
            "knownInformation": [],
            "levelId": 0,
            "maxStrikes": 0,
            "questionsAnswered": 0,
            "questionsRequired": 0,
            "remainingPossibleCards": [],
            "status": "playing",
            "strikes": 0,
            "chips": this.chips,
            "choosingHint": false,
            "canViewRemainingCards": false,
            "probabilityRange": null,
            "incorrectlyGuessedCards": []
        };
        this.level = null;
    }

    private initGameStateFromLevel(level: Level): GameState {
        const index = Math.floor(this.random() * level.deck.length);
        this.hiddenCard = level.deck[index] ?? null;

        const state: GameState = {
            currentQuestion: questions[0] ?? null,
            deck: level.deck,
            gameId: crypto.randomUUID(),
            hiddenCard: { isRevealed: false },
            knownInformation: [],
            levelId: level.id,
            maxStrikes: level.maxStrikes,
            questionsAnswered: 0,
            questionsRequired: level.questionsRequired,
            remainingPossibleCards: level.deck,
            status: "playing",
            strikes: 0,
            chips: this.chips,
            choosingHint: false,
            canViewRemainingCards: false,
            probabilityRange: null,
            incorrectlyGuessedCards: []
        };

        this.revealNextClue(state);
        return state;
    }

    /** Adds a useful clue about the hidden card and narrows the possible cards. */
    private revealNextClue(state: GameState): void {
        if (this.hiddenCard === null) {
            return;
        }

        const clue = getNextInformation(
            this.hiddenCard,
            state.remainingPossibleCards,
            state.knownInformation
        );

        if (clue !== null) {
            state.knownInformation.push(clue);
        }

        state.remainingPossibleCards = getRemainingPossibleCards(
            state.deck,
            state.knownInformation
        );
    }

    setLevel(level: Level): void {
        this.level = level;
        this.reset();
    }

    reset(): void {
        if (this.level !== null) {
            this.state = this.initGameStateFromLevel(this.level);
        }
        this.waitingForNext = false;
    }

    getState(): GameState {
        return this.state;
    }

    /**
     * Returns the fixed set of fraction/decimal answer choices.
     * */
    getAnswerOptions(): string[] {
        return ["0", "1/4", "1/2", "3/4", "1"];
    }

    /**
     * True after a correct answer has been submitted and before the
     * player clicks "Next Question" — blocks duplicate submissions.
     */
    isWaitingForNext(): boolean {
        return this.waitingForNext;
    }

    private matchesQuestion(card: Card, questionId: string): boolean {
        switch (questionId) {
            case "question-1":
                return card.rank === "A";

            case "question-2":
                return card.suit === "spades";

            case "question-3":
                return card.suit === "hearts" || card.suit === "diamonds";

            default:
                return false;
        }
    }

    /** Returns the probability (0–1) that the hidden card satisfies the current question. */
    getCorrectAnswer(): number {
        const question = this.state.currentQuestion;
        const cards = this.state.remainingPossibleCards;

        if (!question || cards.length === 0) {
            return 0;
        }

        const matchingCards = cards.filter((card) =>
            this.matchesQuestion(card, question.id)
        );

        return matchingCards.length / cards.length;
    }

    /**
     * Parses the player's answer, checks it against the correct probability,
     * and increments progress on a correct submission.
     * @returns true if the answer was correct, false otherwise.
     */
    submitAnswer(answer: string): boolean {
        if (this.state.status !== "playing" || this.waitingForNext) {
            return false;
        }

        this.state.choosingHint = false;

        const parts = answer.split("/");

        const numericAnswer = parts.length === 2
            ? Number(parts[0]) / Number(parts[1])
            : Number(answer);

        const correct = numericAnswer === this.getCorrectAnswer();

        if (correct) {
            this.state.questionsAnswered++;
            this.waitingForNext = true;

            if (this.state.questionsAnswered >= this.state.questionsRequired) {
                this.state.status = "won";
            }
        } else {
            this.state.strikes++;

            if (this.state.strikes >= this.state.maxStrikes) {
                this.state.status = "lost";
            }
        }

        return correct;
    }

    /** Advances to the next question after the player clicks "Next Question". */
    nextQuestion(): void {
        if (!this.waitingForNext || this.state.status !== "playing") {
            return;
        }

        this.waitingForNext = false;
        this.revealNextClue(this.state);
        const nextIndex = this.state.questionsAnswered;
        this.state.currentQuestion = questions[nextIndex] ?? null;
        this.state.probabilityRange = null;
        this.state.choosingHint = false;
    }
    /**Returns true if this.state.chips >= COST_OF_CLUE */
    hasEnoughChips(): boolean { 
        return this.chips >= COST_OF_CLUE;
    }
    /**Subtracts COST_OF_CLUE from this.state.chips */
    subtractChips(): void{
        if (this.chips < COST_OF_CLUE) {
            throw new Error("Cannot subtract negative chips");
        }
        this.chips -= COST_OF_CLUE;
        this.state.chips = this.chips;
    }
    /**Adds COST_OF_CLUE to this.state.chips */
    addChips(amount: number): void{
        if (amount < 0) {
            throw new Error("Cannot add negative chips");
        }
        this.chips += amount;
        this.state.chips = this.chips;
    }
    /**Returns the number of chips that the player currently has */
    getChips(): number{
        return this.chips;
    }
    /**
     * Opens the paid-hint picker. Does not spend chips or add card facts.
     */
    openHintMenu(): "opened" | "not enough chips" | "already_bought" {
        if (!this.hasEnoughChips()) {
            return "not enough chips";
        }
        if (this.state.canViewRemainingCards && this.state.probabilityRange !== null) {
            return "already_bought";
        }
        this.state.choosingHint = true;
        return "opened";
    }

    /**
     * Spends chips on the chosen hint: remaining cards, or a probability
     * range containing the true answer. Does not add card facts.
     */
    buyHint(kind: HintKind): "bought" | "not enough chips" | "already_bought" {
        if (!this.hasEnoughChips()) {
            this.state.choosingHint = false;
            return "not enough chips";
        }

        if (kind === "cards") {
            if (this.state.canViewRemainingCards) {
                this.state.choosingHint = false;
                return "already_bought";
            }
            this.subtractChips();
            this.state.canViewRemainingCards = true;
            this.state.choosingHint = false;
            return "bought";
        }

        if (this.state.probabilityRange !== null) {
            this.state.choosingHint = false;
            return "already_bought";
        }

        this.subtractChips();
        this.state.probabilityRange = this.buildProbabilityRange(
            this.getCorrectAnswer()
        );
        this.state.choosingHint = false;
        return "bought";
    }

    /** Returns the quarter-sized probability band containing p. */
    private buildProbabilityRange(p: number): { low: number; high: number } {
        const buckets = [
            { low: 0, high: 1/4 },
            { low: 1/4, high: 1/2 },
            { low: 1/2, high: 3/4 },
            { low: 3/4, high: 1 }
        ];
        for (const bucket of buckets) {
            if (p >= bucket.low && p < bucket.high) {
                return bucket;
            }
        }
        // Include a probability of exactly 1 in the last band.
        return buckets[buckets.length - 1] ?? { low: 0, high: 1 };
    }

    guessCard(card: Card): boolean {
        if (this.state.status !== "playing") return false;
        
        if (this.chips < CHIPS_PER_GUESS) return false;
        this.chips -= CHIPS_PER_GUESS;
        this.state.chips = this.chips;

        if (card.id === this.hiddenCard!.id) {
            this.state.status = "won";
            this.state.hiddenCard.isRevealed = true;
            this.chips += this.getReward();
            this.state.chips = this.chips;
            return true;
        }

        this.state.incorrectlyGuessedCards.push(card);
        return false;
    }

    getReward(): number {
        const remainingPossibleCardIds = this.state.remainingPossibleCards.map(card => card.id);
        const incorrectlyGuessedCardIds = this.state.incorrectlyGuessedCards.map(card => card.id);
        return calculateReward(new Set(remainingPossibleCardIds).difference(new Set(incorrectlyGuessedCardIds)).size);
    }
}
