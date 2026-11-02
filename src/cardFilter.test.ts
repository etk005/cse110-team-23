TypeScript
import { describe, expect, it } from "vitest";
import { level1 } from "../config/levels";
import { getRemainingPossibleCards } from "./cardFilter";
import type { Card, KnownInformation } from "../shared/types";

describe("Card Filtering Logic", () => {
  const mockDeck = level1.deck as Card[];

  it("should return all card IDs when knownInformation is empty", () => {
    const res = getRemainingPossibleCards(mockDeck, []);
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

    const res = getRemainingPossibleCards(mockDeck, clues);
    const expectedIds = mockDeck
      .filter((c) => c.suit === "hearts")
      .map((c) => c.id);

    expect(res).toEqual(expectedIds);
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

    const res = getRemainingPossibleCards(mockDeck, clues);
    const expectedIds = mockDeck
      .filter((c) => c.suit !== "hearts" && c.suit !== "diamonds")
      .map((c) => c.id);

    expect(res).toEqual(expectedIds);
  });
});
