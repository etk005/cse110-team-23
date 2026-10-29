
import type { Card } from "../shared/types";

export interface LevelConfig {
    id: number;
    name: string;
    deck: Card[];
    maxStrikes: number;
    questionsRequired: number;
}

// simple starting deck for Level 1
export const level1: LevelConfig = {
    id: 1,
    name: "Level 1",

    deck: [
        { id: "H-A", suit: "hearts", rank: "A" },
        { id: "H-2", suit: "hearts", rank: "2" },
        { id: "H-3", suit: "hearts", rank: "3" },
        { id: "H-4", suit: "hearts", rank: "4" },

        { id: "S-A", suit: "spades", rank: "A" },
        { id: "S-2", suit: "spades", rank: "2" },
        { id: "S-3", suit: "spades", rank: "3" },
        { id: "S-4", suit: "spades", rank: "4" },
    ],

    maxStrikes: 3,
    questionsRequired: 3,
};
