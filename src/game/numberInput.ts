/**
 * Parsing and checking for numbers the player types in: fractions like
 * "1/3", decimals like "0.33" or ".5", whole numbers and negatives.
 */

/** Accept a typed decimal if it is within this distance of the exact value (so 0.33 matches 1/3). */
export const ANSWER_TOLERANCE = 0.005;

export type ParseResult =
    | { ok: true; value: number }
    | { ok: false; error: string };

// Optional sign, then digits with an optional decimal part, or a decimal starting with "."
const NUMBER = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)`;
const NUMBER_PATTERN = new RegExp(`^${NUMBER}$`);
const FRACTION_PATTERN = new RegExp(`^(${NUMBER})\\s*/\\s*(${NUMBER})$`);

/** Parses a fraction or decimal. Spaces around the text and around "/" are ignored. */
export function parseNumber(text: string): ParseResult {
    const trimmed = text.trim();
    if (trimmed === "") {
        return { ok: false, error: "Enter a value." };
    }

    if (NUMBER_PATTERN.test(trimmed)) {
        return { ok: true, value: Number(trimmed) };
    }

    const fraction = FRACTION_PATTERN.exec(trimmed);
    if (fraction) {
        const denominator = Number(fraction[2]);
        if (denominator === 0) {
            return { ok: false, error: "Can't divide by zero." };
        }
        return { ok: true, value: Number(fraction[1]) / denominator };
    }

    return { ok: false, error: "Use a fraction (1/3) or a decimal (0.33)." };
}

/** Like parseNumber, but the value must also be between 0 and 1. */
export function parseProbability(text: string): ParseResult {
    const result = parseNumber(text);
    if (result.ok && (result.value < 0 || result.value > 1)) {
        return { ok: false, error: "A probability must be between 0 and 1." };
    }
    return result;
}

/** True if a typed value is close enough to the exact answer. */
export function matchesAnswer(value: number, expected: number): boolean {
    return Math.abs(value - expected) <= ANSWER_TOLERANCE;
}
