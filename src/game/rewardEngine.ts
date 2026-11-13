// Let's construct a reward function subject to the following conditions:
// 
//   - The expected net reward must be a fixed non-negative constant b
//   - The reward must be non-increasing with the number of guesses
//   - The cost per guess must be a fixed constant m
//   - The reward must be non-negative
//   - Duplicate guesses should be penalized
//   - Guesses inconsistent with the existing information should be penalized
//
// Let EV_i be the expected net reward at guess i,
//     R_i be the reward at guess i,
//     n be the number of candidate guesses.
//
// Given that there's a fixed cost of m chips per guess, a probability of \frac{1}{n} of correctly guessing the
// hidden card with a non-degenerate guess and a probability of \frac{n-1}{n} of otherwise continuing to the
// (i+1)th guess, we can model EV_i as follows:
//
//   EV_i = -m + \frac{1}{n}R_i + \frac{n-1}{n}EV_{i+1}
//
// Given that expected reward is a constant b, solving for R_i:
//
//   EV_i = -m + \frac{1}{n}R_i + \frac{n-1}{n}EV_{i+1}
//   b = -m + \frac{1}{n}R_i + \frac{n-1}{n}b
//   \frac{1}{n}b = -m + \frac{1}{n}R_i
//   b = -nm + R_i
//   R_i = b + nm
//
// Checking the conditions:
// 
//   - Given that the number of candidate guesses n is non-increasing w.r.t. guess index, the reward must be
//     non-increasing with the number of guesses
//   - Given that the number of candidate guesses n is strictly positive prior to making a guess, the reward must
//     also be non-negative
//   - Given that duplicate and inconsistent guesses have a probability of 0 (not \frac{1}{n} as assumed in our
//     model) of correctly guessing the hidden card, R_i = 0 in this case, naturally lowering the expected reward

export const CHIPS_PER_GUESS = 20;  // m
export const EXPECTED_REWARD = 10;  // b

export function calculateReward(numCandidateGuesses: number) {
    return EXPECTED_REWARD + numCandidateGuesses * CHIPS_PER_GUESS;
}