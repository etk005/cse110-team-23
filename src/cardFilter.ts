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

/**
 * Task #113: Dynamically calculates probabilities from the remaining deck 
 * and computes the updated Expected Value.
 */
export function calculateDynamicExpectedValue(
  deck: Array<{ id: string; type: string }>,
  revealedCardIds: string[],
  riskValue: number = -10,
  rewardValue: number = 20
) {
  const remainingDeck = deck.filter(card => !revealedCardIds.includes(card.id));
  const totalCount = remainingDeck.length;
  
  if (totalCount === 0) return { riskProb: 0, rewardProb: 0, expectedValue: 0 };

  const riskCount = remainingDeck.filter(card => card.type === 'risk').length;
  const rewardCount = remainingDeck.filter(card => card.type === 'reward').length;

  // Calculate true probabilities based on remaining cards
  const riskProb = riskCount / totalCount;
  const rewardProb = rewardCount / totalCount;

  // Automatically update input fields if present
  const riskInput = document.getElementById('risk-prob-input') as HTMLInputElement;
  const rewardInput = document.getElementById('reward-prob-input') as HTMLInputElement;
  if (riskInput) riskInput.value = riskProb.toFixed(2);
  if (rewardInput) rewardInput.value = rewardProb.toFixed(2);

  // Calculate Expected Value: (Risk Prob * Risk Value) + (Reward Prob * Reward Value)
  const expectedValue = (riskProb * riskValue) + (rewardProb * rewardValue);

  const evDisplay = document.getElementById('expected-value-display');
  if (evDisplay) {
    evDisplay.innerText = expectedValue.toFixed(2);
  }

  return { riskProb, rewardProb, expectedValue };
}

/**
 * Task #114: Validates and parses user input supporting both decimals and fractions.
 * Returns a normalized number (e.g., "1/2" -> 0.5, "0.75" -> 0.75), or null if invalid.
 */
export function parseUserInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Check if the input is a fraction (e.g., "3/4" or " 1 / 2 ")
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 2) return null;

    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);

    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      return null;
    }

    return numerator / denominator;
  }

  // Otherwise, treat it as a standard decimal/number
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) return null;

  return parsed;
}

/**
 * Task #114: Reads and validates value from a given input element ID.
 */
export function getValidatedInputValue(elementId: string): number | null {
  const inputElement = document.getElementById(elementId) as HTMLInputElement;
  if (!inputElement) return null;

  const value = parseUserInput(inputElement.value);
  
  if (value === null) {
    inputElement.classList.add('is-invalid');
  } else {
    inputElement.classList.remove('is-invalid');
  }

  return value;
}
