
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";
import { PlayerResources } from "../game/playerResources.ts";

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
    let resources: PlayerResources;

    beforeEach(() => {
        vi.clearAllMocks();
    
        switchToScreen = vi.fn<(screen: Screen) => void>();
    
        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };
    
        resources = new PlayerResources(10);
        controller = new ResultsScreenController(screenSwitcher, resources);
    });
    
    it("displays a failed level", () => {
        controller.showResults(false, 0);

        expect(viewMock.render).toHaveBeenCalledWith(0, false, 0, 10);
        expect(viewMock.show).toHaveBeenCalled();
    });

    it("displays successful completion", () => {
        controller.showResults(true, 8);

        expect(viewMock.render).toHaveBeenCalledWith(8, true, 0, 10);
    });

    it("displays the shared total score and coins", () => {
        resources.recordLevelResult(1, 8);
        resources.recordLevelResult(2, 10);
        resources.spendCoins(3);

        controller.showResults(true, 10);

        expect(viewMock.render).toHaveBeenCalledWith(10, true, 18, 7);
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
        controller.showResults(true, 10);
        controller.showResults(false, 0);

        expect(viewMock.render).toHaveBeenLastCalledWith(0, false, 0, 10);
    });
});
