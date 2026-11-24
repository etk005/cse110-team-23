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
    setRulesOpen: vi.fn(),
}));

vi.mock("../screens/RiskRewardScreen/RiskRewardScreenView.ts", () => ({
    RiskRewardScreenView: class {
        constructor(handlers: RiskRewardHandlers) {
            viewMock.handlers = handlers;
        }
        render = viewMock.render;
        setFieldFeedback = viewMock.setFieldFeedback;
        clearInputs = viewMock.clearInputs;
        setRulesOpen = viewMock.setRulesOpen;
        getInputValues = () => viewMock.inputs;
        show = vi.fn();
        hide = vi.fn();
        getGroup = vi.fn();
    },
}));

const { RiskRewardScreenController } = await import(
    "../screens/RiskRewardScreen/RiskRewardScreenController.ts"
);
const { PlayerResources } = await import("../game/playerResources.ts");

function lastState(): RiskRewardViewState {
    return viewMock.render.mock.lastCall?.[0] as RiskRewardViewState;
}

describe("RiskRewardScreenController", () => {
    let screens: Screen[];
    let resources: InstanceType<typeof PlayerResources>;
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
        resources = new PlayerResources(10);
        controller = new RiskRewardScreenController(switcher, resources);
        controller.startGame();
    });

    it("starts locked with the player's coins shown", () => {
        expect(lastState().phase).toBe("calculating");
        expect(lastState().coins).toBe(10);
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

    it("cashing out turns the chips into coins", () => {
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        flip("reward");
        expect(lastState().phase).toBe("reward");
        expect(lastState().canContinue).toBe(true);

        const won = lastState().chips;
        expect(won).toBeGreaterThan(0);
        expect(lastState().message).toContain(`Reward +${won}`);

        viewMock.handlers?.onCashOut();
        expect(resources.getCoins()).toBe(10 + won);
        expect(lastState().phase).toBe("cashedOut");
        expect(lastState().coins).toBe(10 + won);

        viewMock.handlers?.onMenu();
        expect(screens).toEqual([{ type: "menu" }]);
    });

    it("starts each new game with Quick Rules closed", () => {
        expect(viewMock.setRulesOpen).toHaveBeenCalledWith(false);
        viewMock.setRulesOpen.mockClear();
        controller.startGame();
        expect(viewMock.setRulesOpen).toHaveBeenCalledWith(false);
    });

    it("continue clears the inputs and starts a new round", () => {
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        flip("reward");
        viewMock.clearInputs.mockClear();

        viewMock.handlers?.onContinue();
        expect(viewMock.clearInputs).toHaveBeenCalled();
        expect(lastState().phase).toBe("calculating");
        expect(lastState().chips).toBeGreaterThan(0);
        expect(lastState().cardCount).toBe(20);
        const rewardsLeft = Object.values(lastState().rewardCounts).reduce((a, b) => a + b, 0);
        expect(rewardsLeft).toBe(13);
    });

    it("a Risk card loses the temporary chips but not the player's coins", () => {
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        flip("reward");
        viewMock.handlers?.onContinue();
        typeCorrectAnswers();
        viewMock.handlers?.onSubmit();
        flip("risk");

        expect(lastState().phase).toBe("lost");
        expect(lastState().chips).toBe(0);
        expect(resources.getCoins()).toBe(10);
        expect(lastState().message).toContain("Risk");
    });
});
