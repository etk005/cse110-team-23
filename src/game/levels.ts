import { levelSchema } from "../shared/schemas";
import type { GameState, Level } from "../shared/types";
import crypto from "crypto";

export async function loadLevel(name: string): Promise<Level> {
    const level = await fetch(`./levels/${name}.json`).then(x => x.json());
    return levelSchema.parse(level);
}

export async function createGameStateFromLevel(level: Level): Promise<GameState> {
    return {
        currentQuestion: null,
        deck: level.deck,
        gameId: crypto.randomUUID(),
        hiddenCard: {
            isRevealed: false,
        },
        knownInformation: [],
        levelId: level.id,
        maxStrikes: level.maxStrikes,
        questionsAnswered: 0,
        questionsRequired: level.questionsRequired,
        remainingPossibleCards: level.deck,
        status: "playing",
        strikes: 0
    }
}