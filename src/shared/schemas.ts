import z from "zod";

export const suitSchema = z.enum(["hearts", "diamonds", "clubs", "spades"]);

export const rankSchema = z.enum(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q"])

export const cardSchema = z.object({
    id: z.string(),
    suit: suitSchema,
    rank: rankSchema
});

export const levelManifestSchema = z.object({
    name: z.string(),
    basename: z.string()
}).array();

export const levelSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    deck: cardSchema.array()
        .min(2, "deck needs at least 2 cards")
        .refine(
            (deck) => new Set(deck.map((card) => card.id)).size === deck.length,
            "card ids must be unique"
        )
        .refine(
            (deck) => new Set(deck.map((card) => `${card.suit}-${card.rank}`)).size === deck.length,
            "a deck can't have the same card twice"
        ),
    maxStrikes: z.number().int().positive(),
    questionsRequired: z.number().int().positive()
});