import type { DiceDuelResult, DuelGame, DuelResult, HighCardDuelResult, PlayingCard, SlotDuelResult, SlotSymbol } from "./models";

export const DUEL_STAKE = 200;
export const DUEL_POT = DUEL_STAKE * 2;
export const DUEL_TTL_MS = 10 * 60 * 1000;

export const DUEL_GAME_META: Record<DuelGame, { title: string; description: string; emoji: string }> = {
  HIGH_CARD: { title: "Старшая карта", description: "Туз старше короля. При ничьей колода сдаёт заново.", emoji: "🂡" },
  DICE: { title: "Кости фортуны", description: "По две кости каждому. Побеждает большая сумма.", emoji: "🎲" },
  SLOTS: { title: "Свадебный слот", description: "Тройка старше пары, пара старше высокого символа.", emoji: "🎰" },
};

export const SLOT_SYMBOL_META: Record<SlotSymbol, { emoji: string; rank: number }> = {
  LEMON: { emoji: "🍋", rank: 1 },
  GLASS: { emoji: "🥂", rank: 2 },
  HEART: { emoji: "💚", rank: 3 },
  BOUQUET: { emoji: "💐", rank: 4 },
  RING: { emoji: "💍", rank: 5 },
  CROWN: { emoji: "👑", rank: 6 },
};

const suits: PlayingCard["suit"][] = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
const symbols = Object.keys(SLOT_SYMBOL_META) as SlotSymbol[];

export type DuelRandomInt = (maxExclusive: number) => number;

function drawCard(randomInt: DuelRandomInt): PlayingCard {
  return { rank: randomInt(13) + 2, suit: suits[randomInt(suits.length)] };
}

function rollDice(randomInt: DuelRandomInt): [number, number] {
  return [randomInt(6) + 1, randomInt(6) + 1];
}

function spinSlots(randomInt: DuelRandomInt): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [symbols[randomInt(symbols.length)], symbols[randomInt(symbols.length)], symbols[randomInt(symbols.length)]];
}

function slotScore(slots: [SlotSymbol, SlotSymbol, SlotSymbol]): { score: number[]; combination: SlotDuelResult["challengerCombination"] } {
  const ranks = slots.map((symbol) => SLOT_SYMBOL_META[symbol].rank).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const combination = groups[0][1] === 3 ? "THREE" : groups[0][1] === 2 ? "PAIR" : "HIGH";
  const category = combination === "THREE" ? 3 : combination === "PAIR" ? 2 : 1;
  return { score: [category, ...groups.flatMap(([rank, count]) => Array(count).fill(rank))], combination };
}

function compareScores(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function generateDuelResult(game: DuelGame, randomInt: DuelRandomInt): { result: DuelResult; winner: "CHALLENGER" | "OPPONENT" } {
  let redraws = 0;
  while (redraws < 128) {
    if (game === "HIGH_CARD") {
      const challengerCard = drawCard(randomInt);
      const opponentCard = drawCard(randomInt);
      if (challengerCard.rank !== opponentCard.rank) {
        const result: HighCardDuelResult = { game, challengerCard, opponentCard, redraws };
        return { result, winner: challengerCard.rank > opponentCard.rank ? "CHALLENGER" : "OPPONENT" };
      }
    }
    if (game === "DICE") {
      const challengerDice = rollDice(randomInt);
      const opponentDice = rollDice(randomInt);
      const challengerTotal = challengerDice[0] + challengerDice[1];
      const opponentTotal = opponentDice[0] + opponentDice[1];
      if (challengerTotal !== opponentTotal) {
        const result: DiceDuelResult = { game, challengerDice, opponentDice, redraws };
        return { result, winner: challengerTotal > opponentTotal ? "CHALLENGER" : "OPPONENT" };
      }
    }
    if (game === "SLOTS") {
      const challengerSlots = spinSlots(randomInt);
      const opponentSlots = spinSlots(randomInt);
      const challenger = slotScore(challengerSlots);
      const opponent = slotScore(opponentSlots);
      const comparison = compareScores(challenger.score, opponent.score);
      if (comparison !== 0) {
        const result: SlotDuelResult = { game, challengerSlots, opponentSlots, challengerCombination: challenger.combination, opponentCombination: opponent.combination, redraws };
        return { result, winner: comparison > 0 ? "CHALLENGER" : "OPPONENT" };
      }
    }
    redraws += 1;
  }
  throw new Error("DUEL_RANDOM_EXHAUSTED");
}

export function cardRankLabel(rank: number): string {
  if (rank <= 10) return String(rank);
  return ({ 11: "В", 12: "Д", 13: "К", 14: "Т" } as Record<number, string>)[rank] ?? String(rank);
}

export function cardSuitLabel(suit: PlayingCard["suit"]): string {
  return ({ HEARTS: "♥", DIAMONDS: "♦", CLUBS: "♣", SPADES: "♠" } as const)[suit];
}
