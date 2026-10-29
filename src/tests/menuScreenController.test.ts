
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";

const viewMock = vi.hoisted(() => ({
    onStart: undefined as (() => void) | undefined,
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("../screens/MenuScreen/MenuScreenView.ts", () => ({
    MenuScreenView: class {
        constructor(onStart: () => void) {
            viewMock.onStart = onStart;
        }

        show = viewMock.show;
        hide = viewMock.hide;
    },
}));

import { MenuScreenController } from "../screens/MenuScreen/MenuScreenController.ts";

describe("MenuScreenController", () => {
    let controller: MenuScreenController;
    let switchToScreen: ReturnType<typeof vi.fn<(screen: Screen) => void>>;

    beforeEach(() => {
        vi.clearAllMocks();

        switchToScreen = vi.fn<(screen: Screen) => void>();

        const screenSwitcher: ScreenSwitcher = {
            switchToScreen,
        };

        controller = new MenuScreenController(screenSwitcher);
    });

    it("switches to the game when Start is clicked", () => {
        viewMock.onStart?.();

        expect(switchToScreen).toHaveBeenCalledWith({
            type: "game",
        });
    });

    it("does not navigate before Start is clicked", () => {
        expect(switchToScreen).not.toHaveBeenCalled();
    });

    it("can show the menu", () => {
        controller.show();

        expect(viewMock.show).toHaveBeenCalledOnce();
    });

    it("can hide the menu", () => {
        controller.hide();

        expect(viewMock.hide).toHaveBeenCalledOnce();
    });
});
