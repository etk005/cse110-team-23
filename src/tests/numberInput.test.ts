import { describe, expect, it } from "vitest";
import { matchesAnswer, parseNumber, parseProbability } from "../game/numberInput.ts";

describe("parseNumber", () => {
    it.each([
        ["1/3", 1 / 3],
        [" 2 / 3 ", 2 / 3],
        ["0.5", 0.5],
        [".5", 0.5],
        ["3", 3],
        ["-4/3", -4 / 3],
        ["-1.25", -1.25],
        ["1.5/3", 0.5],
    ])("parses %j", (text, expected) => {
        const result = parseNumber(text);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toBeCloseTo(expected);
    });

    it.each(["", "   ", "abc", "1/", "/3", "1//3", "1/2/3", "1.2.3", "50%", "one"])(
        "rejects %j",
        (text) => {
            expect(parseNumber(text).ok).toBe(false);
        }
    );

    it("rejects dividing by zero", () => {
        expect(parseNumber("1/0")).toEqual({ ok: false, error: "Can't divide by zero." });
    });
});

describe("parseProbability", () => {
    it("accepts 0, 1 and values between", () => {
        expect(parseProbability("0").ok).toBe(true);
        expect(parseProbability("1").ok).toBe(true);
        expect(parseProbability("7/21").ok).toBe(true);
    });

    it("rejects values outside 0 to 1", () => {
        expect(parseProbability("4/3").ok).toBe(false);
        expect(parseProbability("-0.1").ok).toBe(false);
        expect(parseProbability("1.01").ok).toBe(false);
    });
});

describe("matchesAnswer", () => {
    it("accepts exact and rounded-to-2-places answers", () => {
        expect(matchesAnswer(1 / 3, 1 / 3)).toBe(true);
        expect(matchesAnswer(0.33, 1 / 3)).toBe(true);
        expect(matchesAnswer(0.67, 2 / 3)).toBe(true);
    });

    it("rejects answers that are off", () => {
        expect(matchesAnswer(0.3, 1 / 3)).toBe(false);
        expect(matchesAnswer(0.5, 2 / 3)).toBe(false);
    });
});
