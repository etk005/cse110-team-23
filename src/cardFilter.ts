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
