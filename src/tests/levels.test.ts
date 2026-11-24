import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { levelManifestSchema, levelSchema } from "../shared/schemas";
import type { Level } from "../shared/types";
import { GameScreenModel } from "../screens/GameScreen/GameScreenModel";

const LEVELS_DIR = path.join(import.meta.dirname, "../../public/levels");

function readJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(LEVELS_DIR, file), "utf8"));
}

const manifest = levelManifestSchema.parse(readJson("manifest.json"));
const levels: Level[] = manifest.map((entry) => levelSchema.parse(readJson(`${entry.basename}.json`)));

const validLevel = {
    id: 1,
    name: "Test",
    deck: [
        { id: "H-A", suit: "hearts", rank: "A" },
        { id: "H-2", suit: "hearts", rank: "2" },
    ],
    maxStrikes: 3,
    questionsRequired: 1,
};

/** Plays a level with the given hidden card, answering every question correctly. */
function playPerfectly(level: Level, hiddenIndex: number): { model: GameScreenModel; probabilities: number[] } {
    let first = true;
    // the first random() call picks the hidden card; later calls choose questions
    const model = new GameScreenModel(() => {
        if (first) {
            first = false;
            return (hiddenIndex + 0.5) / level.deck.length;
        }
        return 0.5;
    });
    model.setLevel(level);

    const probabilities: number[] = [];
    for (let i = 0; i < level.questionsRequired; i++) {
        const p = model.getCorrectAnswer();
        probabilities.push(p);
        model.submitAnswer(String(p));
        if (i < level.questionsRequired - 1) {
            model.nextQuestion();
        }
    }
    return { model, probabilities };
}

describe("level configs", () => {
    it("has five levels with ids matching their order", () => {
        expect(levels.map((level) => level.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it("makes each level's deck bigger than the last", () => {
        for (let i = 1; i < levels.length; i++) {
            expect(levels[i]!.deck.length).toBeGreaterThan(levels[i - 1]!.deck.length);
        }
    });

    it("never gets easier: questions don't drop and strikes don't rise", () => {
        for (let i = 1; i < levels.length; i++) {
            expect(levels[i]!.questionsRequired).toBeGreaterThanOrEqual(levels[i - 1]!.questionsRequired);
            expect(levels[i]!.maxStrikes).toBeLessThanOrEqual(levels[i - 1]!.maxStrikes);
        }
    });

    it("ends with the full 52-card deck", () => {
        expect(levels.at(-1)!.deck).toHaveLength(52);
    });

    it("can be won from every hidden card", () => {
        for (const level of levels) {
            for (let i = 0; i < level.deck.length; i++) {
                expect(playPerfectly(level, i).model.getState().status).toBe("won");
            }
        }
    });

    it("never asks a 0 or 100% question before the last one", () => {
        for (const level of levels) {
            for (let i = 0; i < level.deck.length; i++) {
                const { probabilities } = playPerfectly(level, i);
                for (const p of probabilities.slice(0, -1)) {
                    expect(p).toBeGreaterThan(0);
                    expect(p).toBeLessThan(1);
                }
            }
        }
    });

    it("never asks a 0 or 100% question in the first three levels", () => {
        for (const level of levels.slice(0, 3)) {
            for (let i = 0; i < level.deck.length; i++) {
                for (const p of playPerfectly(level, i).probabilities) {
                    expect(p).toBeGreaterThan(0);
                    expect(p).toBeLessThan(1);
                }
            }
        }
    });
});

describe("level schema", () => {
    it("accepts a valid level", () => {
        expect(levelSchema.safeParse(validLevel).success).toBe(true);
    });

    it("rejects duplicate card ids", () => {
        const level = {
            ...validLevel,
            deck: [
                { id: "H-A", suit: "hearts", rank: "A" },
                { id: "H-A", suit: "hearts", rank: "2" },
            ],
        };
        expect(levelSchema.safeParse(level).success).toBe(false);
    });

    it("rejects the same card twice under different ids", () => {
        const level = {
            ...validLevel,
            deck: [
                { id: "a", suit: "hearts", rank: "A" },
                { id: "b", suit: "hearts", rank: "A" },
            ],
        };
        expect(levelSchema.safeParse(level).success).toBe(false);
    });

    it("rejects a deck with fewer than 2 cards", () => {
        expect(levelSchema.safeParse({ ...validLevel, deck: [validLevel.deck[0]] }).success).toBe(false);
    });

    it("rejects zero or fractional strikes and questions", () => {
        expect(levelSchema.safeParse({ ...validLevel, maxStrikes: 0 }).success).toBe(false);
        expect(levelSchema.safeParse({ ...validLevel, questionsRequired: 0 }).success).toBe(false);
        expect(levelSchema.safeParse({ ...validLevel, questionsRequired: 1.5 }).success).toBe(false);
    });
});
