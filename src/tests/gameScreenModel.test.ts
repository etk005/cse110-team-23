import { beforeEach, describe, expect, it } from "vitest";
import type { Level } from "../shared/types.ts";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";

const level1: Level = {
    id: 1,
    name: "Level 1",
    deck: [
        { id: "H-A", suit: "hearts", rank: "A" },
        { id: "H-2", suit: "hearts", rank: "2" },
        { id: "H-3", suit: "hearts", rank: "3" },
        { id: "H-4", suit: "hearts", rank: "4" },
        { id: "S-A", suit: "spades", rank: "A" },
        { id: "S-2", suit: "spades", rank: "2" },
        { id: "S-3", suit: "spades", rank: "3" },
        { id: "S-4", suit: "spades", rank: "4" },
    ],
    maxStrikes: 3,
    questionsRequired: 3,
};

describe("GameScreenModel", () => {
    let model: GameScreenModel;

    beforeEach(() => {
        // always pick the first card (H-A) so games are deterministic
        model = new GameScreenModel(() => 0);
        model.setLevel(level1);
    });

    function correctAnswer(): string {
        return String(model.getCorrectAnswer());
    }

    function wrongAnswer(): string {
        return model.getCorrectAnswer() === 0 ? "1" : "0";
    }

    function completeGame(): void {
        const required = model.getState().questionsRequired;

        for (let i = 0; i < required; i++) {
            model.submitAnswer(correctAnswer());

            if (i < required - 1) {
                model.nextQuestion();
            }
        }
    }

    describe("Initialization", () => {
        it("starts in the playing state", () => {
            expect(model.getState().status).toBe("playing");
        });

        it("starts with no strikes or completed questions", () => {
            const state = model.getState();

            expect(state.strikes).toBe(0);
            expect(state.questionsAnswered).toBe(0);
        });

        it("starts with a current question", () => {
            expect(model.getState().currentQuestion).not.toBeNull();
        });

        it("starts with a clue about the hidden card", () => {
            expect(model.getState().knownInformation.length).toBeGreaterThan(0);
        });

        it("starts with remaining cards that match every clue", () => {
            const state = model.getState();

            // hidden card is H-A, so the first clue is "red"
            expect(state.knownInformation[0]?.id).toBe("color-red");
            expect(state.remainingPossibleCards.map((card) => card.id)).toEqual(
                ["H-A", "H-2", "H-3", "H-4"]
            );
        });

        it("always keeps the hidden card among the remaining cards", () => {
            for (let i = 0; i < level1.deck.length; i++) {
                const seeded = new GameScreenModel(() => i / level1.deck.length);
                seeded.setLevel(level1);

                const remaining = seeded.getState().remainingPossibleCards;

                expect(remaining.map((card) => card.id)).toContain(
                    level1.deck[i]!.id
                );
            }
        });

        it("does not make 0 or 1 the correct answer for the first question", () => {
            const probability = model.getCorrectAnswer();

            expect(probability).toBeGreaterThan(0);
            expect(probability).toBeLessThan(1);
        });

        it("does not start waiting for Next Question", () => {
            expect(model.isWaitingForNext()).toBe(false);
        });

        it("keeps separate game instances independent", () => {
            const secondModel = new GameScreenModel();
            secondModel.setLevel(level1);

            model.submitAnswer(wrongAnswer());

            expect(secondModel.getState().strikes).toBe(0);
        });
    });

    describe("Probability calculations", () => {
        it("returns a valid probability", () => {
            const probability = model.getCorrectAnswer();

            expect(Number.isFinite(probability)).toBe(true);
            expect(probability).toBeGreaterThanOrEqual(0);
            expect(probability).toBeLessThanOrEqual(1);
        });

        it("returns valid probabilities throughout the game", () => {
            const required = model.getState().questionsRequired;

            for (let i = 0; i < required; i++) {
                const probability = model.getCorrectAnswer();

                expect(probability).toBeGreaterThanOrEqual(0);
                expect(probability).toBeLessThanOrEqual(1);

                model.submitAnswer(correctAnswer());

                if (i < required - 1) {
                    model.nextQuestion();
                }
            }
        });

        it("provides answer choices", () => {
            const options = model.getAnswerOptions();

            expect(options.length).toBeGreaterThan(0);
            expect(new Set(options).size).toBe(options.length);
        });
    });

    describe("Answer validation", () => {
        it("accepts a correct answer", () => {
            expect(model.submitAnswer(correctAnswer())).toBe(true);
        });

        it("rejects an incorrect answer", () => {
            expect(model.submitAnswer(wrongAnswer())).toBe(false);
        });

        it("accepts a correct decimal answer", () => {
            const answer = correctAnswer();

            expect(model.submitAnswer(answer)).toBe(true);
        });

        it("accepts a decimal rounded to 2 places", () => {
            const rounded = model.getCorrectAnswer().toFixed(2);

            expect(model.submitAnswer(rounded)).toBe(true);
        });

        it("accepts an equivalent unsimplified fraction", () => {
            const remaining = model.getState().remainingPossibleCards.length;
            const matching = Math.round(model.getCorrectAnswer() * remaining);

            expect(model.submitAnswer(`${matching}/${remaining}`)).toBe(true);
        });

        it("rejects an answer that is off by more than rounding", () => {
            const close = String(model.getCorrectAnswer() + 0.02);

            expect(model.submitAnswer(close)).toBe(false);
        });

        it("rejects malformed input", () => {
            const invalidAnswers = ["abc", "1/0", "0/0", "Infinity"];

            for (const answer of invalidAnswers) {
                model.reset();

                expect(model.submitAnswer(answer)).toBe(false);
            }
        });

        it("does not award progress for incorrect answers", () => {
            model.submitAnswer(wrongAnswer());

            expect(model.getState().questionsAnswered).toBe(0);
        });

        it("awards progress for a correct answer", () => {
            model.submitAnswer(correctAnswer());

            expect(model.getState().questionsAnswered).toBe(1);
        });

        it("prevents duplicate correct submissions", () => {
            const answer = correctAnswer();

            model.submitAnswer(answer);
            model.submitAnswer(answer);

            expect(model.getState().questionsAnswered).toBe(1);
        });
    });

    describe("Question progression", () => {
        it("does not skip unanswered questions", () => {
            const question = model.getState().currentQuestion;

            model.nextQuestion();

            expect(model.getState().currentQuestion).toEqual(question);
        });

        it("waits after a correct answer", () => {
            model.submitAnswer(correctAnswer());

            expect(model.isWaitingForNext()).toBe(true);
        });

        it("advances only after Next Question", () => {
            const initialQuestion = model.getState().currentQuestion;

            model.submitAnswer(correctAnswer());

            expect(model.getState().currentQuestion).toEqual(initialQuestion);

            if (model.getState().status === "playing") {
                model.nextQuestion();

                expect(model.getState().currentQuestion).not.toEqual(
                    initialQuestion
                );
            }
        });

        it("reveals another clue and narrows the cards on Next Question", () => {
            const before = model.getState().remainingPossibleCards.length;

            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            const state = model.getState();

            expect(state.knownInformation.length).toBe(2);
            expect(state.remainingPossibleCards.length).toBeLessThan(before);
        });

        it("never repeats a question within a level", () => {
            const seen = new Set<string>();

            while (model.getState().status === "playing") {
                const question = model.getState().currentQuestion!;

                expect(seen.has(question.id)).toBe(false);
                seen.add(question.id);

                model.submitAnswer(correctAnswer());
                model.nextQuestion();
            }
        });

        it("has a question for every required answer, even past three", () => {
            model.setLevel({ ...level1, questionsRequired: 6 });

            completeGame();

            expect(model.getState().status).toBe("won");
        });

        it("words every question the same way and names it by its condition", () => {
            const question = model.getState().currentQuestion!;

            expect(question.text).toMatch(/^What is the probability that the hidden card is .+\?$/);
            expect(question.id).toBe(`${question.property}-${question.operator}-${question.value}`);
        });

        it("prevents repeated Next Question clicks from skipping", () => {
            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            const question = model.getState().currentQuestion;

            model.nextQuestion();

            expect(model.getState().currentQuestion).toEqual(question);
        });
    });

    describe("Strikes and losing", () => {
        it("increments strikes for a wrong answer", () => {
            model.submitAnswer(wrongAnswer());

            expect(model.getState().strikes).toBe(1);
        });

        it("loses when maximum strikes are reached", () => {
            const maxStrikes = model.getState().maxStrikes;
            const answer = wrongAnswer();

            for (let i = 0; i < maxStrikes; i++) {
                model.submitAnswer(answer);
            }

            expect(model.getState().status).toBe("lost");
            expect(model.getState().strikes).toBe(maxStrikes);
        });

        it("does not accept answers after losing", () => {
            const maxStrikes = model.getState().maxStrikes;
            const answer = wrongAnswer();

            for (let i = 0; i < maxStrikes; i++) {
                model.submitAnswer(answer);
            }

            expect(model.submitAnswer(correctAnswer())).toBe(false);
            expect(model.getState().questionsAnswered).toBe(0);
        });

        it("does not exceed maximum strikes", () => {
            const maxStrikes = model.getState().maxStrikes;
            const answer = wrongAnswer();

            for (let i = 0; i < maxStrikes + 2; i++) {
                model.submitAnswer(answer);
            }

            expect(model.getState().strikes).toBe(maxStrikes);
        });
    });

    describe("Winning and restarting", () => {
        it("wins after completing all required questions", () => {
            completeGame();

            expect(model.getState().status).toBe("won");
            expect(model.getState().questionsAnswered).toBe(
                model.getState().questionsRequired
            );
        });

        it("does not accept answers after winning", () => {
            completeGame();

            const progress = model.getState().questionsAnswered;

            expect(model.submitAnswer(correctAnswer())).toBe(false);
            expect(model.getState().questionsAnswered).toBe(progress);
        });

        it("resets progress and strikes", () => {
            model.submitAnswer(wrongAnswer());
            model.reset();

            const state = model.getState();

            expect(state.status).toBe("playing");
            expect(state.strikes).toBe(0);
            expect(state.questionsAnswered).toBe(0);
        });

        it("resets the Next Question state", () => {
            model.submitAnswer(correctAnswer());

            expect(model.isWaitingForNext()).toBe(true);

            model.reset();

            expect(model.isWaitingForNext()).toBe(false);
        });

        it("restores the initial state after a restart", () => {
            const initialState = structuredClone(model.getState());

            model.submitAnswer(wrongAnswer());
            model.reset();

            expect(model.getState()).toEqual({
                ...initialState,
                gameId: expect.any(String),
            });
        });
    });
});
