
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

    it("stores the provided result", () => {
        model.setResult({
            type: "result",
            score: 2,
            status: "lost",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: null,
        });

        expect(model.getScore()).toBe(2);
    });

    it("recognizes a completed level", () => {
        model.setResult({
            type: "result",
            score: 1,
            status: "won",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: null,
        });

        expect(model.isWin()).toBe(true);
    });

    it("recognizes an incomplete level", () => {
        model.setResult({
            type: "result",
            score: 3,
            status: "lost",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: null,
        });

        expect(model.isWin()).toBe(false);
    });

    it("updates results between games", () => {
        model.setResult({
            type: "result",
            score: 3,
            status: "won",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: null,
        });
        expect(model.isWin()).toBe(true);

        model.setResult({
            type: "result",
            score: 0,
            status: "lost",
            levelId: 2,
            questionsRequired: 3,
            hiddenCard: null,
        });

        expect(model.getScore()).toBe(0);
        expect(model.isWin()).toBe(false);
    });

    it("keeps separate results instances independent", () => {
        const secondModel = new ResultsScreenModel();

        model.setResult({
            type: "result",
            score: 3,
            status: "won",
            levelId: 1,
            questionsRequired: 3,
            hiddenCard: null,
        });

        expect(secondModel.getScore()).toBe(0);
    });
});
