
import { beforeEach, describe, expect, it } from "vitest";
import { ResultsScreenModel } from "../screens/ResultsScreen/ResultsScreenModel.ts";

describe("ResultsScreenModel", () => {
    let model: ResultsScreenModel;

    beforeEach(() => {
        model = new ResultsScreenModel();
    });

    it("starts with zero points and no win", () => {
        expect(model.getPoints()).toBe(0);
        expect(model.isWin()).toBe(false);
    });

    it("stores the provided result", () => {
        model.setResult(true, 8);

        expect(model.getPoints()).toBe(8);
        expect(model.isWin()).toBe(true);
    });

    it("recognizes a failed level", () => {
        model.setResult(false, 0);

        expect(model.isWin()).toBe(false);
    });

    it("updates results between games", () => {
        model.setResult(true, 10);
        model.setResult(false, 0);

        expect(model.getPoints()).toBe(0);
        expect(model.isWin()).toBe(false);
    });

    it("keeps separate results instances independent", () => {
        const secondModel = new ResultsScreenModel();

        model.setResult(true, 10);

        expect(secondModel.getPoints()).toBe(0);
    });
});
