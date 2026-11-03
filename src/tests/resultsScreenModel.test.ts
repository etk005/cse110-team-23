
import { beforeEach, describe, expect, it } from "vitest";
import { ResultsScreenModel } from "../screens/ResultsScreen/ResultsScreenModel.ts";

describe("ResultsScreenModel", () => {
    let model: ResultsScreenModel;

    beforeEach(() => {
        model = new ResultsScreenModel();
    });

    it("starts with zero score", () => {
        expect(model.getScore()).toBe(0);
    });

    it("stores the provided score", () => {
        model.setScore(2);

        expect(model.getScore()).toBe(2);
    });

    it("recognizes a completed level", () => {
        model.setScore(3);

        expect(model.isWin()).toBe(true);
    });

    it("recognizes an incomplete level", () => {
        model.setScore(1);

        expect(model.isWin()).toBe(false);
    });

    it("updates results between games", () => {
        model.setScore(3);
        expect(model.isWin()).toBe(true);

        model.setScore(0);

        expect(model.getScore()).toBe(0);
        expect(model.isWin()).toBe(false);
    });

    it("keeps separate results instances independent", () => {
        const secondModel = new ResultsScreenModel();

        model.setScore(3);

        expect(secondModel.getScore()).toBe(0);
    });
});
