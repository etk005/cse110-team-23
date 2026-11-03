import z from "zod";

export const suitSchema = z.enum(["hearts", "diamonds", "clubs", "spades"]);

export const rankSchema = z.enum(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q"])

export const cardSchema = z.object({
    id: z.string(),
    suit: suitSchema,
    rank: rankSchema
});

export const levelManifestSchema = z.string().array();

export const levelSchema = z.object({
    id: z.number(),
    name: z.string(),
    deck: cardSchema.array(),
    maxStrikes: z.number(),
    questionsRequired: z.number()
});