import { describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";

vi.mock("../screens/LoadingScreen/LoadingScreenView", () => ({
    LoadingScreenView: class {
        show = vi.fn();
        hide = vi.fn();
    },
}));

import { LoadingScreenController } from "../screens/LoadingScreen/LoadingScreenController.ts";

describe("LoadingScreenController", () => {
    function setup() {
        const switchToScreen = vi.fn<(screen: Screen) => void>();
        const screenSwitcher: ScreenSwitcher = { switchToScreen };
        const controller = new LoadingScreenController(screenSwitcher);

        return { controller, switchToScreen };
    }

    it("switches to the loaded screen", async () => {
        const { controller, switchToScreen } = setup();

        controller.wait(async () => ({ type: "levels" }));

        await vi.waitFor(() =>
            expect(switchToScreen).toHaveBeenCalledWith({ type: "levels" })
        );
    });

    it("returns to the menu when loading fails", async () => {
        const { controller, switchToScreen } = setup();
        vi.spyOn(console, "error").mockImplementation(() => {});

        controller.wait(async () => {
            throw new Error("bad level file");
        });

        await vi.waitFor(() =>
            expect(switchToScreen).toHaveBeenCalledWith({ type: "menu" })
        );
    });
});
