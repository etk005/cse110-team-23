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
 * Task #111: Updates and displays remaining card counts.
 */
export function updateCardCounts(deck: Array<{ id: string; type: string }>, revealedCardIds: string[]) {
  const remainingDeck = deck.filter(card => !revealedCardIds.includes(card.id));
  
  const riskCount = remainingDeck.filter(card => card.type === 'risk').length;
  const rewardCount = remainingDeck.filter(card => card.type === 'reward').length;
  const totalCount = remainingDeck.length;

  const riskElem = document.getElementById('risk-count');
  const rewardElem = document.getElementById('reward-count');
  const totalElem = document.getElementById('total-count');

  if (riskElem) riskElem.innerText = riskCount.toString();
  if (rewardElem) rewardElem.innerText = rewardCount.toString();
  if (totalElem) totalElem.innerText = totalCount.toString();

  return { riskCount, rewardCount, totalCount };
}

/**
 * Task #112: Calculates and displays the expected value based on probabilities.
 */
export function calculateAndDisplayExpectedValue(riskValue: number = -10, rewardValue: number = 20) {
  const riskInput = document.getElementById('risk-prob-input') as HTMLInputElement;
  const rewardInput = document.getElementById('reward-prob-input') as HTMLInputElement;
  const evDisplay = document.getElementById('expected-value-display');

  if (!riskInput || !rewardInput || !evDisplay) return 0;

  const riskProb = parseFloat(riskInput.value) || 0;
  const rewardProb = parseFloat(rewardInput.value) || 0;

  // Expected Value formula: (Risk Prob * Risk Value) + (Reward Prob * Reward Value)
  const expectedValue = (riskProb * riskValue) + (rewardProb * rewardValue);
  
  evDisplay.innerText = expectedValue.toFixed(2);
  return expectedValue;
}
