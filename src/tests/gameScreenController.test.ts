import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";

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

    it("returns to the menu", () => {
        viewMock.onMenu?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "menu",
        });
    });
});
