
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";

const viewMock = vi.hoisted(() => ({
    onRestart: undefined as (() => void) | undefined,
    onMenu: undefined as (() => void) | undefined,
    render: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("../screens/ResultsScreen/ResultsScreenView.ts", () => ({
    ResultsScreenView: class {
        constructor(
            onRestart: () => void,
            onMenu: () => void
        ) {
            viewMock.onRestart = onRestart;
            viewMock.onMenu = onMenu;
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

    beforeEach(() => {
        vi.clearAllMocks();
    
        switchToScreen = vi.fn<(screen: Screen) => void>();
    
        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };
    
        controller = new ResultsScreenController(screenSwitcher);
    });
    
    it("displays the provided final score", () => {
        controller.showResults(2);

        expect(viewMock.render).toHaveBeenCalledWith(2, false);
        expect(viewMock.show).toHaveBeenCalled();
    });

    it("displays successful completion", () => {
        controller.showResults(3);

        expect(viewMock.render).toHaveBeenCalledWith(3, true);
    });

    it("restarts the game when Play Again is clicked", () => {
        viewMock.onRestart?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "game",
        });
    });

    it("returns to menu when Main Menu is clicked", () => {
        viewMock.onMenu?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "menu",
        });
    });

    it("updates the results on subsequent games", () => {
        controller.showResults(3);
        controller.showResults(1);

        expect(viewMock.render).toHaveBeenLastCalledWith(1, false);
    });
});
