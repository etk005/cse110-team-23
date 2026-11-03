
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";

const viewMock = vi.hoisted(() => ({
    onRetry: undefined as (() => void) | undefined,
    onNextLevel: undefined as (() => void) | undefined,
    onLobby: undefined as (() => void) | undefined,
    render: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("../screens/ResultsScreen/ResultsScreenView.ts", () => ({
    ResultsScreenView: class {
        constructor(
            onRetry: () => void,
            onNextLevel: () => void,
            onLobby: () => void
        ) {
            viewMock.onRetry = onRetry;
            viewMock.onNextLevel = onNextLevel;
            viewMock.onLobby = onLobby;
        }

        render = viewMock.render;
        show = viewMock.show;
        hide = viewMock.hide;
    },
}));

import { ResultsScreenController } from "../screens/ResultsScreen/ResultsScreenController.ts";

describe("ResultsScreenController", () => {
    let controller: ResultsScreenController;
    let switchToScreen: ReturnType<typeof vi.fn<(screen: Screen) => void>>;
    const winResult: Extract<Screen, { type: "result" }> = {
        type: "result",
        score: 3,
        status: "won",
        levelId: 1,
        questionsRequired: 3,
        hiddenCard: { id: "H-A", suit: "hearts", rank: "A" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    
        switchToScreen = vi.fn<(screen: Screen) => void>();
    
        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };
    
        controller = new ResultsScreenController(screenSwitcher);
    });
    
    it("displays the provided final score", () => {
        const lossResult: Extract<Screen, { type: "result" }> = {
            type: "result",
            score: 2,
            status: "lost",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: { id: "S-3", suit: "spades", rank: "3" },
        };

        controller.showResults(lossResult);

        expect(viewMock.render).toHaveBeenCalledWith(lossResult);
        expect(viewMock.show).toHaveBeenCalled();
    });

    it("displays successful completion", () => {
        controller.showResults(winResult);

        expect(viewMock.render).toHaveBeenCalledWith(winResult);
    });

    it("retries the game when Retry is clicked", () => {
        viewMock.onRetry?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "game",
        });
    });

    it("returns to levels lobby when Lobby is clicked", () => {
        viewMock.onLobby?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "levels",
        });
    });

    it("loads the next level when Next Level is clicked", () => {
        controller.showResults(winResult);

        viewMock.onNextLevel?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "loading",
            loader: expect.any(Function),
        });
    });

    it("updates the results on subsequent games", () => {
        controller.showResults(winResult);

        const updatedResult: Extract<Screen, { type: "result" }> = {
            ...winResult,
            score: 1,
            status: "lost",
        };
        controller.showResults(updatedResult);

        expect(viewMock.render).toHaveBeenLastCalledWith(updatedResult);
    });
});
