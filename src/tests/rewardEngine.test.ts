import { describe, expect, it } from "vitest";
import { calculateReward, EXPECTED_REWARD, CHIPS_PER_GUESS } from "../game/rewardEngine";
import { matchesInformation } from "../game/informationMatching";
import { getNextInformation } from "../game/informationEngine";
import type { Card, KnownInformation } from "../shared/types";

const NUM_SIMULATIONS = 100000;

const cards: Card[] = [
    { id: "H-A", suit: "hearts", rank: "A" },
    { id: "H-2", suit: "hearts", rank: "2" },
    { id: "H-3", suit: "hearts", rank: "3" },
    { id: "H-4", suit: "hearts", rank: "4" },
    { id: "S-A", suit: "spades", rank: "A" },
    { id: "S-2", suit: "spades", rank: "2" },
    { id: "S-3", suit: "spades", rank: "3" },
    { id: "S-4", suit: "spades", rank: "4" },
];

type GameSimulationOptions = {
    allowDuplicateGuesses?: boolean;
    allowInconsistentGuesses?: boolean;
};

type GameResult = {
    reward: number;
    netReward: number;
    numGuesses: number;
};

const simulateGame = ({
    allowDuplicateGuesses = false,
    allowInconsistentGuesses = false
}: GameSimulationOptions = {}): GameResult => {
    const existingInformation: KnownInformation[] = [];
    let possibleCards = [...cards];
    let candidateGuesses = [...possibleCards];
    let candidateGuessesWithAllowances = [...candidateGuesses];
    let guesses: Card[] = [];
    const hiddenCard = possibleCards[Math.floor(Math.random() * possibleCards.length)]!;
    while (true) {
        const nextInformation = getNextInformation(hiddenCard, possibleCards, existingInformation);
        if (nextInformation !== null) {
            existingInformation.push(nextInformation);
            possibleCards = possibleCards.filter(card => matchesInformation(card, nextInformation));
            candidateGuesses = candidateGuesses.filter(card => matchesInformation(card, nextInformation));
            if (!allowInconsistentGuesses) {
                candidateGuessesWithAllowances = candidateGuessesWithAllowances.filter(card => matchesInformation(card, nextInformation));
            }
        }

        const guess = candidateGuessesWithAllowances[Math.floor(Math.random() * candidateGuessesWithAllowances.length)]!;
        guesses.push(guess);
        if (guess.id === hiddenCard.id) break;

        candidateGuesses = candidateGuesses.filter(card => card.id !== guess.id);
        if (!allowDuplicateGuesses) {
            candidateGuessesWithAllowances = candidateGuessesWithAllowances.filter(card => card.id !== guess.id);
        }
    }
    const reward = calculateReward(candidateGuesses.length);
    return { reward, netReward: reward - guesses.length * CHIPS_PER_GUESS, numGuesses: guesses.length };
};

describe("calculateReward", () => {
    it("should have expected net reward EXPECTED_REWARD", () => {
        let avg = 0;
        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            avg += simulateGame().netReward / NUM_SIMULATIONS;
        }
        expect(avg).toBeCloseTo(EXPECTED_REWARD, 0);
    });

    it("should have positive reward", () => {
        let minReward = Infinity;
        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            minReward = Math.min(minReward, simulateGame().reward);
        }
        expect(minReward).toBeGreaterThan(0);
    });

    it("should have non-increasing reward", () => {
        const results: GameResult[] = [];
        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            results.push(simulateGame());
        }
        const rewardsByNumGuesses: number[][] = [];
        for (const { numGuesses, reward } of results) {
            while (!(numGuesses < rewardsByNumGuesses.length)) {
                rewardsByNumGuesses.push([]);
            }
            rewardsByNumGuesses[numGuesses]!.push(reward);
        }
        let prevAvgReward = Infinity;
        for (const rewards of rewardsByNumGuesses.slice(1)) {
            const avgReward = rewards.reduce((accum, reward) => accum + reward, 0) / rewards.length;
            expect(avgReward).toBeLessThanOrEqual(prevAvgReward);
            prevAvgReward = avgReward;
        }
    });

    it("should penalize duplicate guesses", () => {
        let avg = 0;
        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            avg += simulateGame({ allowDuplicateGuesses: true }).netReward / NUM_SIMULATIONS;
        }
        expect(avg).toBeLessThan(EXPECTED_REWARD);
    });

    it("should penalize inconsistent guesses", () => {
        let avg = 0;
        for (let i = 0; i < NUM_SIMULATIONS; i++) {
            avg += simulateGame({ allowInconsistentGuesses: true }).netReward / NUM_SIMULATIONS;
        }
        expect(avg).toBeLessThan(EXPECTED_REWARD);
    });
});