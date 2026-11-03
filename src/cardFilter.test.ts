import { describe, expect, it } from "vitest";
import { getRemainingPossibleCards } from "./cardFilter";
import type { Card, KnownInformation } from "./shared/types";

describe("Card Filtering Logic", () => {
  // Use a local mock deck so it doesn't fail on missing config files
  const mockDeck: Card[] = [
    { id: "h-2", suit: "hearts", rank: "2" },
    { id: "s-k", suit: "spades", rank: "K" },
    { id: "d-5", suit: "diamonds", rank: "5" },
    { id: "c-10", suit: "clubs", rank: "10" },
  ];

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
    const expectedIds = ["h-2"];

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
    const expectedIds = ["s-k", "c-10"];

    expect(res).toEqual(expectedIds);
  });
});
