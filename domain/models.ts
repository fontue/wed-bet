import type { LemonzaMode, LemonzaRoundResult } from "./slots/sweet-lemonza/types";

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED";
export type EventStatus = "DRAFT" | "OPEN" | "CLOSED" | "RESOLVED" | "CANCELLED";
export type BetStatus = "ACCEPTED" | "WON" | "LOST" | "REFUNDED";
export type BonusKind = "LIRA" | "FREE_BET" | "MULTIPLIER" | "CASHBACK" | "NONE";
export type BonusStatus = "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED";
export type DuelGame = "HIGH_CARD" | "DICE" | "SLOTS";
export type DuelStatus = "PENDING" | "RESOLVED" | "DECLINED" | "CANCELLED" | "EXPIRED";

export interface PlayingCard {
  rank: number;
  suit: "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
}

export interface HighCardDuelResult {
  game: "HIGH_CARD";
  challengerCard: PlayingCard;
  opponentCard: PlayingCard;
  redraws: number;
}

export interface DiceDuelResult {
  game: "DICE";
  challengerDice: [number, number];
  opponentDice: [number, number];
  redraws: number;
}

export type SlotSymbol = "LEMON" | "GLASS" | "HEART" | "RING" | "CROWN" | "BOUQUET";

export interface SlotDuelResult {
  game: "SLOTS";
  challengerSlots: [SlotSymbol, SlotSymbol, SlotSymbol];
  opponentSlots: [SlotSymbol, SlotSymbol, SlotSymbol];
  challengerCombination: "THREE" | "PAIR" | "HIGH";
  opponentCombination: "THREE" | "PAIR" | "HIGH";
  redraws: number;
}

export type DuelResult = HighCardDuelResult | DiceDuelResult | SlotDuelResult;

export interface Duel {
  id: string;
  game: DuelGame;
  status: DuelStatus;
  challengerId: string;
  opponentId: string;
  stake: number;
  pot: number;
  winnerId?: string;
  result?: DuelResult;
  createIdempotencyKey: string;
  acceptIdempotencyKey?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
}

export interface SlotRound {
  id: string;
  gameId: "sweet-lemonza";
  mathVersion: string;
  userId: string;
  stake: number;
  mode: LemonzaMode;
  chargedAmount: number;
  baseWin: number;
  scatterWin: number;
  bonusWin: number;
  totalWin: number;
  balanceBefore: number;
  balanceAfter: number;
  bonusTriggered: boolean;
  maxMultiplier: number;
  idempotencyKey: string;
  result: LemonzaRoundResult;
  createdAt: string;
}

export interface SlotOperationalSettings {
  gameId: "sweet-lemonza";
  enabled: boolean;
  spinsEnabled: boolean;
  allowedBets: number[];
  minBet: number;
  maxBet: number;
  lemonBoostEnabled: boolean;
  bonusBuyEnabled: boolean;
}

export interface User {
  id: string;
  displayName: string;
  loginCode: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  tableNumber?: string;
  team?: string;
  avatar: string;
  createdAt: string;
}

export interface Outcome {
  id: string;
  title: string;
  order: number;
  initialProbabilityBps: number;
  seedPool: number;
  pool: number;
  bettorsCount: number;
}

export interface MarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  status: EventStatus;
  closesAt: string;
  createdAt: string;
  featured?: boolean;
  winningOutcomeId?: string;
  outcomes: Outcome[];
}

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  outcomeId: string;
  amount: number;
  status: BetStatus;
  projectedCoefficient: number;
  probabilityAfterBps: number;
  payout?: number;
  bonusId?: string;
  idempotencyKey: string;
  createdAt: string;
  settledAt?: string;
}

export type TransactionType =
  | "INITIAL_BALANCE"
  | "BET"
  | "WIN"
  | "REFUND"
  | "BONUS"
  | "CASHBACK"
  | "DUEL_STAKE"
  | "DUEL_WIN"
  | "DUEL_REFUND"
  | "SLOT_BET"
  | "SLOT_WIN"
  | "ADMIN_ADJUSTMENT";

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  reason: string;
  balanceAfter: number;
  operationKey: string;
  createdAt: string;
}

export interface BonusDefinition {
  id: string;
  label: string;
  kind: BonusKind;
  value: number;
  weight: number;
  color: string;
  validityMinutes: number;
  active: boolean;
}

export interface UserBonus {
  id: string;
  userId: string;
  definitionId: string;
  label: string;
  kind: BonusKind;
  value: number;
  status: BonusStatus;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface BonusSpin {
  id: string;
  userId: string;
  definitionId: string;
  idempotencyKey: string;
  createdAt: string;
  nextSpinAt: string;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  emoji: string;
  publishedAt: string;
}

export interface LoginToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}
