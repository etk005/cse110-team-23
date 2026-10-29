
import { describe, expect, it } from "vitest";
import { mockGameState } from "../mocks/mockGameState";

describe("Game state", () => {
    it("starts in a valid playing state", () => {
        expect(mockGameState.status).toBe("playing");
        expect(mockGameState.strikes).toBe(0);
        expect(mockGameState.questionsAnswered).toBe(0);
    });

    it("keeps the hidden card unrevealed initially", () => {
        expect(mockGameState.hiddenCard.isRevealed).toBe(false);
    });

    it("starts with a current question", () => {
        expect(mockGameState.currentQuestion).not.toBeNull();
    });

    it("starts below the strike limit", () => {
        expect(mockGameState.strikes).toBeLessThan(
            mockGameState.maxStrikes
        );
    });

    it("starts below the required question count", () => {
        expect(mockGameState.questionsAnswered).toBeLessThan(
            mockGameState.questionsRequired
        );
    });

    it("only includes possible cards from the original deck", () => {
        const deckIds = new Set(
            mockGameState.deck.map((card) => card.id)
        );

        for (const card of mockGameState.remainingPossibleCards) {
            expect(deckIds.has(card.id)).toBe(true);
        }
    });
});
