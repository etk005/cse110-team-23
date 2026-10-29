
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";

const viewMock = vi.hoisted(() => ({
    onAnswer: undefined as ((answer: string) => void) | undefined,
    onMenu: undefined as (() => void) | undefined,
    onNext: undefined as (() => void) | undefined,
    render: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("../screens/GameScreen/GameScreenView.ts", () => ({
    GameScreenView: class {
        constructor(
            onAnswer: (answer: string) => void,
            onMenu: () => void,
            onNext: () => void
        ) {
            viewMock.onAnswer = onAnswer;
            viewMock.onMenu = onMenu;
            viewMock.onNext = onNext;
        }

        render = viewMock.render;
        show = viewMock.show;
        hide = viewMock.hide;
    },
}));

import { GameScreenController } from "../screens/GameScreen/GameScreenController.ts";

describe("GameScreenController", () => {
    let controller: GameScreenController;
    let switchToScreen: ReturnType<typeof vi.fn<(screen: Screen) => void>>;

    function currentState() {
        return viewMock.render.mock.lastCall?.[0];
    }

    function correctAnswer(): string {
        const options = viewMock.render.mock.lastCall?.[1] as string[];
        const state = currentState();
    
        const testModel = new GameScreenModel();
        const testState = testModel.getState();
    
        testState.remainingPossibleCards = state.remainingPossibleCards;
        testState.currentQuestion = state.currentQuestion;
    
        const expected = testModel.getCorrectAnswer();
    
        const matchingOption = options.find((option) => {
            const parts = option.split("/");
            const value = parts.length === 2
                ? Number(parts[0]) / Number(parts[1])
                : Number(option);
    
            return value === expected;
        });
    
        expect(matchingOption).toBeDefined();
    
        return matchingOption!;
    }

    function wrongAnswer(): string {
        const answer = Number(correctAnswer());
        return answer === 0 ? "1" : "0";
    }

    beforeEach(() => {
        vi.clearAllMocks();
    
        switchToScreen = vi.fn<(screen: Screen) => void>();
    
        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };
    
        controller = new GameScreenController(screenSwitcher);
        controller.startGame();
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
            score: 0,
        });
    });

    it("returns to the menu", () => {
        viewMock.onMenu?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "menu",
        });
    });

    it("resets when starting a new game", () => {
        viewMock.onAnswer?.(wrongAnswer());

        controller.startGame();

        expect(currentState().strikes).toBe(0);
        expect(currentState().questionsAnswered).toBe(0);
    });
});
