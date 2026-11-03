import type {
    GameState,
    Card,
    ProbabilityQuestion,
    Level,
} from "../../shared/types.ts";
import { getNextInformation } from "../../game/informationEngine.ts";
import { getRemainingPossibleCards } from "../../cardFilter.ts";

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

    /**
     * @param random source of randomness for picking the hidden card;
     * tests can pass a fixed function to make games deterministic.
     */
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
            "strikes": 0
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
            strikes: 0
        };

        this.revealNextClue(state);
        return state;
    }

    /**
     * Adds the next useful clue about the hidden card (if any) and
     * narrows the remaining possible cards to match all known clues.
     */
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
    }
}
