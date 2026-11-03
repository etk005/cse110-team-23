import { levelManifestSchema, levelSchema } from "../shared/schemas";
import type { GameState, Level, LevelManifest } from "../shared/types";
import crypto from "crypto";

const PATH_TO_LEVELS = "levels";

export async function loadLevelManifest(name: string): Promise<LevelManifest> {
    const level = await fetch(`${PATH_TO_LEVELS}/manifest.json`).then(x => x.json());
    return levelManifestSchema.parse(level);
}

export async function loadLevel(name: string): Promise<Level> {
    const level = await fetch(`${PATH_TO_LEVELS}/${name}.json`).then(x => x.json());
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