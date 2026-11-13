import type { Card, KnownInformation } from "../shared/types";
import { matchesInformation } from "./informationMatching";

// I'm designing the reward engine to give a net reward of:
//
//   (EV(# of guesses required) - ((# of guesses used) - (# of guesses "wasted" upon receiving new information))) * m + b
//
// In simple terms, (EV(# of guesses required) - (# of guesses used)) makes it so that you gain more chips when you
// do better than expected and less when you do worse. A key component of this is that raw guessing averages this
// term out to 0.
//
// (# of guesses "wasted" upon receiving new information) "gives back guesses" that turned out to be redundant in
// the end. This effectively makes ((# of guesses used) - (# of guesses "wasted" upon receiving new information))
// mean the number of guesses that, in the end, narrowed down the possible cards for your final guess.
//
// The m constant serves to scale the reward with the user's performance and b is a fixed reward so the user is
// guaranteed to earn at least a little bit per level on average.
//
// For user experience, I make each guess worth m chips. This makes it so that, while the net reward can be negative
// (for guessing too much), the reward the user gets after guessing correctly is always positive:
//
//   (EV(# of guesses required) + (# of guesses "wasted" upon receiving new information)) * m + b
//
// To actually implement the formula, the math is easy since EV(# of guesses required) is just half the number of
// remaining cards and (# of guesses "wasted" upon receiving new information) is the number of guesses that are
// consistent with the known information. Additionally, to penalize guessing the same card twice, we only count the
// unique guesses here.

const CHIPS_PER_GUESS = 20;  // m
const BASELINE_REWARD = 10;  // b

export function calculateReward(remainingPossibleCards: Card[], knownInformation: KnownInformation[], guesses: Card[]) {
    const evNumGuessesRequired = remainingPossibleCards.length / 2;
    const uniqueGuesses = Object.values(Object.fromEntries(guesses.map(card => [card.id, card])));
    const numGuessesWasted = uniqueGuesses.reduce((accum, card) => accum + (knownInformation.find(info => matchesInformation(card, info)) ? 1 : 0), 0);
    return (evNumGuessesRequired + numGuessesWasted) * CHIPS_PER_GUESS + BASELINE_REWARD;
}
