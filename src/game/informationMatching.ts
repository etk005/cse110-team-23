import type { Card, KnownInformation, Rank, Suit } from "../shared/types";

// ace is low
export const RANK_VALUES: Record<Rank, number> = {
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

export function colorOf(suit: Suit): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function parityOf(rank: Rank): "even" | "odd" {
  return RANK_VALUES[rank] % 2 === 0 ? "even" : "odd";
}

export function categoryOf(rank: Rank): "ace" | "number" | "face" {
  if (rank === "A") {
    return "ace";
  }
  if (rank === "J" || rank === "Q" || rank === "K") {
    return "face";
  }
  return "number";
}

function rankMatches(
  cardRank: Rank,
  operator: KnownInformation["operator"],
  value: string,
): boolean {
  const cardValue = RANK_VALUES[cardRank];
  const threshold = RANK_VALUES[value as Rank];

  if (threshold === undefined) {
    return false;
  }

  switch (operator) {
    case "equals":
      return cardRank === value;
    case "not_equals":
      return cardRank !== value;
    case "less_than":
      return cardValue < threshold;
    case "greater_than":
      return cardValue > threshold;
    default:
      return false;
  }
}

// whether a card satisfies a clue
export function matchesInformation(
  card: Card,
  info: KnownInformation,
): boolean {
  const { property, operator, value } = info;
  const equals = operator === "equals";
  const notEquals = operator === "not_equals";

  switch (property) {
    case "color": {
      const color = colorOf(card.suit);
      if (equals) return color === value;
      if (notEquals) return color !== value;
      return false;
    }
    case "suit": {
      if (equals) return card.suit === value;
      if (notEquals) return card.suit !== value;
      return false;
    }
    case "parity": {
      const parity = parityOf(card.rank);
      if (equals) return parity === value;
      if (notEquals) return parity !== value;
      return false;
    }
    case "category": {
      const category = categoryOf(card.rank);
      if (equals) return category === value;
      if (notEquals) return category !== value;
      return false;
    }
    case "rank":
      return rankMatches(card.rank, operator, value);
    default:
      return false;
  }
}
