
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K";

// represents a single card in the deck
export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

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
}
