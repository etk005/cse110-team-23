
import type {
    GameState,
    Card,
    ProbabilityQuestion,
} from "../../shared/types.ts";
import { mockGameState } from "../../mocks/mockGameState.ts";

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

export class GameScreenModel {
    private state: GameState;
    private waitingForNext = false;

    constructor() {
        this.state = structuredClone(mockGameState);
    }

    reset(): void {
        this.state = structuredClone(mockGameState);
        this.waitingForNext = false;
    }

    getState(): GameState {
        return this.state;
    }

    getAnswerOptions(): string[] {
        return ["0", "1/4", "1/2", "3/4", "1"];
    }

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

    nextQuestion(): void {
        if (!this.waitingForNext || this.state.status !== "playing") {
            return;
        }

        this.waitingForNext = false;

        const nextIndex = this.state.questionsAnswered;
        this.state.currentQuestion = questions[nextIndex] ?? null;
    }
}
