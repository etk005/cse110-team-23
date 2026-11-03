import { beforeEach, describe, expect, it } from "vitest";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel.ts";

describe("GameScreenModel", () => {
    let model: GameScreenModel;

    beforeEach(() => {
        model = new GameScreenModel();
    });

    describe("Initialization", () => {
        it("starts in the playing state", () => {
            expect(model.getState().status).toBe("playing");
        });

        it("starts with no strikes or completed questions", () => {
            const state = model.getState();

            expect(state.strikes).toBe(0);
            expect(state.questionsAnswered).toBe(0);
        });

        it("starts with a current question", () => {
            expect(model.getState().currentQuestion).not.toBeNull();
        });

        it("does not start waiting for Next Question", () => {
            expect(model.isWaitingForNext()).toBe(false);
        });
    });
});
