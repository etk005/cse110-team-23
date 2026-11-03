
import { describe, expect, it } from "vitest";
import type { GameState, Level } from "../shared/types";

const level1: Level = {
  id: 1,
  name: "Level 1",

  deck: [
    { id: "H-A", suit: "hearts", rank: "A" },
    { id: "H-2", suit: "hearts", rank: "2" },
    { id: "H-3", suit: "hearts", rank: "3" },
    { id: "H-4", suit: "hearts", rank: "4" },

    { id: "S-A", suit: "spades", rank: "A" },
    { id: "S-2", suit: "spades", rank: "2" },
    { id: "S-3", suit: "spades", rank: "3" },
    { id: "S-4", suit: "spades", rank: "4" },
  ],

  maxStrikes: 3,
  questionsRequired: 3,
};

const mockGameState: GameState = {
  gameId: "game-001",
  levelId: level1.id,
  status: "playing",

  // cards available in this level
  deck: level1.deck,

  // actual hidden card is kept on backend??
  hiddenCard: {
    isRevealed: false,
  },

  // information player has discovered
  knownInformation: [
    {
      id: "info-1",
      description: "The hidden card is a heart.",
      property: "suit",
      operator: "equals",
      value: "hearts",
    },
  ],

  // current probability question
  currentQuestion: {
    id: "question-1",
    text: "What is the probability that the hidden card is an Ace?",
    answerType: "fraction",
  },

  // strikes
  strikes: 0,
  maxStrikes: level1.maxStrikes,

  // progress
  questionsAnswered: 0,
  questionsRequired: level1.questionsRequired,

  // cards consistent with the known information
  remainingPossibleCards: level1.deck.filter(
    (card) => card.suit === "hearts"
  ),
};

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

    it("keeps remaining possible cards consistent with the known clue", () => {
        const expectedCards = mockGameState.deck.filter(
            (card) => card.suit === "hearts"
        );
    
        expect(mockGameState.remainingPossibleCards).toEqual(expectedCards);
    });
});
