
import type { GameState } from "../shared/types";
import { level1 } from "../config/levels";

export const mockGameState: GameState = {
    gameId: "game-001",
    levelId: level1.id,
    status: "playing",

    // cards available in this level
    deck: level1.deck,

    // actual hidden card is kept on backend??
    hiddenCard: {
        isRevealed: false,
    },

    // information player has discovered
    knownInformation: [
        {
            id: "info-1",
            description: "The hidden card is a heart.",
            property: "suit",
            operator: "equals",
            value: "hearts",
        },
    ],

    // current probability question
    currentQuestion: {
        id: "question-1",
        text: "What is the probability that the hidden card is an Ace?",
        answerType: "fraction",
    },

    // strikes
    strikes: 0,
    maxStrikes: level1.maxStrikes,

    // progress
    questionsAnswered: 0,
    questionsRequired: level1.questionsRequired,

    // cards consistent with the known information
    remainingPossibleCards: level1.deck.filter(
        (card) => card.suit === "hearts"
    ),
};
