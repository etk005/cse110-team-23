import type { Card, KnownInformation } from "./shared/types";

/**
 * Helper to determine card color based on suit.
 */
function getCardColor(suit: string): string {
  const s = suit.toLowerCase();
  if (s === "hearts" || s === "diamonds" || s === "h" || s === "d") {
    return "red";
  }
  return "black";
}

/**
 * Matches a card against a structured KnownInformation clue.
 */
export function matchesInformation(card: Card, clue: KnownInformation): boolean {
  const property = clue.property.toLowerCase();
  const targetValue = String(clue.value ?? "").toLowerCase();

  let cardValue = "";
  if (property === "color") {
    cardValue = getCardColor(String(card.suit ?? ""));
  } else {
    cardValue = String(card[property as keyof Card] ?? "").toLowerCase();
  }

  switch (clue.operator) {
    case "equals":
      return cardValue === targetValue;
    case "not_equals":
      return cardValue !== notEquals(cardValue, targetValue); // or just cardValue !== targetValue
    default:
      return true;
  }
}

// Cleaner switch operator implementation matching the allowed type:
export function matchesClue(card: Card, clue: KnownInformation): boolean {
  const property = clue.property.toLowerCase();
  const targetValue = String(clue.value ?? "").toLowerCase();

  let cardValue = "";
  if (property === "color") {
    cardValue = getCardColor(String(card.suit ?? ""));
  } else {
    cardValue = String(card[property as keyof Card] ?? "").toLowerCase();
  }

  if (clue.operator === "equals") {
    return cardValue === targetValue;
  }
  if (clue.operator === "not_equals") {
    return cardValue !== targetValue;
  }
  return true;
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
