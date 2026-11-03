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
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        return this.manifest = levelManifestSchema.parse(level);
    }

    getLevelManifest(): LevelManifest | null {
        return this.manifest;
    }

    async loadLevel(name: string): Promise<Level> {
        const level = await fetch(`${PATH_TO_LEVELS}/${name}.json`).then(x => x.json());
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        return this.levels[name] = levelSchema.parse(level);
    }

    getLevel(name: string): Level | null {
        return this.levels[name] ?? null;
    }
}