import path from "path";
import fs from "fs/promises";
import { levelManifestSchema, levelSchema } from "../src/shared/schemas";
import type { LevelManifest } from "../src/shared/types";

const PATH_TO_LEVELS = path.join(import.meta.dirname, "../public/levels");

async function loadManifest(): Promise<LevelManifest> {
    try {
        const json = JSON.parse(await fs.readFile(path.join(PATH_TO_LEVELS, "manifest.json"), "utf8"));
        return levelManifestSchema.parse(json);
    } catch (cause) {
        throw new Error("Invalid level manifest", { cause });
    }
}

async function loadLevel(name: string) {
    try {
        const json = JSON.parse(await fs.readFile(path.join(PATH_TO_LEVELS, `${name}.json`), "utf8"));
        return levelSchema.parse(json);
    } catch (cause) {
        throw new Error(`Invalid level ${name}`, { cause });
    }
}

const manifest = await loadManifest();

const results = await Promise.allSettled(manifest.map(name => loadLevel(name)));
const errors = [];
for (const result of results) {
    if (result.status !== "rejected") continue;
    errors.push(result.reason);
}
if (errors.length > 0) {
    throw new Error("Invalid level(s)", { cause: errors });
}
console.log("All levels are valid");