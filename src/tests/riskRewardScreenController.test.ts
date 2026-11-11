import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen, ScreenSwitcher } from "../types.ts";
import type {
    RiskRewardHandlers,
    RiskRewardViewState,
} from "../screens/RiskRewardScreen/RiskRewardScreenView.ts";
import type { CalcField } from "../screens/RiskRewardScreen/RiskRewardScreenModel.ts";

const viewMock = vi.hoisted(() => ({
    handlers: undefined as RiskRewardHandlers | undefined,
    inputs: { risk: "", reward: "", expectedValue: "" } as Record<CalcField, string>,
    render: vi.fn(),
    setFieldFeedback: vi.fn(),
    clearInputs: vi.fn(),
}));

vi.mock("../screens/RiskRewardScreen/RiskRewardScreenView.ts", () => ({
    RiskRewardScreenView: class {
        constructor(handlers: RiskRewardHandlers) {
            viewMock.handlers = handlers;
        }
        render = viewMock.render;
        setFieldFeedback = viewMock.setFieldFeedback;
        clearInputs = viewMock.clearInputs;
        getInputValues = () => viewMock.inputs;
        show = vi.fn();
        hide = vi.fn();
        getGroup = vi.fn();
    },
}));

const { RiskRewardScreenController } = await import(
    "../screens/RiskRewardScreen/RiskRewardScreenController.ts"
);

function lastState(): RiskRewardViewState {
    return viewMock.render.mock.lastCall?.[0] as RiskRewardViewState;
}

describe("RiskRewardScreenController", () => {
    let screens: Screen[];
    let controller: InstanceType<typeof RiskRewardScreenController>;

    const typeCorrectAnswers = (): void => {
        const answers = controller.getModel().getCorrectAnswers();
        viewMock.inputs = {
            risk: String(answers.risk),
            reward: String(answers.reward),
            expectedValue: String(answers.expectedValue),
        };
    };
    const flip = (type: "risk" | "reward"): void => {
        const model = controller.getModel();
        const index = model.getDeck().findIndex((card, i) => card.type === type && !model.isRevealed(i));
        viewMock.handlers?.onFlip(index);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        viewMock.inputs = { risk: "", reward: "", expectedValue: "" };
        screens = [];
        const switcher: ScreenSwitcher = { switchToScreen: (screen) => screens.push(screen) };
        controller = new RiskRewardScreenController(switcher);
        controller.startGame();
    });

    it("starts locked with every card face-down", () => {
        expect(lastState().phase).toBe("calculating");
        expect(lastState().cards.every((face) => face === null)).toBe(true);
    });

    it("shows per-field feedback and keeps cards locked on wrong answers", () => {
        viewMock.inputs = { risk: "1/3", reward: "1/2", expectedValue: "" };
        viewMock.handlers?.onSubmit();

        expect(viewMock.setFieldFeedback).toHaveBeenCalledWith("risk", expect.stringContaining("Correct"), "success");
        expect(viewMock.setFieldFeedback).toHaveBeenCalledWith("reward", expect.stringContaining("Not quite"));
        expect(viewMock.setFieldFeedback).toHaveBeenCalledWith("expectedValue", "Enter a value.");
        expect(lastState().phase).toBe("calculating");
        expect(lastState().messageTone).toBe("error");
    });

    it("unlocks cards after a correct resubmit", () => {
        viewMock.inputs = { risk: "1", reward: "0", expectedValue: "0" };
        viewMock.handlers?.onSubmit();
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        expect(lastState().phase).toBe("flipping");
    });

    it("ignores flips while locked", () => {
        flip("reward");
        expect(controller.getModel().getTotalCount()).toBe(21);
    });

    it("flags badly formatted input as the player types", () => {
        viewMock.handlers?.onInputChange("risk", "2");
        expect(viewMock.setFieldFeedback).toHaveBeenLastCalledWith("risk", expect.stringContaining("between 0 and 1"));
        viewMock.handlers?.onInputChange("risk", "1/3");
        expect(viewMock.setFieldFeedback).toHaveBeenLastCalledWith("risk", null);
    });

    it("a Reward adds chips, clears the inputs and starts the next round", () => {
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        viewMock.clearInputs.mockClear();
        flip("reward");

        expect(viewMock.clearInputs).toHaveBeenCalled();
        expect(lastState().phase).toBe("calculating");
        expect(lastState().chips).toBe(1);
        expect(lastState().cardCount).toBe(20);
        expect(lastState().message).toContain("Reward +1");
    });

    it("a Risk ends the game", () => {
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        flip("risk");

        expect(lastState().phase).toBe("lost");
        expect(lastState().message).toContain("Risk");
        viewMock.handlers?.onMenu();
        expect(screens).toEqual([{ type: "menu" }]);
    });
});
