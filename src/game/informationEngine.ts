import type { Card, KnownInformation, Rank } from "../shared/types";
import {
  RANK_VALUES,
  categoryOf,
  colorOf,
  matchesInformation,
  parityOf,
} from "./informationMatching";

// used for greater/less than clues
const RANK_THRESHOLD: Rank = "7";

function suitName(suit: Card["suit"]): string {
  return suit.slice(0, -1);
}

function generateColorFact(card: Card): KnownInformation {
  const color = colorOf(card.suit);
  return {
    id: `color-${color}`,
    description: `The hidden card is ${color}.`,
    property: "color",
    operator: "equals",
    value: color,
  };
}

function generateSuitFact(card: Card): KnownInformation {
  return {
    id: `suit-${card.suit}`,
    description: `The hidden card is a ${suitName(card.suit)}.`,
    property: "suit",
    operator: "equals",
    value: card.suit,
  };
}

function generateParityFact(card: Card): KnownInformation {
  const parity = parityOf(card.rank);
  return {
    id: `parity-${parity}`,
    description: `The hidden card is ${parity}.`,
    property: "parity",
    operator: "equals",
    value: parity,
  };
}

function generateCategoryFact(card: Card): KnownInformation {
  const category = categoryOf(card.rank);
  return {
    id: `category-${category}`,
    description:
      category === "ace"
        ? "The hidden card is an ace."
        : `The hidden card is a ${category} card.`,
    property: "category",
    operator: "equals",
    value: category,
  };
}

function generateRankGreaterThanFact(card: Card): KnownInformation | null {
  const rankValue = RANK_VALUES[card.rank];
  const threshold = RANK_VALUES[RANK_THRESHOLD];
  if (rankValue <= threshold) {
    return null;
  }
  return {
    id: `rank-gt-${RANK_THRESHOLD}`,
    description: `The hidden card is greater than ${RANK_THRESHOLD}.`,
    property: "rank",
    operator: "greater_than",
    value: RANK_THRESHOLD,
  };
}

function generateRankLessThanFact(card: Card): KnownInformation | null {
  const rankValue = RANK_VALUES[card.rank];
  const threshold = RANK_VALUES[RANK_THRESHOLD];
  if (rankValue >= threshold) {
    return null;
  }
  return {
    id: `rank-lt-${RANK_THRESHOLD}`,
    description: `The hidden card is less than ${RANK_THRESHOLD}.`,
    property: "rank",
    operator: "less_than",
    value: RANK_THRESHOLD,
  };
}

function generateExactRankFact(card: Card): KnownInformation {
  return {
    id: `rank-${card.rank}`,
    description: `The hidden card is a ${card.rank}.`,
    property: "rank",
    operator: "equals",
    value: card.rank,
  };
}

const FACT_GENERATORS: ((card: Card) => KnownInformation | null)[] = [
  generateColorFact,
  generateSuitFact,
  generateParityFact,
  generateCategoryFact,
  generateRankGreaterThanFact,
  generateRankLessThanFact,
  generateExactRankFact,
];

// every true fact about the hidden card, broader first
export function generatePossibleFacts(hiddenCard: Card): KnownInformation[] {
  const facts: KnownInformation[] = [];
  for (const generate of FACT_GENERATORS) {
    const fact = generate(hiddenCard);
    if (fact !== null) {
      facts.push(fact);
    }
  }
  return facts;
}

// at least one possible card fails the clue
export function isUsefulFact(
  fact: KnownInformation,
  possibleCards: Card[],
): boolean {
  return possibleCards.some((card) => !matchesInformation(card, fact));
}

// first unused useful fact, or null
export function getNextInformation(
  hiddenCard: Card,
  possibleCards: Card[],
  existingInformation: KnownInformation[],
): KnownInformation | null {
  const knownIds = new Set(existingInformation.map((info) => info.id));
  return (
    generatePossibleFacts(hiddenCard).find(
      (fact) => !knownIds.has(fact.id) && isUsefulFact(fact, possibleCards),
    ) ?? null
  );
}
