
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

function colorOf(suit: Suit): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

function parityOf(rank: Rank): "even" | "odd" {
  return RANK_VALUES[rank] % 2 === 0 ? "even" : "odd";
}

function categoryOf(rank: Rank): "number" | "face" {
  if (rank === "A" || rank === "J" || rank === "Q" || rank === "K") {
    return "face";
  }
  return "number";
}

/**
 * Matches a card against a structured KnownInformation clue.
 */
export function matchesClue(card: Card, clue: KnownInformation): boolean {
  const cardColor = colorOf(card.suit);
  const cardParity = parityOf(card.rank);
  const cardCategory = categoryOf(card.rank);
  const cardRankVal = RANK_VALUES[card.rank];

  let cardValue: string | number = "";

  switch (clue.property) {
    case "color":
      cardValue = cardColor;
      break;
    case "suit":
      cardValue = card.suit;
      break;
    case "parity":
      cardValue = cardParity;
      break;
    case "category":
      cardValue = cardCategory;
      break;
    case "rank":
      // For rank, value could be a specific rank string (e.g. "2") or a threshold string if using comparisons
      cardValue = card.rank;
      break;
    default:
      return true;
  }

  switch (clue.operator) {
    case "equals":
      return cardValue === clue.value;
    case "not_equals":
      return cardValue !== clue.value;
    case "greater_than": {
      const cardNum = RANK_VALUES[card.rank];
      const targetNum = RANK_VALUES[clue.value as Rank] ?? Number(clue.value);
      return cardNum > targetNum;
    }
    case "less_than": {
      const cardNum = RANK_VALUES[card.rank];
      const targetNum = RANK_VALUES[clue.value as Rank] ?? Number(clue.value);
      return cardNum < targetNum;
    }
    default:
      return true;
  }
}

/**
 * Returns an array of card IDs that satisfy all provided clues.
 */
export function getRemainingPossibleCards(
  deck: Card[],
  knownInformation: KnownInformation[],
): string[] {
  if (!deck || !Array.isArray(deck)) return [];

  if (!knownInformation || knownInformation.length === 0) {
    return deck.map((card) => card.id);
  }

  return deck
    .filter((card) => {
      return knownInformation.every((clue) => matchesClue(card, clue));
    })
    .map((card) => card.id);
}
