import type { Card, KnownInformation, Rank, Suit } from "../shared/types";


const RANK_VALUES: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

// used for greater/less than clues
const RANK_THRESHOLD: Rank = "7";

function colorOf(suit: Suit): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

function parityOf(rank: Rank): "even" | "odd" {
  return RANK_VALUES[rank] % 2 === 0 ? "even" : "odd";
}

// ace counts as a face card
function categoryOf(rank: Rank): "number" | "face" {
  if (rank === "A" || rank === "J" || rank === "Q" || rank === "K") {
    return "face";
  }
  return "number";
}

function suitName(suit: Suit): string {
  return suit.slice(0, -1);
}

// every true fact about the hidden card, broader first
export function generatePossibleFacts(hiddenCard: Card): KnownInformation[] {
  const color = colorOf(hiddenCard.suit);
  const parity = parityOf(hiddenCard.rank);
  const category = categoryOf(hiddenCard.rank);
  const rankValue = RANK_VALUES[hiddenCard.rank];
  const threshold = RANK_VALUES[RANK_THRESHOLD];

  const facts: KnownInformation[] = [
    {
      id: `color-${color}`,
      description: `The hidden card is ${color}.`,
      property: "color",
      operator: "equals",
      value: color,
    },
    {
      id: `suit-${hiddenCard.suit}`,
      description: `The hidden card is a ${suitName(hiddenCard.suit)}.`,
      property: "suit",
      operator: "equals",
      value: hiddenCard.suit,
    },
    {
      id: `parity-${parity}`,
      description: `The hidden card is ${parity}.`,
      property: "parity",
      operator: "equals",
      value: parity,
    },
    {
      id: `category-${category}`,
      description: `The hidden card is a ${category} card.`,
      property: "category",
      operator: "equals",
      value: category,
    },
  ];

  if (rankValue > threshold) {
    facts.push({
      id: `rank-gt-${RANK_THRESHOLD}`,
      description: `The hidden card is greater than ${RANK_THRESHOLD}.`,
      property: "rank",
      operator: "greater_than",
      value: RANK_THRESHOLD,
    });
  }

  if (rankValue < threshold) {
    facts.push({
      id: `rank-lt-${RANK_THRESHOLD}`,
      description: `The hidden card is less than ${RANK_THRESHOLD}.`,
      property: "rank",
      operator: "less_than",
      value: RANK_THRESHOLD,
    });
  }

  facts.push({
    id: `rank-${hiddenCard.rank}`,
    description: `The hidden card is a ${hiddenCard.rank}.`,
    property: "rank",
    operator: "equals",
    value: hiddenCard.rank,
  });

  return facts;
}

// first unused fact, or null if everything is already known
export function getNextInformation(
  hiddenCard: Card,
  existingInformation: KnownInformation[],
): KnownInformation | null {
  const knownIds = new Set(existingInformation.map((info) => info.id));
  return (
    generatePossibleFacts(hiddenCard).find((fact) => !knownIds.has(fact.id)) ??
    null
  );
}
