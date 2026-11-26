import { beforeEach, describe, expect, it } from "vitest";
import type { Level } from "../shared/types.ts";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";
import { getRemainingPossibleCards } from "../cardFilter.ts";
import { calculateReward } from "../game/rewardEngine.ts";

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

        it("starts with a useful clue about the hidden card", () => {
            expect(model.getState().knownInformation).toEqual([
                {
                    id: "color-red",
                    description: "The hidden card is red.",
                    property: "color",
                    operator: "equals",
                    value: "red",
                },
            ]);
        });

        it("keeps only cards matching the initial clue", () => {
            const state = model.getState();

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

        it.each(level1.deck)("reveals useful clues for $id as questions advance", (hiddenCard) => {
            const index = level1.deck.indexOf(hiddenCard);
            const seeded = new GameScreenModel(() => index / level1.deck.length);
            seeded.setLevel(level1);

            for (let question = 1; question < level1.questionsRequired; question++) {
                const before = structuredClone(seeded.getState());
                seeded.submitAnswer(String(seeded.getCorrectAnswer()));
                // Feedback still reflects the clues used to answer this question.
                expect(seeded.getState().knownInformation).toEqual(before.knownInformation);
                seeded.nextQuestion();

                const state = seeded.getState();
                expect(state.knownInformation).toHaveLength(before.knownInformation.length + 1);
                expect(state.knownInformation.slice(0, -1)).toEqual(before.knownInformation);
                expect(state.remainingPossibleCards.length).toBeLessThan(before.remainingPossibleCards.length);
                expect(state.remainingPossibleCards).toContainEqual(hiddenCard);
                expect(state.remainingPossibleCards).toEqual(
                    getRemainingPossibleCards(state.deck, state.knownInformation)
                );
            }
        });

        it("does not add redundant clues once only the hidden card remains", () => {
            model.setLevel({ ...level1, deck: [level1.deck[0]!] });
            const before = structuredClone(model.getState());

            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            expect(model.getState().knownInformation).toEqual(before.knownInformation);
            expect(model.getState().remainingPossibleCards).toEqual(before.remainingPossibleCards);
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
            const clues = structuredClone(model.getState().knownInformation);

            model.nextQuestion();

            expect(model.getState().currentQuestion).toEqual(question);
            expect(model.getState().knownInformation).toEqual(clues);
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

    describe("Paid hints", () => {
        it("opens a hint menu without adding card facts", () => {
            const cluesBefore = model.getState().knownInformation.length;

            expect(model.openHintMenu()).toBe("opened");
            expect(model.getState().choosingHint).toBe(true);
            expect(model.getState().knownInformation.length).toBe(cluesBefore);
        });

        it("unlocks remaining cards without adding a card-property clue", () => {
            const cluesBefore = model.getState().knownInformation.length;

            model.openHintMenu();
            expect(model.buyHint("cards")).toBe("bought");

            const state = model.getState();
            expect(state.canViewRemainingCards).toBe(true);
            expect(state.choosingHint).toBe(false);
            expect(state.knownInformation.length).toBe(cluesBefore);
        });

        it("gives a probability range containing the true answer without adding facts", () => {
            const answer = model.getCorrectAnswer();
            const factsBefore = structuredClone(model.getState().knownInformation);

            model.openHintMenu();
            expect(model.buyHint("range")).toBe("bought");

            const range = model.getState().probabilityRange;
            expect(range).not.toBeNull();
            expect(range!.low).toBeLessThanOrEqual(answer);
            expect(range!.high).toBeGreaterThanOrEqual(answer);
            expect(model.getState().knownInformation).toEqual(factsBefore);
        });

        it("does not sell the same remaining-cards hint twice", () => {
            model.buyHint("cards");

            expect(model.buyHint("cards")).toBe("already_bought");
        });

        it("clears both hints on the next question", () => {
            model.buyHint("cards");
            model.buyHint("range");
            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            const state = model.getState();
            expect(state.canViewRemainingCards).toBe(false);
            expect(state.probabilityRange).toBeNull();
        });

        it("lets the remaining-cards hint be bought again on the next question", () => {
            model.buyHint("cards");
            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            expect(model.buyHint("cards")).toBe("bought");
        });
    });

    describe("guessing final card", () => {
        it("returns true, reveals the hidden card, and marks status as won on correct guess", () => {
            // With Math.random() mocked to 0, hiddenCard is the first card in level1 deck (H-A).
            const correctCard = level1.deck[0]!;
            const result = model.guessCard(correctCard);

            expect(result).toBe(true);
            const state = model.getState();
            expect(state.status).toBe("won");
            expect(state.hiddenCard.isRevealed).toBe(true);
            expect(state.hiddenCard.card).toEqual(correctCard);
            expect(state.hasGuessedThisQuestion).toBe(true);
        });

        it("returns false, records the card in incorrectlyGuessedCards, and stays playing on wrong guess", () => {
            const wrongCard = level1.deck[1]!; // H-2 (not H-A)
            const result = model.guessCard(wrongCard);

            expect(result).toBe(false);
            const state = model.getState();
            expect(state.status).toBe("playing");
            expect(state.hiddenCard.isRevealed).toBe(false);
            expect(state.hasGuessedThisQuestion).toBe(true);
            expect(state.incorrectlyGuessedCards).toContainEqual(wrongCard);
        });

        it("allows only one guess per question and rejects subsequent guesses", () => {
            const wrongCard1 = level1.deck[1]!;
            const wrongCard2 = level1.deck[2]!;

            expect(model.guessCard(wrongCard1)).toBe(false);
            // Second guess on same question should fail
            expect(model.guessCard(wrongCard2)).toBe(false);

            const state = model.getState();
            expect(state.incorrectlyGuessedCards).toHaveLength(1);
            expect(state.incorrectlyGuessedCards[0]).toEqual(wrongCard1);
        });

        it("resets hasGuessedThisQuestion on nextQuestion() so player can guess again", () => {
            const wrongCard1 = level1.deck[1]!;
            model.guessCard(wrongCard1);
            expect(model.getState().hasGuessedThisQuestion).toBe(true);

            // Answer question to advance
            model.submitAnswer(correctAnswer());
            model.nextQuestion();

            expect(model.getState().hasGuessedThisQuestion).toBe(false);

            const wrongCard2 = level1.deck[2]!;
            expect(model.guessCard(wrongCard2)).toBe(false);
            expect(model.getState().incorrectlyGuessedCards).toHaveLength(2);
        });

        it("disallows guesses when game status is not playing", () => {
            // Lose the game by getting max strikes
            for (let i = 0; i < level1.maxStrikes; i++) {
                model.submitAnswer(wrongAnswer());
            }
            expect(model.getState().status).toBe("lost");

            const card = level1.deck[0]!;
            expect(model.guessCard(card)).toBe(false);
        });

        it("calculates reward correctly using candidate count", () => {
            const initialReward = model.getReward();
            const initialCandidates = model.getState().remainingPossibleCards.length;
            expect(initialReward).toBe(calculateReward(initialCandidates));

            // Make an incorrect guess that is among remaining possible cards
            const wrongCard = model.getState().remainingPossibleCards.find(c => c.id !== level1.deck[0]!.id) ?? level1.deck[1]!;
            model.guessCard(wrongCard);

            const remainingCandidates = model.getState().remainingPossibleCards.filter(
                c => !model.getState().incorrectlyGuessedCards.some(ic => ic.id === c.id)
            ).length;
            expect(model.getReward()).toBe(calculateReward(remainingCandidates));
        });

        it("resets hasGuessedThisQuestion when completing the final question so player gets one last guess", () => {
            // Player guesses during the questions (e.g. before the last question)
            const wrongCard = level1.deck[1]!;
            model.guessCard(wrongCard);
            expect(model.getState().hasGuessedThisQuestion).toBe(true);

            // Complete all questions
            completeGame();
            expect(model.getState().status).toBe("won");
            // The user is given one last guess at the end of all questions
            expect(model.getState().hasGuessedThisQuestion).toBe(false);

            // Now guess the correct card on their final guess
            const correctCard = level1.deck[0]!;
            const result = model.guessCard(correctCard);
            expect(result).toBe(true);
            expect(model.getState().hiddenCard.isRevealed).toBe(true);
            expect(model.getState().hiddenCard.card).toEqual(correctCard);
        });

        it("allows only one last guess at the end of all questions", () => {
            completeGame();
            expect(model.getState().hasGuessedThisQuestion).toBe(false);

            const wrongCard1 = level1.deck[1]!;
            expect(model.guessCard(wrongCard1)).toBe(false);
            expect(model.getState().hasGuessedThisQuestion).toBe(true);

            // Subsequent guess should be rejected
            const wrongCard2 = level1.deck[2]!;
            expect(model.guessCard(wrongCard2)).toBe(false);
        });
    });
});
