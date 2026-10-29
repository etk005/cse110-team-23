
import { beforeEach, describe, expect, it } from "vitest";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";

describe("GameScreenModel", () => {
    let model: GameScreenModel;

    beforeEach(() => {
        model = new GameScreenModel();
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

        it("does not start waiting for Next Question", () => {
            expect(model.isWaitingForNext()).toBe(false);
        });

        it("keeps separate game instances independent", () => {
            const secondModel = new GameScreenModel();

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

        it("prevents repeated Next Question clicks from skipping", () => {
            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            const question = model.getState().currentQuestion;

            model.nextQuestion();

            expect(model.getState().currentQuestion).toEqual(question);
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

            expect(model.getState()).toEqual(initialState);
        });
    });
});
