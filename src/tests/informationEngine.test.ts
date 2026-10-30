
import { describe, expect, it } from "vitest";
import { level1 } from "../config/levels";
import {
    generatePossibleFacts,
    getNextInformation,
} from "../game/informationEngine";
import type { Card, KnownInformation } from "../shared/types";

const heartAce = level1.deck[0] as Card;
const heartTwo = level1.deck[1] as Card;
const spadeAce = level1.deck[4] as Card;

const diamondQueen: Card = {
    id: "D-Q",
    suit: "diamonds",
    rank: "Q",
};

const clubEight: Card = {
    id: "C-8",
    suit: "clubs",
    rank: "8",
};

const allowedProperties = [
    "suit",
    "rank",
    "color",
    "parity",
    "category",
] as const;

const allowedOperators = [
    "equals",
    "not_equals",
    "less_than",
    "greater_than",
] as const;

function factById(
    facts: KnownInformation[],
    id: string,
): KnownInformation | undefined {
    return facts.find((fact) => fact.id === id);
}

describe("Information engine", () => {
    it("maps hearts to red", () => {
        const color = factById(generatePossibleFacts(heartAce), "color-red");
        expect(color?.value).toBe("red");
    });

    it("maps diamonds to red", () => {
        const color = factById(generatePossibleFacts(diamondQueen), "color-red");
        expect(color?.value).toBe("red");
    });

    it("maps clubs to black", () => {
        const color = factById(generatePossibleFacts(clubEight), "color-black");
        expect(color?.value).toBe("black");
    });

    it("maps spades to black", () => {
        const color = factById(generatePossibleFacts(spadeAce), "color-black");
        expect(color?.value).toBe("black");
    });

    it("includes the correct suit fact", () => {
        const suit = factById(generatePossibleFacts(heartAce), "suit-hearts");
        expect(suit).toEqual({
            id: "suit-hearts",
            description: "The hidden card is a heart.",
            property: "suit",
            operator: "equals",
            value: "hearts",
        });
    });

    it("counts aces as face cards", () => {
        const ace = factById(generatePossibleFacts(heartAce), "category-face");
        const queen = factById(
            generatePossibleFacts(diamondQueen),
            "category-face",
        );
        const two = factById(generatePossibleFacts(heartTwo), "category-number");

        expect(ace?.value).toBe("face");
        expect(queen?.value).toBe("face");
        expect(two?.value).toBe("number");
    });

    it("includes the correct rank fact", () => {
        const rank = factById(generatePossibleFacts(heartTwo), "rank-2");
        expect(rank).toEqual({
            id: "rank-2",
            description: "The hidden card is a 2.",
            property: "rank",
            operator: "equals",
            value: "2",
        });
    });

    it("returns facts from broader to more specific", () => {
        expect(generatePossibleFacts(heartAce).map((fact) => fact.id)).toEqual([
            "color-red",
            "suit-hearts",
            "parity-odd",
            "category-face",
            "rank-lt-7",
            "rank-A",
        ]);
    });

    it("skips a previously revealed fact", () => {
        const next = getNextInformation(heartAce, [
            {
                id: "color-red",
                description: "The hidden card is red.",
                property: "color",
                operator: "equals",
                value: "red",
            },
        ]);

        expect(next?.id).toBe("suit-hearts");
    });

    it("skips multiple previously revealed facts", () => {
        const next = getNextInformation(heartAce, [
            {
                id: "color-red",
                description: "The hidden card is red.",
                property: "color",
                operator: "equals",
                value: "red",
            },
            {
                id: "suit-hearts",
                description: "The hidden card is a heart.",
                property: "suit",
                operator: "equals",
                value: "hearts",
            },
        ]);

        expect(next?.id).toBe("parity-odd");
    });

    it("never returns duplicate facts", () => {
        const facts = generatePossibleFacts(heartAce);
        const ids = facts.map((fact) => fact.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("returns null when every supported fact is already known", () => {
        const existing = generatePossibleFacts(heartAce);
        expect(getNextInformation(heartAce, existing)).toBeNull();
    });

    it("returns facts that match the KnownInformation shape", () => {
        for (const fact of generatePossibleFacts(heartAce)) {
            expect(typeof fact.id).toBe("string");
            expect(typeof fact.description).toBe("string");
            expect(typeof fact.value).toBe("string");
            expect(allowedProperties).toContain(fact.property);
            expect(allowedOperators).toContain(fact.operator);
        }
    });
});
