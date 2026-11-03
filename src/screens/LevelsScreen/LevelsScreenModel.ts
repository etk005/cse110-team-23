import type { Level, LevelManifest } from "../../shared/types";
import { levelManifestSchema, levelSchema } from "../../shared/schemas";

const PATH_TO_LEVELS = "levels";

export class LevelsScreenModel {
    private manifest: LevelManifest | null;
    private levels: Record<string, Level | null>;
    
    constructor() {
        this.manifest = null;
        this.levels = {};
    }

    async loadLevelManifest(): Promise<LevelManifest> {
        const level = await fetch(`${PATH_TO_LEVELS}/manifest.json`).then(x => x.json());
        return this.manifest = levelManifestSchema.parse(level);
    }

    getLevelManifest(): LevelManifest | null {
        return this.manifest;
    }

    async loadLevel(basename: string): Promise<Level> {
        const level = await fetch(`${PATH_TO_LEVELS}/${basename}.json`).then(x => x.json());
        return this.levels[basename] = levelSchema.parse(level);
    }

    getLevel(basename: string): Level | null {
        return this.levels[basename] ?? null;
    }
}