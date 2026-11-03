import path from "path";
import fs from "fs/promises";
import { levelSchema } from "../src/shared/schemas";

const PATH_TO_LEVELS = path.join(import.meta.dirname, "../public/levels");

const levelPaths = await fs.readdir(PATH_TO_LEVELS);

let errors = await Promise.all(levelPaths.map(async levelPath => {
    levelPath = path.join(PATH_TO_LEVELS, levelPath);

    let level = await fs.readFile(levelPath, "utf8");
    level = JSON.parse(level);

    const result = levelSchema.safeParse(level);
    if (result.success) return null;

    return `Invalid level ${levelPath}: ${result.error}`;
}));
errors = errors.filter(error => error !== null);
if (errors.length > 0) throw new Error(errors.join("\n"));

console.log("All levels are valid");