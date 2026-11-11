import type {
  Card,
  CardCondition,
  ProbabilityQuestion,
  Rank,
  Suit,
} from "../shared/types";
import { categoryOf, colorOf, matchesInformation } from "./informationMatching";

const SUIT_NAMES: Record<Suit, string> = {
  hearts: "heart",
  diamonds: "diamond",
  clubs: "club",
  spades: "spade",
};

const FACE_NAMES: Partial<Record<Rank, string>> = {
  J: "jack",
  Q: "queen",
  K: "king",
};

// ranks that read naturally in "greater than _" / "less than _"
const NUMBER_RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];

function withArticle(word: string): string {
  return /^(a|e|i|o|u|8)/.test(word) ? `an ${word}` : `a ${word}`;
}

function makeQuestion(condition: CardCondition, phrase: string): ProbabilityQuestion {
  return {
    ...condition,
    id: `${condition.property}-${condition.operator}-${condition.value}`,
    text: `What is the probability that the hidden card is ${phrase}?`,
    answerType: "fraction",
  };
}

// every question that makes sense for the cards in this deck
export function generatePossibleQuestions(deck: Card[]): ProbabilityQuestion[] {
  const questions: ProbabilityQuestion[] = [];
  const has = (pred: (card: Card) => boolean) => deck.some(pred);

  for (const color of ["red", "black"]) {
    if (has((card) => colorOf(card.suit) === color)) {
      questions.push(makeQuestion({ property: "color", operator: "equals", value: color }, color));
    }
  }

  for (const suit of Object.keys(SUIT_NAMES) as Suit[]) {
    if (has((card) => card.suit === suit)) {
      questions.push(
        makeQuestion({ property: "suit", operator: "equals", value: suit }, withArticle(SUIT_NAMES[suit])),
      );
    }
  }

  for (const parity of ["even", "odd"]) {
    questions.push(makeQuestion({ property: "parity", operator: "equals", value: parity }, parity));
  }

  for (const category of ["ace", "number", "face"] as const) {
    if (has((card) => categoryOf(card.rank) === category)) {
      const phrase = category === "ace" ? "an ace" : `${withArticle(category)} card`;
      questions.push(makeQuestion({ property: "category", operator: "equals", value: category }, phrase));
    }
  }

  const ranks = new Set(deck.map((card) => card.rank));
  for (const rank of ranks) {
    // aces are already asked about as a category
    if (rank === "A") {
      continue;
    }
    questions.push(
      makeQuestion({ property: "rank", operator: "equals", value: rank }, withArticle(FACE_NAMES[rank] ?? rank)),
    );
  }

  for (const rank of NUMBER_RANKS.filter((r) => ranks.has(r))) {
    questions.push(
      makeQuestion({ property: "rank", operator: "greater_than", value: rank }, `greater than ${rank}`),
      makeQuestion({ property: "rank", operator: "less_than", value: rank }, `less than ${rank}`),
    );
  }

  return questions;
}

// chance that a card picked from these cards matches the condition
export function probabilityOf(condition: CardCondition, cards: Card[]): number {
  if (cards.length === 0) {
    return 0;
  }
  return cards.filter((card) => matchesInformation(card, condition)).length / cards.length;
}

/**
 * Picks a random question not asked yet, preferring ones whose answer
 * isn't simply 0 or 1 for the cards that are still possible.
 */
export function generateQuestion(
  deck: Card[],
  remainingCards: Card[],
  askedIds: Set<string>,
  random: () => number = Math.random,
): ProbabilityQuestion | null {
  const unasked = generatePossibleQuestions(deck).filter((q) => !askedIds.has(q.id));
  const interesting = unasked.filter((q) => {
    const p = probabilityOf(q, remainingCards);
    return p > 0 && p < 1;
  });

  const pool = interesting.length > 0 ? interesting : unasked;
  return pool[Math.floor(random() * pool.length)] ?? null;
}
