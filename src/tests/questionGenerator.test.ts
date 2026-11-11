import { describe, expect, it } from "vitest";
import type { Card } from "../shared/types";
import {
  generatePossibleQuestions,
  generateQuestion,
  probabilityOf,
} from "../game/questionGenerator";

const deck: Card[] = [
  { id: "H-A", suit: "hearts", rank: "A" },
  { id: "H-2", suit: "hearts", rank: "2" },
  { id: "H-3", suit: "hearts", rank: "3" },
  { id: "H-4", suit: "hearts", rank: "4" },
  { id: "S-A", suit: "spades", rank: "A" },
  { id: "S-2", suit: "spades", rank: "2" },
  { id: "S-3", suit: "spades", rank: "3" },
  { id: "S-4", suit: "spades", rank: "4" },
];

const hearts = deck.filter((card) => card.suit === "hearts");

function textOf(id: string): string | undefined {
  return generatePossibleQuestions(deck).find((q) => q.id === id)?.text;
}

describe("generatePossibleQuestions", () => {
  it("only asks about suits that are in the deck", () => {
    const ids = generatePossibleQuestions(deck).map((q) => q.id);

    expect(ids).toContain("suit-equals-hearts");
    expect(ids).toContain("suit-equals-spades");
    expect(ids).not.toContain("suit-equals-diamonds");
    expect(ids).not.toContain("suit-equals-clubs");
  });

  it("does not ask about face cards when the deck has none", () => {
    const ids = generatePossibleQuestions(deck).map((q) => q.id);

    expect(ids).not.toContain("category-equals-face");
  });

  it("asks about aces as a category, not a rank", () => {
    const ids = generatePossibleQuestions(deck).map((q) => q.id);

    expect(ids).toContain("category-equals-ace");
    expect(ids).not.toContain("rank-equals-A");
  });

  it("gives every question a unique id", () => {
    const ids = generatePossibleQuestions(deck).map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("writes readable question text", () => {
    expect(textOf("suit-equals-spades")).toBe(
      "What is the probability that the hidden card is a spade?",
    );
    expect(textOf("category-equals-ace")).toBe(
      "What is the probability that the hidden card is an ace?",
    );
    expect(textOf("rank-less_than-3")).toBe(
      "What is the probability that the hidden card is less than 3?",
    );
  });

  it("names face cards and uses 'an' before 8", () => {
    const faces: Card[] = [
      { id: "C-K", suit: "clubs", rank: "K" },
      { id: "C-8", suit: "clubs", rank: "8" },
    ];
    const texts = generatePossibleQuestions(faces).map((q) => q.text);

    expect(texts).toContain("What is the probability that the hidden card is a king?");
    expect(texts).toContain("What is the probability that the hidden card is an 8?");
  });
});

describe("probabilityOf", () => {
  it("is the share of cards that match", () => {
    expect(probabilityOf({ property: "suit", operator: "equals", value: "spades" }, deck)).toBe(1 / 2);
    expect(probabilityOf({ property: "category", operator: "equals", value: "ace" }, deck)).toBe(1 / 4);
    expect(probabilityOf({ property: "rank", operator: "less_than", value: "4" }, hearts)).toBe(3 / 4);
  });

  it("is 0 when there are no cards", () => {
    expect(probabilityOf({ property: "color", operator: "equals", value: "red" }, [])).toBe(0);
  });
});

describe("generateQuestion", () => {
  it("skips questions whose answer is 0 or 1", () => {
    // only hearts left: "red" and "a heart" are certain, "black" and "a spade" impossible
    for (let i = 0; i < 20; i++) {
      const question = generateQuestion(deck, hearts, new Set(), () => i / 20)!;
      const p = probabilityOf(question, hearts);

      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });

  it("does not repeat a question already asked", () => {
    const asked = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const question = generateQuestion(deck, deck, asked)!;

      expect(asked.has(question.id)).toBe(false);
      asked.add(question.id);
    }
  });

  it("falls back to a 0 or 1 question when nothing else is left", () => {
    // with one card left, every answer is 0 or 1
    const question = generateQuestion(deck, [deck[0]!], new Set(), () => 0);

    expect(question).not.toBeNull();
  });

  it("returns null once every question has been asked", () => {
    const allIds = new Set(generatePossibleQuestions(deck).map((q) => q.id));

    expect(generateQuestion(deck, deck, allIds)).toBeNull();
  });

  it("uses the given randomness to choose", () => {
    const first = generateQuestion(deck, deck, new Set(), () => 0);
    const last = generateQuestion(deck, deck, new Set(), () => 0.999);

    expect(first?.id).not.toBe(last?.id);
  });
});
