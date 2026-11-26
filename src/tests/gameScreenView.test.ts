import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameScreenView } from "../screens/GameScreen/GameScreenView.ts";
import type { Card, GameState, Level } from "../shared/types.ts";
import Konva from "konva";

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
        { id: "S-10", suit: "spades", rank: "10" },
    ],
    maxStrikes: 3,
    questionsRequired: 3,
};

function makeMockState(overrides: Partial<GameState> = {}): GameState {
    return {
        gameId: "test-game",
        levelId: 1,
        status: "playing",
        deck: level1.deck,
        hiddenCard: { isRevealed: false },
        knownInformation: [],
        currentQuestion: {
            id: "q1",
            text: "What is the probability?",
            answerType: "fraction",
            property: "suit",
            operator: "equals",
            value: "hearts",
        },
        strikes: 0,
        maxStrikes: 3,
        questionsAnswered: 0,
        questionsRequired: 3,
        remainingPossibleCards: level1.deck,
        choosingHint: false,
        canViewRemainingCards: false,
        probabilityRange: null,
        incorrectlyGuessedCards: [],
        hasGuessedThisQuestion: false,
        ...overrides,
    };
}

describe("GameScreenView - Guessing Functionality", () => {
    let onAnswer: (answer: string) => void;
    let onMenu: () => void;
    let onNext: () => void;
    let onBuyInfo: () => void;
    let onChooseHint: (kind: any) => void;
    let onGuess: (card: Card) => void;
    let view: GameScreenView;

    beforeEach(() => {
        Konva.Util.createCanvasElement = () => {
            return {
                getContext: () => ({
                    measureText: () => ({ width: 10 }),
                    fillText: () => {},
                    strokeText: () => {},
                    save: () => {},
                    restore: () => {},
                    clearRect: () => {},
                    fillRect: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    stroke: () => {},
                    fill: () => {},
                }),
                style: {},
                setAttribute: () => {},
                getAttribute: () => null,
            } as any;
        };
        Konva.Util.createImageElement = () => ({} as any);
        vi.spyOn(Konva.Image, "fromURL").mockImplementation((() => {}) as any);
        onAnswer = vi.fn();
        onMenu = vi.fn();
        onNext = vi.fn();
        onBuyInfo = vi.fn();
        onChooseHint = vi.fn();
        onGuess = vi.fn();

        view = new GameScreenView(
            onAnswer,
            onMenu,
            onNext,
            onBuyInfo,
            onChooseHint,
            onGuess
        );
    });

    describe("Card Input Parsing", () => {
        // We can test parseCardInput through submitGuess with mock input elements or by calling render
        it("correctly parses <rank><suit> inputs", () => {
            view.render(makeMockState(), []);
            const parse = (view as any).parseCardInput.bind(view);

            expect(parse("AH")).toEqual({ id: "H-A", suit: "hearts", rank: "A" });
            expect(parse("10S")).toEqual({ id: "S-10", suit: "spades", rank: "10" });
            expect(parse("H2")).toEqual({ id: "H-2", suit: "hearts", rank: "2" });
            expect(parse("2H")).toEqual({ id: "H-2", suit: "hearts", rank: "2" });
        });

        it("normalizes '1' to 'A'", () => {
            view.render(makeMockState(), []);
            const parse = (view as any).parseCardInput.bind(view);

            expect(parse("1S")).toEqual({ id: "S-A", suit: "spades", rank: "A" });
            expect(parse("1H")).toEqual({ id: "H-A", suit: "hearts", rank: "A" });
        });

        it("is case-insensitive and trims whitespace/dashes", () => {
            view.render(makeMockState(), []);
            const parse = (view as any).parseCardInput.bind(view);

            expect(parse("ah")).toEqual({ id: "H-A", suit: "hearts", rank: "A" });
            expect(parse(" 10s ")).toEqual({ id: "S-10", suit: "spades", rank: "10" });
            expect(parse("h-a")).toEqual({ id: "H-A", suit: "hearts", rank: "A" });
            expect(parse("s-10")).toEqual({ id: "S-10", suit: "spades", rank: "10" });
        });

        it("returns null for invalid ranks or suits", () => {
            view.render(makeMockState(), []);
            const parse = (view as any).parseCardInput.bind(view);

            expect(parse("")).toBeNull();
            expect(parse("99S")).toBeNull();
            expect(parse("0S")).toBeNull();
            expect(parse("15H")).toBeNull();
            expect(parse("ZZ")).toBeNull();
            expect(parse("A")).toBeNull(); // Missing suit
            expect(parse("S")).toBeNull(); // Missing rank
            expect(parse("invalid")).toBeNull();
        });
    });

    describe("UI Button and Input Visibility", () => {
        function findButtonWithLabel(group: Konva.Group, label: string): Konva.Group | undefined {
            const allGroups = group.find<Konva.Group>("Group");
            return allGroups.find((g) => {
                const textNode = g.findOne<Konva.Text>("Text");
                return textNode?.text() === label;
            });
        }

        function findKonvaTextWithContent(group: Konva.Group, textContent: string): Konva.Text | undefined {
            const allTexts = group.find<Konva.Text>("Text");
            return allTexts.find((t) => t.text() === textContent);
        }

        it("shows the Guess button during an active question when player hasn't guessed yet", () => {
            view.render(makeMockState(), []);
            const group = view.getGroup();

            const guessButton = findButtonWithLabel(group, "Guess");
            expect(guessButton).toBeDefined();
            expect((view as any).canGuess).toBe(true);
            expect((view as any).wantGuessInput).toBe(true);
        });

        it("hides the Guess button between questions, but keeps the text input", () => {
            view.render(makeMockState(), [], "Correct! Great job!", true);
            const group = view.getGroup();

            const guessButton = findButtonWithLabel(group, "Guess");
            expect(guessButton).toBeUndefined(); // Button disappeared!
            expect((view as any).canGuess).toBe(false);
            expect((view as any).wantGuessInput).toBe(true); // Input stays!
        });

        it("hides the Guess button if player has already guessed for this question", () => {
            view.render(makeMockState({ hasGuessedThisQuestion: true }), []);
            const group = view.getGroup();

            const guessButton = findButtonWithLabel(group, "Guess");
            expect(guessButton).toBeUndefined(); // Button disappeared!
            expect((view as any).canGuess).toBe(false);
            expect((view as any).wantGuessInput).toBe(true); // Input stays!
        });

        it("hides the Guess button at the end of the level (won), but keeps the text input", () => {
            view.render(makeMockState({ status: "won" }), [], "Level cleared!", true);
            const group = view.getGroup();

            const guessButton = findButtonWithLabel(group, "Guess");
            expect(guessButton).toBeUndefined(); // Button disappeared!
            expect((view as any).canGuess).toBe(false);
            expect((view as any).wantGuessInput).toBe(true); // Input stays!
        });

        it("keeps the hint text fixed as 'Enter a rank and suit, like AH or 10S.'", () => {
            view.render(makeMockState(), []);
            expect(findKonvaTextWithContent(view.getGroup(), "Enter a rank and suit, like AH or 10S.")).toBeDefined();

            // When between questions
            view.render(makeMockState(), [], "", true);
            expect(findKonvaTextWithContent(view.getGroup(), "Enter a rank and suit, like AH or 10S.")).toBeDefined();

            // When already guessed
            view.render(makeMockState({ hasGuessedThisQuestion: true }), []);
            expect(findKonvaTextWithContent(view.getGroup(), "Enter a rank and suit, like AH or 10S.")).toBeDefined();

            // When won at the end of the level
            view.render(makeMockState({ status: "won" }), [], "", true);
            expect(findKonvaTextWithContent(view.getGroup(), "Enter a rank and suit, like AH or 10S.")).toBeDefined();
        });
    });

    describe("Hint Options Layout", () => {
        function findButtonWithLabel(group: Konva.Group, label: string): Konva.Group | undefined {
            const allGroups = group.find<Konva.Group>("Group");
            return allGroups.find((g) => {
                const textNode = g.findOne<Konva.Text>("Text");
                return textNode?.text() === label;
            });
        }

        it("stacks hint options vertically so they do not overlap the right column / guess card", () => {
            view.render(makeMockState({ choosingHint: true }), []);
            const group = view.getGroup();

            const cardsBtn = findButtonWithLabel(group, "See remaining cards");
            const rangeBtn = findButtonWithLabel(group, "Probability range");

            expect(cardsBtn).toBeDefined();
            expect(rangeBtn).toBeDefined();

            // Both buttons must share the same horizontal X coordinate (stacked vertically)
            expect(cardsBtn!.x()).toBe(rangeBtn!.x());

            // "See remaining cards" sits on top of "Probability range"
            expect(cardsBtn!.y()).toBeLessThan(rangeBtn!.y());

            // Neither button's right boundary extends into the right column (which starts at 384)
            const cardsBtnRect = cardsBtn!.findOne<Konva.Rect>("Rect")!;
            const rangeBtnRect = rangeBtn!.findOne<Konva.Rect>("Rect")!;

            expect(cardsBtn!.x() + cardsBtnRect.width()).toBeLessThan(384);
            expect(rangeBtn!.x() + rangeBtnRect.width()).toBeLessThan(384);
        });

        it("calls onChooseHint when clicking each hint option", () => {
            view.render(makeMockState({ choosingHint: true }), []);
            const group = view.getGroup();

            const cardsBtn = findButtonWithLabel(group, "See remaining cards");
            const rangeBtn = findButtonWithLabel(group, "Probability range");

            cardsBtn?.fire("click");
            expect(onChooseHint).toHaveBeenCalledWith("cards");

            rangeBtn?.fire("click");
            expect(onChooseHint).toHaveBeenCalledWith("range");
        });

        it("renders a single button at the standard position when only one hint option is available", () => {
            view.render(makeMockState({ choosingHint: true, canViewRemainingCards: true }), []);
            const group = view.getGroup();

            const cardsBtn = findButtonWithLabel(group, "See remaining cards");
            const rangeBtn = findButtonWithLabel(group, "Probability range");

            expect(cardsBtn).toBeUndefined();
            expect(rangeBtn).toBeDefined();
        });
    });

    describe("Guess Submission & Feedback", () => {
        it("triggers showGuessError and displays 'Invalid format!' when submitting invalid text", () => {
            view.render(makeMockState(), []);

            // Set up mock input
            (view as any).guessInput = { value: "invalid" };

            (view as any).submitGuess();

            expect(onGuess).not.toHaveBeenCalled();
            expect((view as any).guessError).toBe(true);
            expect((view as any).guessFeedbackText?.text()).toBe("Invalid format!");
        });

        it("clears 'Invalid format!' error on clearGuessError", () => {
            view.render(makeMockState(), []);
            (view as any).guessInput = { value: "invalid" };
            (view as any).submitGuess();
            expect((view as any).guessFeedbackText?.text()).toBe("Invalid format!");

            (view as any).clearGuessError();
            expect((view as any).guessFeedbackText?.text()).toBe("");
            expect((view as any).guessError).toBe(false);
        });

        it("submits valid guess and calls onGuess with parsed card", () => {
            view.render(makeMockState(), []);
            (view as any).guessInput = { value: "AH" };

            (view as any).submitGuess();

            expect(onGuess).toHaveBeenCalledWith({ id: "H-A", suit: "hearts", rank: "A" });
            expect((view as any).guessInput.value).toBe("");
        });

        it("does not submit when canGuess is false", () => {
            // Render when between questions (canGuess = false)
            view.render(makeMockState(), [], "", true);
            (view as any).guessInput = { value: "AH" };

            (view as any).submitGuess();

            expect(onGuess).not.toHaveBeenCalled();
        });

        it("routes guess feedback to the finalGuessPanel", () => {
            view.render(makeMockState(), []);
            (view as any).lastAction = "guess";

            view.render(makeMockState(), [], "Keep trying!");
            expect((view as any).guessFeedbackText?.text()).toBe("Keep trying!");

            view.render(makeMockState(), [], "Not enough coins!");
            expect((view as any).guessFeedbackText?.text()).toBe("Not enough coins!");

            view.render(makeMockState({ status: "won" }), [], "You guessed it!");
            expect((view as any).guessFeedbackText?.text()).toBe("You guessed it!");
        });
    });
});
