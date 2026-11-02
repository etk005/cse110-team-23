import type { Card, KnownInformation } from "../shared/types";
import { matchesInformation } from "./informationMatching";

/**
 * Matches a card against a structured KnownInformation clue.
 * Reuses Gandharva's matchesInformation function from PR #30.
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
