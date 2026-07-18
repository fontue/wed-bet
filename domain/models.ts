export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED";
export type EventStatus = "DRAFT" | "OPEN" | "CLOSED" | "RESOLVED" | "CANCELLED";
export type BetStatus = "ACCEPTED" | "WON" | "LOST" | "REFUNDED";
export type BonusKind = "LIRA" | "FREE_BET" | "MULTIPLIER" | "CASHBACK" | "NONE";
export type BonusStatus = "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED";

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
