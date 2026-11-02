
import { describe, expect, it } from "vitest";
import { level1 } from "../config/levels";
import { matchesInformation } from "../game/informationMatching";
import type { Card, KnownInformation } from "../shared/types";

const heartAce = level1.deck[0] as Card;
const heartTwo = level1.deck[1] as Card;
const heartThree = level1.deck[2] as Card;
const heartFour = level1.deck[3] as Card;
const spadeFour = level1.deck[7] as Card;

const diamondQueen: Card = {
  id: "D-Q",
  suit: "diamonds",
  rank: "Q",
};

const clubEight: Card = {
  id: "C-8",
  suit: "clubs",
  rank: "8",
};

function info(partial: Omit<KnownInformation, "description">): KnownInformation {
  return { description: "test clue", ...partial };
}

describe("matchesInformation", () => {
  it("matches red for hearts and diamonds", () => {
    expect(
      matchesInformation(
        heartAce,
        info({ id: "c", property: "color", operator: "equals", value: "red" }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        diamondQueen,
        info({ id: "c", property: "color", operator: "equals", value: "red" }),
      ),
    ).toBe(true);
  });

  it("matches black for clubs and spades", () => {
    expect(
      matchesInformation(
        clubEight,
        info({
          id: "c",
          property: "color",
          operator: "equals",
          value: "black",
        }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        spadeFour,
        info({
          id: "c",
          property: "color",
          operator: "equals",
          value: "black",
        }),
      ),
    ).toBe(true);
  });

  it("matches suit equals and not_equals", () => {
    const hearts = info({
      id: "s",
      property: "suit",
      operator: "equals",
      value: "hearts",
    });
    expect(matchesInformation(heartAce, hearts)).toBe(true);
    expect(matchesInformation(spadeFour, hearts)).toBe(false);
    expect(
      matchesInformation(
        spadeFour,
        info({
          id: "s",
          property: "suit",
          operator: "not_equals",
          value: "hearts",
        }),
      ),
    ).toBe(true);
  });

  it("matches parity", () => {
    expect(
      matchesInformation(
        heartTwo,
        info({ id: "p", property: "parity", operator: "equals", value: "even" }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        heartThree,
        info({ id: "p", property: "parity", operator: "equals", value: "odd" }),
      ),
    ).toBe(true);
  });

  it("matches face cards as J, Q, K only", () => {
    expect(
      matchesInformation(
        diamondQueen,
        info({
          id: "f",
          property: "category",
          operator: "equals",
          value: "face",
        }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        heartAce,
        info({
          id: "f",
          property: "category",
          operator: "equals",
          value: "face",
        }),
      ),
    ).toBe(false);
  });

  it("matches ace category", () => {
    expect(
      matchesInformation(
        heartAce,
        info({
          id: "a",
          property: "category",
          operator: "equals",
          value: "ace",
        }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        heartTwo,
        info({
          id: "a",
          property: "category",
          operator: "equals",
          value: "ace",
        }),
      ),
    ).toBe(false);
  });

  it("matches number category", () => {
    expect(
      matchesInformation(
        heartTwo,
        info({
          id: "n",
          property: "category",
          operator: "equals",
          value: "number",
        }),
      ),
    ).toBe(true);
  });

  it("matches exact rank", () => {
    expect(
      matchesInformation(
        heartThree,
        info({ id: "r", property: "rank", operator: "equals", value: "3" }),
      ),
    ).toBe(true);
  });

  it("matches rank less than", () => {
    expect(
      matchesInformation(
        heartFour,
        info({
          id: "r",
          property: "rank",
          operator: "less_than",
          value: "7",
        }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        clubEight,
        info({
          id: "r",
          property: "rank",
          operator: "less_than",
          value: "7",
        }),
      ),
    ).toBe(false);
  });

  it("matches rank greater than", () => {
    expect(
      matchesInformation(
        clubEight,
        info({
          id: "r",
          property: "rank",
          operator: "greater_than",
          value: "7",
        }),
      ),
    ).toBe(true);
    expect(
      matchesInformation(
        heartAce,
        info({
          id: "r",
          property: "rank",
          operator: "greater_than",
          value: "7",
        }),
      ),
    ).toBe(false);
  });
});
