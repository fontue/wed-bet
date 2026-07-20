import { createHash, randomInt, randomUUID } from "node:crypto";
import { seedBets, seedBonusDefinitions, seedEvents, seedNews, seedTransactions, seedUsers } from "@/data/seed";
import { marketView, quoteBet, totalPool } from "@/domain/market";
import { DUEL_GAME_META, DUEL_POT, DUEL_STAKE, DUEL_TTL_MS, generateDuelResult } from "@/domain/duels";
import { LEMONZA_BETS, LEMONZA_GAME } from "@/domain/slots/sweet-lemonza/config";
import { runSweetLemonzaRound } from "@/domain/slots/sweet-lemonza/engine";
import { createCryptoRng } from "@/domain/slots/sweet-lemonza/rng";
import { DOG_HOUSE_BETS, DOG_HOUSE_GAME } from "@/domain/slots/dog-house/config";
import { runDogHouseRound } from "@/domain/slots/dog-house/engine";
import type {
  Bet,
  AnySlotRound,
  BonusSpin,
  Duel,
  DuelGame,
  DogHouseOperationalSettings,
  LoginToken,
  MarketEvent,
  Session,
  SlotOperationalSettings,
  SlotRound,
  User,
  UserBonus,
  WalletTransaction,
} from "@/domain/models";
import type { LemonzaMode } from "@/domain/slots/sweet-lemonza/types";

const SPIN_INTERVAL_MS = 30 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MOCK_STATE_VERSION = 2;

interface MockState {
  schemaVersion: number;
  users: User[];
  events: MarketEvent[];
  bets: Bet[];
  transactions: WalletTransaction[];
  bonusDefinitions: typeof seedBonusDefinitions;
  spinIntervalMinutes: number;
  userBonuses: UserBonus[];
  spins: BonusSpin[];
  news: typeof seedNews;
  duels: Duel[];
  slotRounds: AnySlotRound[];
  slotSettings: SlotOperationalSettings;
  dogHouseSettings: DogHouseOperationalSettings;
  loginTokens: LoginToken[];
  sessions: Session[];
  betRequests: Map<string, string>;
  spinRequests: Map<string, string>;
  duelCreateRequests: Map<string, string>;
  duelActionRequests: Map<string, string>;
  slotSpinRequests: Map<string, string>;
  slotInFlightUsers: Set<string>;
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const clone = <T,>(value: T): T => structuredClone(value);
const isoAfter = (milliseconds: number) => new Date(Date.now() + milliseconds).toISOString();

function initialState(): MockState {
  return {
    schemaVersion: MOCK_STATE_VERSION,
    users: clone(seedUsers),
    events: clone(seedEvents),
    bets: clone(seedBets),
    transactions: clone(seedTransactions),
    bonusDefinitions: clone(seedBonusDefinitions),
    spinIntervalMinutes: SPIN_INTERVAL_MS / 60_000,
    userBonuses: [
      { id: "ub-welcome", userId: "u-sofia", definitionId: "bonus-back", label: "Возврат 30%", kind: "CASHBACK", value: 30, status: "AVAILABLE", expiresAt: isoAfter(95 * 60_000), createdAt: new Date().toISOString() },
    ],
    spins: [],
    news: clone(seedNews),
    duels: [],
    slotRounds: [],
    slotSettings: { gameId: "sweet-lemonza", enabled: true, spinsEnabled: true, allowedBets: [...LEMONZA_BETS], minBet: LEMONZA_BETS[0], maxBet: LEMONZA_BETS.at(-1)!, lemonBoostEnabled: true, bonusBuyEnabled: true },
    dogHouseSettings: { gameId: "casa-degli-sposi", enabled: true, spinsEnabled: true, allowedBets: [...DOG_HOUSE_BETS], minBet: DOG_HOUSE_BETS[0], maxBet: DOG_HOUSE_BETS.at(-1)! },
    loginTokens: process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "1" ? [] : [
      { id: "lt-guest", userId: "u-sofia", tokenHash: hash("guest-demo"), expiresAt: isoAfter(365 * 24 * 60 * 60 * 1000) },
      { id: "lt-misha", userId: "u-misha", tokenHash: hash("misha-demo"), expiresAt: isoAfter(365 * 24 * 60 * 60 * 1000) },
      { id: "lt-admin", userId: "u-admin", tokenHash: hash("admin-demo"), expiresAt: isoAfter(365 * 24 * 60 * 60 * 1000) },
    ],
    sessions: [],
    betRequests: new Map(),
    spinRequests: new Map(),
    duelCreateRequests: new Map(),
    duelActionRequests: new Map(),
    slotSpinRequests: new Map(),
    slotInFlightUsers: new Set(),
  };
}

const globalStore = globalThis as typeof globalThis & { __wedBetMockStore?: MockState };
// This version intentionally drops all previous mock data. The wine-symbol
// rename has no legacy migration because the current project does not
// need to preserve users, sessions, wallet history, bets, duels or slot rounds.
export const store = globalStore.__wedBetMockStore?.schemaVersion === MOCK_STATE_VERSION
  ? globalStore.__wedBetMockStore
  : initialState();
// Route handlers and server components can be emitted as separate production bundles.
// Keep the temporary in-memory repository shared inside one Node.js process so a
// session created by /api/auth/exchange is visible to the following page request.
globalStore.__wedBetMockStore = store;
// Keep development hot reload compatible when the in-memory schema gains fields.
store.duels ??= [];
store.duelCreateRequests ??= new Map();
store.duelActionRequests ??= new Map();
store.slotRounds ??= [];
store.slotSettings ??= { gameId: "sweet-lemonza", enabled: true, spinsEnabled: true, allowedBets: [...LEMONZA_BETS], minBet: LEMONZA_BETS[0], maxBet: LEMONZA_BETS.at(-1)!, lemonBoostEnabled: true, bonusBuyEnabled: true };
store.dogHouseSettings ??= { gameId: "casa-degli-sposi", enabled: true, spinsEnabled: true, allowedBets: [...DOG_HOUSE_BETS], minBet: DOG_HOUSE_BETS[0], maxBet: DOG_HOUSE_BETS.at(-1)! };
store.slotSettings.lemonBoostEnabled ??= true;
store.slotSettings.bonusBuyEnabled ??= true;
if (store.slotSettings.allowedBets.some((value) => !LEMONZA_BETS.includes(value as typeof LEMONZA_BETS[number]))) {
  store.slotSettings.allowedBets = [...LEMONZA_BETS];
  store.slotSettings.minBet = LEMONZA_BETS[0];
  store.slotSettings.maxBet = LEMONZA_BETS.at(-1)!;
}
store.slotSpinRequests ??= new Map();
store.slotInFlightUsers ??= new Set();

export function listEvents(): MarketEvent[] {
  return clone(store.events);
}

export function createEvent(input: { title: string; description: string; category: string; emoji?: string; closesAt: string; liquidity: number; outcomes: Array<{ title: string; probability: number }> }): MarketEvent {
  if (!input.title?.trim() || !input.description?.trim() || !input.category?.trim()) throw new Error("INVALID_EVENT");
  if (!Array.isArray(input.outcomes) || input.outcomes.length < 2 || input.outcomes.some((item) => !item.title.trim())) throw new Error("INVALID_OUTCOMES");
  const totalProbability = input.outcomes.reduce((sum, item) => sum + Number(item.probability), 0);
  if (Math.abs(totalProbability - 100) > 0.001) throw new Error("INVALID_PROBABILITY");
  if (!Number.isInteger(input.liquidity) || input.liquidity <= 0) throw new Error("INVALID_LIQUIDITY");
  if (!input.closesAt || new Date(input.closesAt).getTime() <= Date.now()) throw new Error("INVALID_CLOSE_TIME");
  const id = randomUUID();
  const rawSeeds = input.outcomes.map((item) => (input.liquidity * item.probability) / 100);
  const seeds = rawSeeds.map(Math.floor);
  const remainder = input.liquidity - seeds.reduce((sum, value) => sum + value, 0);
  const order = rawSeeds.map((value, index) => ({ index, fraction: value % 1 })).sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < remainder; index += 1) seeds[order[index % order.length].index] += 1;
  const event: MarketEvent = {
    id, slug: `event-${id.slice(0, 8)}`, title: input.title.trim(), description: input.description.trim(), category: input.category.trim(), emoji: input.emoji?.trim() || "🍋",
    status: "DRAFT", closesAt: new Date(input.closesAt).toISOString(), createdAt: new Date().toISOString(),
    outcomes: input.outcomes.map((item, index) => ({ id: randomUUID(), title: item.title.trim(), order: index, initialProbabilityBps: Math.round(item.probability * 100), seedPool: seeds[index], pool: seeds[index], bettorsCount: 0 })),
  };
  store.events.unshift(event);
  return clone(event);
}

export function getEventBySlug(slug: string): MarketEvent | undefined {
  const event = store.events.find((item) => item.slug === slug);
  return event ? clone(event) : undefined;
}

export function getEventById(id: string): MarketEvent | undefined {
  const event = store.events.find((item) => item.id === id);
  return event ? clone(event) : undefined;
}

export function listUsers(): User[] {
  return clone(store.users);
}

function duelReason(duel: Duel): string {
  return `Дуэль: ${DUEL_GAME_META[duel.game].title}`;
}

function refundPendingDuel(duel: Duel, status: "DECLINED" | "CANCELLED" | "EXPIRED", at: string): void {
  if (duel.status !== "PENDING") return;
  const challenger = store.users.find((user) => user.id === duel.challengerId);
  if (!challenger) throw new Error("USER_NOT_FOUND");
  challenger.balance += duel.stake;
  store.transactions.push({
    id: randomUUID(), userId: challenger.id, amount: duel.stake, type: "DUEL_REFUND",
    reason: `${duelReason(duel)} · возврат`, balanceAfter: challenger.balance,
    operationKey: `duel:${duel.id}:refund`, createdAt: at,
  });
  duel.status = status;
  if (status === "DECLINED") duel.declinedAt = at;
  if (status === "CANCELLED") duel.cancelledAt = at;
  if (status === "EXPIRED") duel.expiredAt = at;
}

function expirePendingDuels(): void {
  const now = Date.now();
  const at = new Date(now).toISOString();
  for (const duel of store.duels) {
    if (duel.status === "PENDING" && new Date(duel.expiresAt).getTime() <= now) refundPendingDuel(duel, "EXPIRED", at);
  }
}

export function getDuelById(id: string): Duel | undefined {
  expirePendingDuels();
  const duel = store.duels.find((item) => item.id === id);
  return duel ? clone(duel) : undefined;
}

export function listEligibleDuelOpponents(userId: string): User[] {
  return clone(store.users.filter((user) => user.id !== userId && user.role === "USER" && user.status === "ACTIVE").sort((a, b) => a.displayName.localeCompare(b.displayName, "ru")));
}

export function getDuelState(userId: string) {
  expirePendingDuels();
  const involved = store.duels.filter((duel) => duel.challengerId === userId || duel.opponentId === userId);
  const resolved = involved.filter((duel) => duel.status === "RESOLVED");
  const duelTransactions = store.transactions.filter((transaction) => transaction.userId === userId && ["DUEL_STAKE", "DUEL_WIN", "DUEL_REFUND"].includes(transaction.type));
  return {
    incoming: clone(involved.filter((duel) => duel.status === "PENDING" && duel.opponentId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    outgoing: clone(involved.filter((duel) => duel.status === "PENDING" && duel.challengerId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    recent: clone(involved.filter((duel) => duel.status !== "PENDING").sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt)).slice(0, 20)),
    opponents: listEligibleDuelOpponents(userId),
    users: clone(store.users.filter((user) => involved.some((duel) => duel.challengerId === user.id || duel.opponentId === user.id) || user.id === userId)),
    stats: {
      played: resolved.length,
      wins: resolved.filter((duel) => duel.winnerId === userId).length,
      losses: resolved.filter((duel) => duel.winnerId !== userId).length,
      profit: duelTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    },
    balance: getUser(userId)?.balance ?? 0,
    serverTime: Date.now(),
  };
}

export function createDuel(input: { challengerId: string; opponentId: string; game: DuelGame; idempotencyKey: string }): { duel: Duel; balance: number } {
  expirePendingDuels();
  const existingId = store.duelCreateRequests.get(input.idempotencyKey);
  if (existingId) {
    const existing = store.duels.find((duel) => duel.id === existingId);
    if (!existing || existing.challengerId !== input.challengerId) throw new Error("IDEMPOTENCY_CONFLICT");
    return { duel: clone(existing), balance: getUser(input.challengerId)!.balance };
  }
  const challenger = store.users.find((user) => user.id === input.challengerId);
  const opponent = store.users.find((user) => user.id === input.opponentId);
  if (!challenger || challenger.role !== "USER" || challenger.status !== "ACTIVE") throw new Error("USER_UNAVAILABLE");
  if (!opponent || opponent.role !== "USER" || opponent.status !== "ACTIVE" || opponent.id === challenger.id) throw new Error("OPPONENT_UNAVAILABLE");
  if (!(["HIGH_CARD", "DICE", "SLOTS"] as DuelGame[]).includes(input.game)) throw new Error("INVALID_DUEL_GAME");
  if (challenger.balance < DUEL_STAKE) throw new Error("INSUFFICIENT_BALANCE");
  if (store.duels.filter((duel) => duel.challengerId === challenger.id && duel.status === "PENDING").length >= 3) throw new Error("TOO_MANY_OUTGOING_DUELS");
  if (store.duels.some((duel) => duel.status === "PENDING" && [duel.challengerId, duel.opponentId].includes(challenger.id) && [duel.challengerId, duel.opponentId].includes(opponent.id))) throw new Error("PAIR_DUEL_EXISTS");

  const createdAt = new Date().toISOString();
  const duel: Duel = {
    id: randomUUID(), game: input.game, status: "PENDING", challengerId: challenger.id, opponentId: opponent.id,
    stake: DUEL_STAKE, pot: DUEL_POT, createIdempotencyKey: input.idempotencyKey, createdAt,
    expiresAt: new Date(Date.now() + DUEL_TTL_MS).toISOString(),
  };
  challenger.balance -= DUEL_STAKE;
  store.transactions.push({
    id: randomUUID(), userId: challenger.id, amount: -DUEL_STAKE, type: "DUEL_STAKE", reason: duelReason(duel),
    balanceAfter: challenger.balance, operationKey: `duel:${duel.id}:challenger-stake`, createdAt,
  });
  store.duels.push(duel);
  store.duelCreateRequests.set(input.idempotencyKey, duel.id);
  return { duel: clone(duel), balance: challenger.balance };
}

export function acceptDuel(input: { duelId: string; opponentId: string; idempotencyKey: string }): { duel: Duel; balance: number } {
  expirePendingDuels();
  const duel = store.duels.find((item) => item.id === input.duelId);
  if (!duel || duel.opponentId !== input.opponentId) throw new Error("DUEL_NOT_FOUND");
  if (duel.status === "RESOLVED") return { duel: clone(duel), balance: getUser(input.opponentId)!.balance };
  const requestKey = `${input.opponentId}:accept:${input.idempotencyKey}`;
  const previousId = store.duelActionRequests.get(requestKey);
  if (previousId) {
    const previous = store.duels.find((item) => item.id === previousId)!;
    return { duel: clone(previous), balance: getUser(input.opponentId)!.balance };
  }
  if (duel.status !== "PENDING") throw new Error("DUEL_NOT_PENDING");
  const opponent = store.users.find((user) => user.id === input.opponentId && user.role === "USER" && user.status === "ACTIVE");
  if (!opponent) throw new Error("USER_UNAVAILABLE");
  if (opponent.balance < duel.stake) throw new Error("INSUFFICIENT_BALANCE");

  const acceptedAt = new Date().toISOString();
  const generated = generateDuelResult(duel.game, (maxExclusive) => randomInt(maxExclusive));
  const winnerId = generated.winner === "CHALLENGER" ? duel.challengerId : duel.opponentId;
  const winner = store.users.find((user) => user.id === winnerId)!;
  opponent.balance -= duel.stake;
  store.transactions.push({
    id: randomUUID(), userId: opponent.id, amount: -duel.stake, type: "DUEL_STAKE", reason: duelReason(duel),
    balanceAfter: opponent.balance, operationKey: `duel:${duel.id}:opponent-stake`, createdAt: acceptedAt,
  });
  winner.balance += duel.pot;
  store.transactions.push({
    id: randomUUID(), userId: winner.id, amount: duel.pot, type: "DUEL_WIN", reason: `${duelReason(duel)} · победа`,
    balanceAfter: winner.balance, operationKey: `duel:${duel.id}:win`, createdAt: acceptedAt,
  });
  duel.status = "RESOLVED";
  duel.acceptIdempotencyKey = input.idempotencyKey;
  duel.acceptedAt = acceptedAt;
  duel.resolvedAt = acceptedAt;
  duel.result = generated.result;
  duel.winnerId = winnerId;
  store.duelActionRequests.set(requestKey, duel.id);
  return { duel: clone(duel), balance: opponent.balance };
}

export function declineDuel(input: { duelId: string; opponentId: string; idempotencyKey: string }): Duel {
  expirePendingDuels();
  const duel = store.duels.find((item) => item.id === input.duelId && item.opponentId === input.opponentId);
  if (!duel) throw new Error("DUEL_NOT_FOUND");
  const requestKey = `${input.opponentId}:decline:${input.idempotencyKey}`;
  if (store.duelActionRequests.has(requestKey)) return clone(duel);
  if (duel.status !== "PENDING") throw new Error("DUEL_NOT_PENDING");
  refundPendingDuel(duel, "DECLINED", new Date().toISOString());
  store.duelActionRequests.set(requestKey, duel.id);
  return clone(duel);
}

export function cancelDuel(input: { duelId: string; actorId: string; idempotencyKey: string; admin?: boolean }): Duel {
  expirePendingDuels();
  const duel = store.duels.find((item) => item.id === input.duelId);
  if (!duel || (!input.admin && duel.challengerId !== input.actorId)) throw new Error("DUEL_NOT_FOUND");
  const requestKey = `${input.actorId}:cancel:${input.idempotencyKey}`;
  if (store.duelActionRequests.has(requestKey)) return clone(duel);
  if (duel.status !== "PENDING") throw new Error("DUEL_NOT_PENDING");
  refundPendingDuel(duel, "CANCELLED", new Date().toISOString());
  store.duelActionRequests.set(requestKey, duel.id);
  return clone(duel);
}

export function listAllDuels(): Duel[] {
  expirePendingDuels();
  return clone([...store.duels].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getUser(id: string): User | undefined {
  const user = store.users.find((item) => item.id === id);
  return user ? clone(user) : undefined;
}

export function getSessionUser(sessionId?: string): User | undefined {
  if (!sessionId) return undefined;
  const session = store.sessions.find((item) => item.id === sessionId && !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return undefined;
  const user = store.users.find((item) => item.id === session.userId && item.status === "ACTIVE");
  return user ? clone(user) : undefined;
}

export function exchangeLoginToken(rawToken: string): { session: Session; user: User } {
  const token = store.loginTokens.find((item) => item.tokenHash === hash(rawToken));
  if (!token || token.usedAt || token.revokedAt || new Date(token.expiresAt).getTime() <= Date.now()) throw new Error("INVALID_TOKEN");
  const user = store.users.find((item) => item.id === token.userId);
  if (!user || user.status !== "ACTIVE") throw new Error("ACCOUNT_BLOCKED");
  token.usedAt = new Date().toISOString();
  const session: Session = { id: randomUUID(), userId: user.id, createdAt: new Date().toISOString(), expiresAt: isoAfter(SESSION_TTL_MS) };
  store.sessions.push(session);
  return { session: clone(session), user: clone(user) };
}

/** Reusable convenience login for local development only. Never called in production. */
export function createDevelopmentSession(rawToken: string): { session: Session; user: User } {
  if (process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "1") throw new Error("DEMO_LOGIN_DISABLED");
  const userId = rawToken === "guest-demo" ? "u-sofia" : rawToken === "misha-demo" ? "u-misha" : rawToken === "admin-demo" ? "u-admin" : undefined;
  if (!userId) throw new Error("INVALID_TOKEN");
  const user = store.users.find((item) => item.id === userId && item.status === "ACTIVE");
  if (!user) throw new Error("ACCOUNT_BLOCKED");
  const session: Session = { id: randomUUID(), userId: user.id, createdAt: new Date().toISOString(), expiresAt: isoAfter(SESSION_TTL_MS) };
  store.sessions.push(session);
  return { session: clone(session), user: clone(user) };
}

export function revokeSession(sessionId: string): void {
  const session = store.sessions.find((item) => item.id === sessionId);
  if (session) session.revokedAt = new Date().toISOString();
}

export function issueLoginToken(userId: string): string {
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  for (const token of store.loginTokens.filter((item) => item.userId === userId && !item.usedAt)) token.revokedAt = new Date().toISOString();
  const rawToken = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  store.loginTokens.push({ id: randomUUID(), userId, tokenHash: hash(rawToken), expiresAt: isoAfter(7 * 24 * 60 * 60 * 1000) });
  return rawToken;
}

export function createUser(input: { displayName: string; loginCode: string; balance: number; role: "USER" | "ADMIN"; tableNumber?: string; team?: string }): User {
  if (!input.displayName.trim() || !input.loginCode.trim()) throw new Error("INVALID_USER");
  if (store.users.some((user) => user.loginCode.toLowerCase() === input.loginCode.toLowerCase())) throw new Error("LOGIN_EXISTS");
  if (!Number.isInteger(input.balance) || input.balance < 0) throw new Error("INVALID_BALANCE");
  const user: User = {
    id: randomUUID(), displayName: input.displayName.trim(), loginCode: input.loginCode.trim(), balance: input.balance,
    role: input.role, status: "ACTIVE", tableNumber: input.tableNumber?.trim() || undefined, team: input.team?.trim() || undefined,
    avatar: input.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""), createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  if (input.balance > 0) store.transactions.push({ id: randomUUID(), userId: user.id, amount: input.balance, type: "INITIAL_BALANCE", reason: "Стартовый баланс гостя", balanceAfter: input.balance, operationKey: `user:${user.id}:initial`, createdAt: user.createdAt });
  return clone(user);
}

export function updateUserAdmin(userId: string, input: { action: "block" | "unblock" | "reset-sessions" | "adjust"; amount?: number; reason?: string }): User {
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (input.action === "block") { user.status = "BLOCKED"; for (const session of store.sessions.filter((item) => item.userId === userId)) session.revokedAt = new Date().toISOString(); }
  if (input.action === "unblock") user.status = "ACTIVE";
  if (input.action === "reset-sessions") for (const session of store.sessions.filter((item) => item.userId === userId)) session.revokedAt = new Date().toISOString();
  if (input.action === "adjust") {
    if (!Number.isInteger(input.amount) || input.amount === 0 || !input.reason?.trim()) throw new Error("INVALID_ADJUSTMENT");
    const adjustment = input.amount as number;
    if (user.balance + adjustment < 0) throw new Error("NEGATIVE_BALANCE");
    user.balance += adjustment;
    store.transactions.push({ id: randomUUID(), userId, amount: adjustment, type: "ADMIN_ADJUSTMENT", reason: input.reason.trim(), balanceAfter: user.balance, operationKey: `adjust:${randomUUID()}`, createdAt: new Date().toISOString() });
  }
  return clone(user);
}

export function listUserBets(userId: string): Bet[] {
  return clone(store.bets.filter((bet) => bet.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function listTransactions(userId?: string): WalletTransaction[] {
  return clone(store.transactions.filter((transaction) => !userId || transaction.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function listUserBonuses(userId: string): UserBonus[] {
  const now = Date.now();
  for (const bonus of store.userBonuses) {
    if (bonus.userId === userId && bonus.status === "AVAILABLE" && new Date(bonus.expiresAt).getTime() <= now) bonus.status = "EXPIRED";
  }
  return clone(store.userBonuses.filter((bonus) => bonus.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function placeBet(input: { userId: string; eventId: string; outcomeId: string; amount: number; idempotencyKey: string; bonusId?: string }): { bet: Bet; balance: number; event: MarketEvent } {
  const existingBetId = store.betRequests.get(input.idempotencyKey);
  if (existingBetId) {
    const existing = store.bets.find((bet) => bet.id === existingBetId)!;
    return { bet: clone(existing), balance: getUser(input.userId)!.balance, event: getEventById(input.eventId)! };
  }

  const user = store.users.find((item) => item.id === input.userId);
  const event = store.events.find((item) => item.id === input.eventId);
  if (!user || user.status !== "ACTIVE") throw new Error("USER_UNAVAILABLE");
  if (!event || event.status !== "OPEN" || new Date(event.closesAt).getTime() <= Date.now()) throw new Error("EVENT_CLOSED");
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("INVALID_AMOUNT");

  const bonus = input.bonusId ? store.userBonuses.find((item) => item.id === input.bonusId && item.userId === user.id) : undefined;
  if (bonus && (bonus.status !== "AVAILABLE" || new Date(bonus.expiresAt).getTime() <= Date.now())) throw new Error("BONUS_UNAVAILABLE");
  const isFreeBet = bonus?.kind === "FREE_BET";
  if (isFreeBet && input.amount > bonus.value) throw new Error("FREE_BET_LIMIT");
  if (!isFreeBet && user.balance < input.amount) throw new Error("INSUFFICIENT_BALANCE");

  const quote = quoteBet(event, input.outcomeId, input.amount);
  const outcome = event.outcomes.find((item) => item.id === input.outcomeId)!;
  const isNewBettor = !store.bets.some((bet) => bet.eventId === event.id && bet.outcomeId === outcome.id && bet.userId === user.id);
  const bet: Bet = {
    id: randomUUID(), userId: user.id, eventId: event.id, outcomeId: outcome.id, amount: input.amount,
    status: "ACCEPTED", projectedCoefficient: quote.coefficient, probabilityAfterBps: quote.probabilityBps,
    bonusId: bonus?.id, idempotencyKey: input.idempotencyKey, createdAt: new Date().toISOString(),
  };

  if (!isFreeBet) {
    user.balance -= input.amount;
    store.transactions.push({
      id: randomUUID(), userId: user.id, amount: -input.amount, type: "BET", reason: event.title,
      balanceAfter: user.balance, operationKey: `bet:${bet.id}`, createdAt: bet.createdAt,
    });
  }
  if (bonus) {
    bonus.status = "USED";
    bonus.usedAt = bet.createdAt;
  }
  outcome.pool += input.amount;
  if (isNewBettor) outcome.bettorsCount += 1;
  store.bets.push(bet);
  store.betRequests.set(input.idempotencyKey, bet.id);
  return { bet: clone(bet), balance: user.balance, event: clone(event) };
}

export function getBonusState(userId: string) {
  const latest = [...store.spins].filter((spin) => spin.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    definitions: clone(store.bonusDefinitions.filter((item) => item.active)),
    bonuses: listUserBonuses(userId),
    spins: clone(store.spins.filter((spin) => spin.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    nextSpinAt: latest?.nextSpinAt ?? new Date(0).toISOString(),
    intervalMinutes: store.spinIntervalMinutes,
    serverTime: Date.now(),
  };
}

export function spinWheel(userId: string, idempotencyKey: string) {
  const existingSpinId = store.spinRequests.get(idempotencyKey);
  if (existingSpinId) {
    const existing = store.spins.find((spin) => spin.id === existingSpinId)!;
    return { spin: clone(existing), reward: clone(store.bonusDefinitions.find((item) => item.id === existing.definitionId)!), balance: getUser(userId)!.balance };
  }
  const user = store.users.find((item) => item.id === userId);
  if (!user || user.status !== "ACTIVE") throw new Error("USER_UNAVAILABLE");
  const latest = [...store.spins].filter((spin) => spin.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (latest && new Date(latest.nextSpinAt).getTime() > Date.now()) throw new Error("SPIN_COOLDOWN");

  const definitions = store.bonusDefinitions.filter((item) => item.active && item.weight > 0);
  const totalWeight = definitions.reduce((sum, item) => sum + item.weight, 0);
  let draw = randomInt(totalWeight);
  const reward = definitions.find((item) => ((draw -= item.weight) < 0)) ?? definitions.at(-1)!;
  const createdAt = new Date().toISOString();
  const spin: BonusSpin = { id: randomUUID(), userId, definitionId: reward.id, idempotencyKey, createdAt, nextSpinAt: isoAfter(store.spinIntervalMinutes * 60_000) };

  if (reward.kind === "LIRA") {
    user.balance += reward.value;
    store.transactions.push({ id: randomUUID(), userId, amount: reward.value, type: "BONUS", reason: `Колесо: ${reward.label}`, balanceAfter: user.balance, operationKey: `spin:${spin.id}`, createdAt });
  } else if (reward.kind !== "NONE") {
    store.userBonuses.push({ id: randomUUID(), userId, definitionId: reward.id, label: reward.label, kind: reward.kind, value: reward.value, status: "AVAILABLE", expiresAt: isoAfter(reward.validityMinutes * 60_000), createdAt });
  }
  store.spins.push(spin);
  store.spinRequests.set(idempotencyKey, spin.id);
  return { spin: clone(spin), reward: clone(reward), balance: user.balance };
}

export function resolveEvent(eventId: string, winningOutcomeId: string): MarketEvent {
  const event = store.events.find((item) => item.id === eventId);
  if (!event) throw new Error("EVENT_NOT_FOUND");
  if (event.status === "RESOLVED") {
    if (event.winningOutcomeId !== winningOutcomeId) throw new Error("ALREADY_RESOLVED");
    return clone(event);
  }
  const winner = event.outcomes.find((outcome) => outcome.id === winningOutcomeId);
  if (!winner) throw new Error("OUTCOME_NOT_FOUND");
  const settledAt = new Date().toISOString();
  const eventPool = totalPool(event.outcomes);

  for (const bet of store.bets.filter((item) => item.eventId === event.id && item.status === "ACCEPTED")) {
    bet.settledAt = settledAt;
    if (bet.outcomeId !== winningOutcomeId) {
      bet.status = "LOST";
      bet.payout = 0;
      const losingBonus = bet.bonusId ? store.userBonuses.find((item) => item.id === bet.bonusId) : undefined;
      if (losingBonus?.kind === "CASHBACK") {
        const cashback = Math.floor((bet.amount * losingBonus.value) / 100);
        const user = store.users.find((item) => item.id === bet.userId)!;
        user.balance += cashback;
        store.transactions.push({ id: randomUUID(), userId: user.id, amount: cashback, type: "CASHBACK", reason: `Возврат ${losingBonus.value}%: ${event.title}`, balanceAfter: user.balance, operationKey: `cashback:${event.id}:${bet.id}`, createdAt: settledAt });
      }
      continue;
    }
    bet.status = "WON";
    let payout = Math.floor((eventPool * bet.amount) / winner.pool);
    const bonus = bet.bonusId ? store.userBonuses.find((item) => item.id === bet.bonusId) : undefined;
    if (bonus?.kind === "FREE_BET") payout = Math.max(0, payout - bet.amount);
    if (bonus?.kind === "MULTIPLIER") payout += Math.floor(Math.max(0, payout - bet.amount) * ((bonus.value / 100) - 1));
    bet.payout = payout;
    const user = store.users.find((item) => item.id === bet.userId)!;
    user.balance += payout;
    store.transactions.push({ id: randomUUID(), userId: user.id, amount: payout, type: "WIN", reason: event.title, balanceAfter: user.balance, operationKey: `settle:${event.id}:${bet.id}`, createdAt: settledAt });
  }
  event.status = "RESOLVED";
  event.winningOutcomeId = winningOutcomeId;
  return clone(event);
}

export function cancelEvent(eventId: string): MarketEvent {
  const event = store.events.find((item) => item.id === eventId);
  if (!event) throw new Error("EVENT_NOT_FOUND");
  if (event.status === "CANCELLED") return clone(event);
  if (event.status === "RESOLVED") throw new Error("ALREADY_RESOLVED");
  const now = new Date().toISOString();
  for (const bet of store.bets.filter((item) => item.eventId === event.id && item.status === "ACCEPTED")) {
    bet.status = "REFUNDED";
    bet.payout = bet.amount;
    bet.settledAt = now;
    const bonus = bet.bonusId ? store.userBonuses.find((item) => item.id === bet.bonusId) : undefined;
    if (bonus) { bonus.status = "AVAILABLE"; bonus.usedAt = undefined; bonus.expiresAt = isoAfter(180 * 60_000); }
    if (bonus?.kind !== "FREE_BET") {
      const user = store.users.find((item) => item.id === bet.userId)!;
      user.balance += bet.amount;
      store.transactions.push({ id: randomUUID(), userId: user.id, amount: bet.amount, type: "REFUND", reason: `Отмена: ${event.title}`, balanceAfter: user.balance, operationKey: `cancel:${event.id}:${bet.id}`, createdAt: now });
    }
  }
  event.status = "CANCELLED";
  return clone(event);
}

export function getLeaderboard(): Array<User & { profit: number; wins: number }> {
  return store.users.filter((user) => user.role === "USER").map((user) => {
    const transactions = store.transactions.filter((item) => item.userId === user.id);
    const profit = transactions.filter((item) => item.type !== "INITIAL_BALANCE" && item.type !== "ADMIN_ADJUSTMENT").reduce((sum, item) => sum + item.amount, 0);
    const wins = store.bets.filter((bet) => bet.userId === user.id && bet.status === "WON").length;
    return { ...clone(user), profit, wins };
  }).sort((a, b) => b.profit - a.profit || b.balance - a.balance);
}

export function getNews() { return clone(store.news); }
export function getMarketView(event: MarketEvent) { return marketView(event); }

export function getBonusDefinitions() { return { definitions: clone(store.bonusDefinitions), intervalMinutes: store.spinIntervalMinutes }; }
export function updateBonusSettings(input: { intervalMinutes: number; definitions: Array<{ id: string; weight: number; active: boolean }> }) {
  if (!Number.isInteger(input.intervalMinutes) || input.intervalMinutes < 1) throw new Error("INVALID_INTERVAL");
  if (!input.definitions.some((item) => item.active && item.weight > 0)) throw new Error("EMPTY_WHEEL");
  store.spinIntervalMinutes = input.intervalMinutes;
  for (const update of input.definitions) {
    const definition = store.bonusDefinitions.find((item) => item.id === update.id);
    if (definition) { definition.weight = Math.max(0, Math.floor(update.weight)); definition.active = Boolean(update.active); }
  }
  return getBonusDefinitions();
}

export function createNews(input: { title: string; body: string; emoji?: string }) {
  if (!input.title?.trim() || !input.body?.trim()) throw new Error("INVALID_NEWS");
  const item = { id: randomUUID(), title: input.title.trim(), body: input.body.trim(), emoji: input.emoji?.trim() || "🍋", publishedAt: new Date().toISOString() };
  store.news.unshift(item); return clone(item);
}

export function getSweetLemonzaState(userId: string) {
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  return {
    userId,
    game: LEMONZA_GAME,
    settings: clone(store.slotSettings),
    balance: user.balance,
    history: clone(store.slotRounds.filter((round):round is Extract<AnySlotRound,{gameId:"sweet-lemonza"}> => round.gameId === "sweet-lemonza" && round.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)),
  };
}

export function spinSweetLemonza(input: { userId: string; stake: number; mode: LemonzaMode; idempotencyKey: string }): { round: SlotRound; balance: number } {
  const existingRoundId = store.slotSpinRequests.get(input.idempotencyKey);
  if (existingRoundId) {
    const existing = store.slotRounds.find((round) => round.id === existingRoundId);
    if (!existing || existing.gameId !== "sweet-lemonza" || existing.userId !== input.userId) throw new Error("IDEMPOTENCY_CONFLICT");
    return { round: clone(existing), balance: existing.balanceAfter };
  }
  const user = store.users.find((item) => item.id === input.userId && item.role === "USER" && item.status === "ACTIVE");
  if (!user) throw new Error("USER_UNAVAILABLE");
  if (!store.slotSettings.enabled || !store.slotSettings.spinsEnabled) throw new Error("SLOT_DISABLED");
  if (!(["STANDARD", "LEMON_BOOST", "BONUS_BUY"] as LemonzaMode[]).includes(input.mode)) throw new Error("INVALID_MODE");
  if (input.mode === "LEMON_BOOST" && !store.slotSettings.lemonBoostEnabled) throw new Error("MODE_DISABLED");
  if (input.mode === "BONUS_BUY" && !store.slotSettings.bonusBuyEnabled) throw new Error("MODE_DISABLED");
  if (!Number.isInteger(input.stake) || !store.slotSettings.allowedBets.includes(input.stake) || input.stake < store.slotSettings.minBet || input.stake > store.slotSettings.maxBet) throw new Error("INVALID_STAKE");
  if (store.slotInFlightUsers.has(user.id)) throw new Error("SPIN_IN_PROGRESS");

  store.slotInFlightUsers.add(user.id);
  try {
    const result = runSweetLemonzaRound(input.stake, createCryptoRng(), { captureDetails: true, includeBonus: true, mode: input.mode });
    if (user.balance < result.chargedAmount) throw new Error("INSUFFICIENT_BALANCE");
    const createdAt = new Date().toISOString();
    const balanceBefore = user.balance;
    user.balance -= result.chargedAmount;
    store.transactions.push({
      id: randomUUID(), userId: user.id, amount: -result.chargedAmount, type: "SLOT_BET", reason: `Sweet Lemonza · ${input.mode}`,
      balanceAfter: user.balance, operationKey: `slot:${input.idempotencyKey}:bet`, createdAt,
    });
    if (result.totalPayout > 0) {
      user.balance += result.totalPayout;
      store.transactions.push({
        id: randomUUID(), userId: user.id, amount: result.totalPayout, type: "SLOT_WIN", reason: `Sweet Lemonza · выигрыш ${result.totalPayout}`,
        balanceAfter: user.balance, operationKey: `slot:${input.idempotencyKey}:win`, createdAt,
      });
    }
    const round: SlotRound = {
      id: randomUUID(), gameId: "sweet-lemonza", mathVersion: result.mathVersion, userId: user.id, stake: input.stake, mode: input.mode, chargedAmount: result.chargedAmount,
      baseWin: result.baseGamePayout, scatterWin: result.scatterPayout, bonusWin: result.bonusPayout,
      totalWin: result.totalPayout, balanceBefore, balanceAfter: user.balance, bonusTriggered: result.bonusTriggered,
      maxMultiplier: result.maxMultiplier, idempotencyKey: input.idempotencyKey, result, createdAt,
    };
    store.slotRounds.push(round);
    store.slotSpinRequests.set(input.idempotencyKey, round.id);
    const userRounds = store.slotRounds.filter((item) => item.gameId === "sweet-lemonza" && item.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (userRounds.length > 100) {
      const removeIds = new Set(userRounds.slice(100).map((item) => item.id));
      store.slotRounds = store.slotRounds.filter((item) => !removeIds.has(item.id));
    }
    return { round: clone(round), balance: user.balance };
  } finally {
    store.slotInFlightUsers.delete(user.id);
  }
}

export function getDogHouseState(userId:string){
  const user=store.users.find((item)=>item.id===userId);
  if(!user)throw new Error("USER_NOT_FOUND");
  return{userId,game:DOG_HOUSE_GAME,settings:clone(store.dogHouseSettings),balance:user.balance,history:clone(store.slotRounds.filter((round):round is Extract<AnySlotRound,{gameId:"casa-degli-sposi"}>=>round.gameId==="casa-degli-sposi"&&round.userId===userId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,20))};
}

export function spinDogHouse(input:{userId:string;stake:number;idempotencyKey:string}){
  const existingRoundId=store.slotSpinRequests.get(input.idempotencyKey);
  if(existingRoundId){const existing=store.slotRounds.find((round)=>round.id===existingRoundId);if(!existing||existing.gameId!=="casa-degli-sposi"||existing.userId!==input.userId)throw new Error("IDEMPOTENCY_CONFLICT");return{round:clone(existing),balance:existing.balanceAfter};}
  const user=store.users.find((item)=>item.id===input.userId&&item.role==="USER"&&item.status==="ACTIVE");
  if(!user)throw new Error("USER_UNAVAILABLE");
  if(!store.dogHouseSettings.enabled||!store.dogHouseSettings.spinsEnabled)throw new Error("SLOT_DISABLED");
  if(!Number.isInteger(input.stake)||!store.dogHouseSettings.allowedBets.includes(input.stake))throw new Error("INVALID_STAKE");
  if(store.slotInFlightUsers.has(user.id))throw new Error("SPIN_IN_PROGRESS");
  store.slotInFlightUsers.add(user.id);
  try{
    if(user.balance<input.stake)throw new Error("INSUFFICIENT_BALANCE");
    const result=runDogHouseRound(input.stake,createCryptoRng()),createdAt=new Date().toISOString(),balanceBefore=user.balance;
    user.balance-=input.stake;
    store.transactions.push({id:randomUUID(),userId:user.id,amount:-input.stake,type:"SLOT_BET",reason:"Casa degli Sposi · Spin",balanceAfter:user.balance,operationKey:`slot:${input.idempotencyKey}:bet`,createdAt});
    if(result.totalPayout>0){user.balance+=result.totalPayout;store.transactions.push({id:randomUUID(),userId:user.id,amount:result.totalPayout,type:"SLOT_WIN",reason:`Casa degli Sposi · выигрыш ${result.totalPayout}`,balanceAfter:user.balance,operationKey:`slot:${input.idempotencyKey}:win`,createdAt});}
    const round:Extract<AnySlotRound,{gameId:"casa-degli-sposi"}>={id:randomUUID(),gameId:"casa-degli-sposi",mathVersion:result.mathVersion,userId:user.id,stake:input.stake,mode:"STANDARD",chargedAmount:input.stake,baseWin:result.baseGamePayout,scatterWin:result.bonusScatterPayout,bonusWin:result.bonusPayout,totalWin:result.totalPayout,balanceBefore,balanceAfter:user.balance,bonusTriggered:result.bonusTriggered,maxMultiplier:result.maxMultiplier,idempotencyKey:input.idempotencyKey,result,createdAt};
    store.slotRounds.push(round);store.slotSpinRequests.set(input.idempotencyKey,round.id);
    const userRounds=store.slotRounds.filter((item)=>item.gameId==="casa-degli-sposi"&&item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    if(userRounds.length>100){const removeIds=new Set(userRounds.slice(100).map((item)=>item.id));store.slotRounds=store.slotRounds.filter((item)=>!removeIds.has(item.id));}
    return{round:clone(round),balance:user.balance};
  }finally{store.slotInFlightUsers.delete(user.id);}
}

export function getSweetLemonzaAdminState(query?: string) {
  const rounds = store.slotRounds.filter((round):round is Extract<AnySlotRound,{gameId:"sweet-lemonza"}>=>round.gameId==="sweet-lemonza").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = query ? rounds.filter((round) => round.id.toLowerCase().includes(query.toLowerCase())) : rounds;
  const totalStake = rounds.reduce((sum, round) => sum + (round.chargedAmount ?? round.stake), 0);
  const totalWin = rounds.reduce((sum, round) => sum + round.totalWin, 0);
  return {
    settings: clone(store.slotSettings),
    rounds: clone(filtered.slice(0, 100)),
    analytics: {
      rounds: rounds.length, totalStake, totalWin,
      actualRtp: totalStake > 0 ? totalWin / totalStake : 0,
      bonusFrequency: rounds.length > 0 ? rounds.filter((round) => round.bonusTriggered).length / rounds.length : 0,
      biggestWin: rounds.reduce((max, round) => Math.max(max, round.totalWin), 0),
    },
  };
}

export function updateSweetLemonzaSettings(input: { enabled: boolean; spinsEnabled: boolean; lemonBoostEnabled: boolean; bonusBuyEnabled: boolean; allowedBets: number[] }): SlotOperationalSettings {
  const allowedBets = [...new Set(input.allowedBets)].filter((value) => Number.isInteger(value) && value > 0).sort((a, b) => a - b);
  if (!allowedBets.length || allowedBets.some((value) => !LEMONZA_BETS.includes(value as typeof LEMONZA_BETS[number]))) throw new Error("INVALID_BETS");
  store.slotSettings = {
    gameId: "sweet-lemonza", enabled: Boolean(input.enabled), spinsEnabled: Boolean(input.spinsEnabled),
    allowedBets, minBet: allowedBets[0], maxBet: allowedBets.at(-1)!, lemonBoostEnabled: Boolean(input.lemonBoostEnabled), bonusBuyEnabled: Boolean(input.bonusBuyEnabled),
  };
  return clone(store.slotSettings);
}

export function getDogHouseAdminState(query?:string){const rounds=store.slotRounds.filter((round):round is Extract<AnySlotRound,{gameId:"casa-degli-sposi"}>=>round.gameId==="casa-degli-sposi").sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),filtered=query?rounds.filter((round)=>round.id.toLowerCase().includes(query.toLowerCase())):rounds,totalStake=rounds.reduce((sum,round)=>sum+round.chargedAmount,0),totalWin=rounds.reduce((sum,round)=>sum+round.totalWin,0);return{settings:clone(store.dogHouseSettings),rounds:clone(filtered.slice(0,100)),analytics:{rounds:rounds.length,totalStake,totalWin,actualRtp:totalStake?totalWin/totalStake:0,bonusFrequency:rounds.length?rounds.filter((round)=>round.bonusTriggered).length/rounds.length:0,biggestWin:rounds.reduce((max,round)=>Math.max(max,round.totalWin),0)}};}
export function updateDogHouseSettings(input:{enabled:boolean;spinsEnabled:boolean;allowedBets:number[]}):DogHouseOperationalSettings{const allowedBets=[...new Set(input.allowedBets)].filter((value)=>Number.isInteger(value)&&value>0).sort((a,b)=>a-b);if(!allowedBets.length||allowedBets.some((value)=>!DOG_HOUSE_BETS.includes(value as typeof DOG_HOUSE_BETS[number])))throw new Error("INVALID_BETS");store.dogHouseSettings={gameId:"casa-degli-sposi",enabled:Boolean(input.enabled),spinsEnabled:Boolean(input.spinsEnabled),allowedBets,minBet:allowedBets[0],maxBet:allowedBets.at(-1)!};return clone(store.dogHouseSettings);}
