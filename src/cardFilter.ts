import type { Card, KnownInformation } from "../shared/types";

/**
 * Matches a card against a structured KnownInformation clue.
 */
export function matchesInformation(card: Card, clue: KnownInformation): boolean {
  const cardValue = String(card[clue.property as keyof Card] ?? "").toLowerCase();
  const targetValue = String(clue.value ?? "").toLowerCase();

  switch (clue.operator) {
    case "equals":
      return cardValue === targetValue;
    case "not_equals":
      return cardValue !== targetValue;
    case "contains":
      return cardValue.includes(targetValue);
    case "greater_than":
      return Number(cardValue) > Number(targetValue);
    case "less_than":
      return Number(cardValue) < Number(targetValue);
    default:
      return true;
  }
}

/**
 * Matches a card against a structured KnownInformation clue.
 */
export function matchesClue(card: Card, clue: KnownInformation): boolean {
  return matchesInformation(card, clue);
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
