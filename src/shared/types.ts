import z from "zod";
import { suitSchema, rankSchema, cardSchema, levelSchema, levelManifestSchema } from "./schemas";

export type Suit = z.infer<typeof suitSchema>;

export type Rank = z.infer<typeof rankSchema>;

// represents a single card in the deck
export interface Card extends z.infer<typeof cardSchema> {}

export type Level = z.infer<typeof levelSchema>;

export type LevelManifest = z.infer<typeof levelManifestSchema>;

// for clues revealed to the player about the hidden card
export interface KnownInformation {
  id: string;
  description: string;
  property: "suit" | "rank" | "color" | "parity" | "category";
  operator: "equals" | "not_equals" | "less_than" | "greater_than";
  value: string;
}

// current probability question
export interface ProbabilityQuestion {
  id: string;
  text: string;
  answerType: "fraction" | "decimal";
}

// current state of a game session
export interface GameState {
  gameId: string;
  levelId: number;
  status: "playing" | "won" | "lost";

  // cards available in  current level
  deck: Card[];

  // whether hidden card has been revealed
  hiddenCard: {
    isRevealed: boolean;
  };

  // clues collected and  current question
  knownInformation: KnownInformation[];
  currentQuestion: ProbabilityQuestion | null;

  // number of mistakes made and allowed
  strikes: number;
  maxStrikes: number;

  // rracks progress through the level
  questionsAnswered: number;
  questionsRequired: number;

  // cards that still match all known clues
  remainingPossibleCards: Card[];
  
  // number of chips the player has
  chips: number;

  // paid hint: player clicked Buy Clue and is picking a type
  choosingHint: boolean;
  // paid hint: remaining-card tray is unlocked for the rest of the level
  canViewRemainingCards: boolean;
  // paid hint: band around the current question's true probability
  probabilityRange: { low: number; high: number } | null;

  // cards that have been guessed incorrectly
  incorrectlyGuessedCards: Card[];
}

export type HintKind = "cards" | "range";
