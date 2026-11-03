import type { Card, KnownInformation } from "./shared/types";
import { matchesInformation } from "./game/informationMatching";

/**
 * Matches a card against a structured KnownInformation clue.
 * (Delegates to the shared information engine matcher)
 */
export function matchesClue(card: Card, clue: KnownInformation): boolean {
  return matchesInformation(card, clue);
}

/**
 * Returns the cards that satisfy all provided clues.
 */
export function getRemainingPossibleCards(
  deck: Card[],
  knownInformation: KnownInformation[],
): Card[] {
  if (!deck || !Array.isArray(deck)) return [];

  if (!knownInformation || knownInformation.length === 0) {
    return [...deck];
  }

  return deck.filter((card) => {
    return knownInformation.every((clue) => matchesClue(card, clue));
  });
}
