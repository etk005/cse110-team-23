
import { describe, it, expect } from "vitest";
import { level1 } from "../config/levels";
import { mockGameState } from "../mocks/mockGameState";

describe("Level 1 configuration", () => {
    it("has unique card IDs", () => {
        const ids = level1.deck.map((card) => card.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("has valid card ranks and suits", () => {
        const validSuits = ["hearts", "diamonds", "clubs", "spades"];
        const validRanks = [
            "A", "2", "3", "4", "5", "6", "7",
            "8", "9", "10", "J", "Q", "K"
        ];

        for (const card of level1.deck) {
            expect(validSuits).toContain(card.suit);
            expect(validRanks).toContain(card.rank);
        }
    });

    it("has positive strike and question limits", () => {
        expect(level1.maxStrikes).toBeGreaterThan(0);
        expect(level1.questionsRequired).toBeGreaterThan(0);
    });
});

describe("Mock game state", () => {
    it("matches the level configuration", () => {
        expect(mockGameState.levelId).toBe(level1.id);
        expect(mockGameState.deck).toEqual(level1.deck);
        expect(mockGameState.maxStrikes).toBe(level1.maxStrikes);
        expect(mockGameState.questionsRequired)
            .toBe(level1.questionsRequired);
    });

    it("starts with valid strikes and progress", () => {
        expect(mockGameState.strikes).toBe(0);
        expect(mockGameState.questionsAnswered).toBe(0);
        expect(mockGameState.status).toBe("playing");
    });

    it("keeps the hidden card secret", () => {
        expect(mockGameState.hiddenCard.isRevealed).toBe(false);
        expect(mockGameState.hiddenCard).not.toHaveProperty("id");
        expect(mockGameState.currentQuestion).not.toHaveProperty(
            "correctAnswer"
        );
    });

    it("only includes cards matching the known heart clue", () => {
        expect(mockGameState.remainingPossibleCards).toEqual(
            level1.deck.filter((card) => card.suit === "hearts")
        );
    });

    it("has a valid probability question", () => {
        expect(mockGameState.currentQuestion).not.toBeNull();
        expect(mockGameState.currentQuestion?.text.length)
            .toBeGreaterThan(0);
        expect(mockGameState.currentQuestion?.answerType)
            .toBe("fraction");
    });
});
