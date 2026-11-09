import { describe, expect, it } from "vitest";
import { 
  parseUserInput, 
  calculateDynamicExpectedValue, 
  getRemainingPossibleCards 
} from "./cardFilter";
import type { Card, KnownInformation } from "./shared/types";

describe("Card Filter & Game Logic Tests (Tasks #113-#115)", () => {
  
  // --- 1. Testing getRemainingPossibleCards ---
  const mockDeck: Card[] = [
    { id: "h-2", suit: "hearts", rank: "2" },
    { id: "s-k", suit: "spades", rank: "K" },
    { id: "d-5", suit: "diamonds", rank: "5" },
    { id: "c-10", suit: "clubs", rank: "10" },
  ] as any;

  it("should return all card IDs when knownInformation is empty", () => {
    const res = getRemainingPossibleCards(mockDeck, []).map((c) => c.id);
    expect(res).toEqual(mockDeck.map((c) => c.id));
  });

  it("should filter correctly by multiple structured clues (color and suit equals)", () => {
    const clues: KnownInformation[] = [
      {
        id: "color-red",
        description: "The hidden card is red.",
        property: "color",
        operator: "equals",
        value: "red",
      },
      {
        id: "suit-hearts",
        description: "The hidden card is a heart.",
        property: "suit",
        operator: "equals",
        value: "hearts",
      },
    ];

    const res = getRemainingPossibleCards(mockDeck, clues).map((c) => c.id);
    expect(res).toEqual(["h-2"]);
  });

  it("should handle not_equals operator correctly", () => {
    const clues: KnownInformation[] = [
      {
        id: "color-not-red",
        description: "The hidden card is not red.",
        property: "color",
        operator: "not_equals",
        value: "red",
      },
    ];

    const res = getRemainingPossibleCards(mockDeck, clues).map((c) => c.id);
    expect(res).toEqual(["s-k", "c-10"]);
  });

  // --- 2. Testing parseUserInput (Task #114) ---
  describe("parseUserInput", () => {
    it("correctly parses standard decimals and fractions", () => {
      expect(parseUserInput("0.75")).toBe(0.75);
      expect(parseUserInput("1/2")).toBe(0.5);
    });

    it("returns null for invalid inputs or division by zero", () => {
      expect(parseUserInput("")).toBeNull();
      expect(parseUserInput("abc")).toBeNull();
      expect(parseUserInput("1/0")).toBeNull();
    });
  });

  // --- 3. Testing calculateDynamicExpectedValue (Task #113 & #115) ---
  describe("calculateDynamicExpectedValue", () => {
    const simpleDeck = [
      { id: "1", type: "risk" },
      { id: "2", type: "reward" }
    ];

    it("calculates probabilities and expected value correctly", () => {
      const result = calculateDynamicExpectedValue(simpleDeck, [], -10, 20);
      expect(result.riskProb).toBe(0.5);
      expect(result.rewardProb).toBe(0.5);
      expect(result.expectedValue).toBe(5); // (-10 * 0.5) + (20 * 0.5)
    });
  });
});
