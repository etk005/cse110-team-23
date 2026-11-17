import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";
import type { GameState, HintKind, Level } from "../shared/types.ts";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";
import { PlayerResources } from "../game/playerResources.ts";
import { COST_OF_CLUE } from "../constants.ts";

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

const viewMock = vi.hoisted(() => ({
    onAnswer: undefined as ((answer: string) => void) | undefined,
    onMenu: undefined as (() => void) | undefined,
    onNext: undefined as (() => void) | undefined,
    onBuyInfo: undefined as (() => void) | undefined,
    onChooseHint: undefined as ((kind: HintKind) => void) | undefined,
    render: vi.fn(),
    updateResources: vi.fn(),
    showRemainingCards: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("../screens/GameScreen/GameScreenView.ts", () => ({
    GameScreenView: class {
        constructor(
            onAnswer: (answer: string) => void,
            onMenu: () => void,
            onNext: () => void,
            onBuyInfo: () => void,
            onChooseHint: (kind: HintKind) => void
        ) {
            viewMock.onAnswer = onAnswer;
            viewMock.onMenu = onMenu;
            viewMock.onNext = onNext;
            viewMock.onBuyInfo = onBuyInfo;
            viewMock.onChooseHint = onChooseHint;
        }

        render = viewMock.render;
        updateResources = viewMock.updateResources;
        showRemainingCards = viewMock.showRemainingCards;
        show = viewMock.show;
        hide = viewMock.hide;
    },
}));

import { GameScreenController } from "../screens/GameScreen/GameScreenController.ts";

describe("GameScreenController", () => {
    let controller: GameScreenController;
    let switchToScreen: ReturnType<typeof vi.fn<(screen: Screen) => void>>;
    let resources: PlayerResources;

    function currentState(): GameState {
        return viewMock.render.mock.lastCall?.[0];
    }

    function correctAnswer(): string {
        const state = currentState();

        const testModel = new GameScreenModel();
        testModel.setLevel(level1);
        const testState = testModel.getState();

        testState.remainingPossibleCards = state.remainingPossibleCards;
        testState.currentQuestion = state.currentQuestion;

        return String(testModel.getCorrectAnswer());
    }

    function wrongAnswer(): string {
        const answer = Number(correctAnswer());
        return answer === 0 ? "1" : "0";
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Math, "random").mockReturnValue(0);

        switchToScreen = vi.fn<(screen: Screen) => void>();

        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };

        resources = new PlayerResources(10);
        controller = new GameScreenController(screenSwitcher, resources);
        controller.setLevel(level1);
        controller.startGame();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows the game when starting", () => {
        expect(viewMock.show).toHaveBeenCalled();
        expect(viewMock.render).toHaveBeenCalled();
    });

    it("renders the initial playing state", () => {
        expect(currentState().status).toBe("playing");
        expect(currentState().strikes).toBe(0);
        expect(currentState().questionsAnswered).toBe(0);
    });

    it("shows correct feedback after a valid answer", () => {
        viewMock.onAnswer?.(correctAnswer());

        expect(viewMock.render).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            "Correct! Great job!",
            true
        );
    });

    it("shows incorrect feedback after a wrong answer", () => {
        viewMock.onAnswer?.(wrongAnswer());

        expect(viewMock.render).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.anything(),
            "Incorrect! Try again.",
            false
        );
    });

    it("increases strikes after an incorrect answer", () => {
        viewMock.onAnswer?.(wrongAnswer());

        expect(currentState().strikes).toBe(1);
    });

    it("does not skip unanswered questions", () => {
        const originalQuestion = currentState().currentQuestion;

        viewMock.onNext?.();

        expect(currentState().currentQuestion).toEqual(originalQuestion);
    });

    it("advances when Next Question is clicked", () => {
        const originalQuestion = currentState().currentQuestion;

        viewMock.onAnswer?.(correctAnswer());

        if (currentState().status === "playing") {
            viewMock.onNext?.();

            expect(currentState().currentQuestion).not.toEqual(
                originalQuestion
            );
        }
    });

    it("opens results when maximum strikes are reached", () => {
        const maxStrikes = currentState().maxStrikes;
        const answer = wrongAnswer();

        for (let i = 0; i < maxStrikes; i++) {
            viewMock.onAnswer?.(answer);
        }

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "result",
            won: false,
            points: 0,
        });
        expect(resources.getScore()).toBe(0);
    });

    it("records points and opens results when the level is won", () => {
        // one strike first, so the level is worth 10 - 1
        viewMock.onAnswer?.(wrongAnswer());

        while (currentState().status === "playing") {
            viewMock.onAnswer?.(correctAnswer());
            viewMock.onNext?.();
        }

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "result",
            won: true,
            points: 9,
        });
        expect(resources.getScore()).toBe(9);
    });

    it("shows the starting coins, score and level points", () => {
        expect(viewMock.updateResources).toHaveBeenLastCalledWith(10, 0, 10);
    });

    it("updates the readout when coins change", () => {
        resources.spendCoins(4);
        expect(viewMock.updateResources).toHaveBeenLastCalledWith(6, 0, 10);

        resources.earnCoins(2);
        expect(viewMock.updateResources).toHaveBeenLastCalledWith(8, 0, 10);
    });

    it("lowers the level points shown after each strike", () => {
        viewMock.onAnswer?.(wrongAnswer());
        expect(viewMock.updateResources).toHaveBeenLastCalledWith(10, 0, 9);

        viewMock.onAnswer?.(wrongAnswer());
        expect(viewMock.updateResources).toHaveBeenLastCalledWith(10, 0, 8);
    });

    it("resets when starting a new game", () => {
        viewMock.onAnswer?.(wrongAnswer());

        controller.startGame();

        expect(currentState().strikes).toBe(0);
        expect(currentState().questionsAnswered).toBe(0);
    });

    it("returns to the menu", () => {
        viewMock.onMenu?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "menu",
        });
    });

    describe("Paid hints", () => {
        it("opens the hint picker without spending coins or unlocking hints", () => {
            const coinsBefore = resources.getCoins();

            viewMock.onBuyInfo!();

            expect(resources.getCoins()).toBe(coinsBefore);
            expect(currentState()).toMatchObject({
                choosingHint: true,
                canViewRemainingCards: false,
                probabilityRange: null,
            });
            expect(viewMock.showRemainingCards).not.toHaveBeenCalled();
            expect(viewMock.render).toHaveBeenLastCalledWith(
                expect.anything(), expect.anything(), "Choose a hint.", false
            );
        });

        it("allows the free hint picker to open with no coins", () => {
            resources.spendCoins(resources.getCoins());

            viewMock.onBuyInfo!();

            expect(resources.getCoins()).toBe(0);
            expect(currentState().choosingHint).toBe(true);
        });

        describe.each(["cards", "range"] as const)("%s purchases", (kind) => {
            it("spends shared coins, unlocks the selected hint, and updates the readout", () => {
                const coinsBefore = resources.getCoins();
                viewMock.onBuyInfo!();

                viewMock.onChooseHint!(kind);

                expect(resources.getCoins()).toBe(coinsBefore - COST_OF_CLUE);
                expect(currentState().choosingHint).toBe(false);
                expect(viewMock.updateResources).toHaveBeenLastCalledWith(
                    coinsBefore - COST_OF_CLUE, 0, 10
                );
                expect(viewMock.render).toHaveBeenLastCalledWith(
                    expect.anything(), expect.anything(), "Clue bought!", false
                );

                if (kind === "cards") {
                    expect(currentState().canViewRemainingCards).toBe(true);
                    expect(currentState().probabilityRange).toBeNull();
                    expect(viewMock.showRemainingCards).toHaveBeenCalledExactlyOnceWith(
                        currentState().remainingPossibleCards
                    );
                } else {
                    expect(currentState().probabilityRange).not.toBeNull();
                    expect(currentState().canViewRemainingCards).toBe(false);
                    expect(viewMock.showRemainingCards).not.toHaveBeenCalled();
                }
            });

            it("allows a purchase when the balance exactly equals the cost", () => {
                resources.spendCoins(resources.getCoins() - COST_OF_CLUE);
                viewMock.onBuyInfo!();

                viewMock.onChooseHint!(kind);

                expect(resources.getCoins()).toBe(0);
                expect(currentState().choosingHint).toBe(false);
                if (kind === "cards") {
                    expect(currentState().canViewRemainingCards).toBe(true);
                } else {
                    expect(currentState().probabilityRange).not.toBeNull();
                }
            });

            it.each([0, COST_OF_CLUE - 1])(
                "rejects a purchase with %i coins without changing hint state",
                (balance) => {
                    resources.spendCoins(resources.getCoins() - balance);
                    viewMock.onBuyInfo!();
                    const stateBefore = structuredClone(currentState());

                    viewMock.onChooseHint!(kind);

                    expect(resources.getCoins()).toBe(balance);
                    expect(currentState()).toEqual(stateBefore);
                    expect(viewMock.showRemainingCards).not.toHaveBeenCalled();
                    expect(viewMock.render).toHaveBeenLastCalledWith(
                        expect.anything(), expect.anything(), "Not enough coins!", false
                    );
                }
            );

            it("does not charge or open a popup again for a duplicate purchase", () => {
                viewMock.onBuyInfo!();
                viewMock.onChooseHint!(kind);
                const coinsAfterPurchase = resources.getCoins();
                const stateAfterPurchase = structuredClone(currentState());
                viewMock.showRemainingCards.mockClear();

                viewMock.onChooseHint!(kind);

                expect(resources.getCoins()).toBe(coinsAfterPurchase);
                expect(currentState()).toEqual(stateAfterPurchase);
                expect(viewMock.showRemainingCards).not.toHaveBeenCalled();
                expect(viewMock.render).toHaveBeenLastCalledWith(
                    expect.anything(), expect.anything(), "You already bought that hint.", false
                );
            });

        });

        it("charges once per hint and refuses to reopen the picker when both are unlocked", () => {
            const coinsBefore = resources.getCoins();
            viewMock.onBuyInfo!();
            viewMock.onChooseHint!("cards");
            viewMock.onBuyInfo!();
            viewMock.onChooseHint!("range");

            viewMock.onBuyInfo!();

            expect(resources.getCoins()).toBe(coinsBefore - 2 * COST_OF_CLUE);
            expect(currentState().choosingHint).toBe(false);
            expect(currentState().canViewRemainingCards).toBe(true);
            expect(currentState().probabilityRange).not.toBeNull();
            expect(viewMock.render).toHaveBeenLastCalledWith(
                expect.anything(), expect.anything(), "You already bought that hint.", false
            );
        });

        it("allows buying a new range on the next question while keeping cards unlocked", () => {
            const coinsBefore = resources.getCoins();
            viewMock.onChooseHint!("cards");
            viewMock.onChooseHint!("range");
            viewMock.onAnswer!(correctAnswer());
            viewMock.onNext!();
            expect(currentState().canViewRemainingCards).toBe(true);
            expect(currentState().probabilityRange).toBeNull();
            expect(resources.getCoins()).toBe(coinsBefore - 2 * COST_OF_CLUE);

            viewMock.onBuyInfo!();
            viewMock.onChooseHint!("range");

            expect(currentState().canViewRemainingCards).toBe(true);
            expect(currentState().probabilityRange).not.toBeNull();
            expect(resources.getCoins()).toBe(coinsBefore - 3 * COST_OF_CLUE);
        });

        it("keeps spent coins spent when a game restarts, but resets hint access", () => {
            viewMock.onChooseHint!("cards");
            viewMock.onChooseHint!("range");
            const coinsAfterPurchases = resources.getCoins();

            controller.startGame();

            expect(resources.getCoins()).toBe(coinsAfterPurchases);
            expect(currentState()).toMatchObject({
                choosingHint: false,
                canViewRemainingCards: false,
                probabilityRange: null,
            });
            expect(viewMock.updateResources).toHaveBeenLastCalledWith(
                coinsAfterPurchases, 0, 10
            );
        });
    });
});
