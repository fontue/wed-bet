import { createHash, randomInt, randomUUID } from "node:crypto";
import { seedBets, seedBonusDefinitions, seedEvents, seedNews, seedTransactions, seedUsers } from "@/data/seed";
import { marketView, quoteBet, totalPool } from "@/domain/market";
import type {
  Bet,
  BonusSpin,
  LoginToken,
  MarketEvent,
  Session,
  User,
  UserBonus,
  WalletTransaction,
} from "@/domain/models";

const SPIN_INTERVAL_MS = 30 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface MockState {
  users: User[];
  events: MarketEvent[];
  bets: Bet[];
  transactions: WalletTransaction[];
  bonusDefinitions: typeof seedBonusDefinitions;
  spinIntervalMinutes: number;
  userBonuses: UserBonus[];
  spins: BonusSpin[];
  news: typeof seedNews;
  loginTokens: LoginToken[];
  sessions: Session[];
  betRequests: Map<string, string>;
  spinRequests: Map<string, string>;
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const clone = <T,>(value: T): T => structuredClone(value);
const isoAfter = (milliseconds: number) => new Date(Date.now() + milliseconds).toISOString();

function initialState(): MockState {
  return {
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
    loginTokens: process.env.NODE_ENV === "production" ? [] : [
      { id: "lt-guest", userId: "u-sofia", tokenHash: hash("guest-demo"), expiresAt: isoAfter(365 * 24 * 60 * 60 * 1000) },
      { id: "lt-admin", userId: "u-admin", tokenHash: hash("admin-demo"), expiresAt: isoAfter(365 * 24 * 60 * 60 * 1000) },
    ],
    sessions: [],
    betRequests: new Map(),
    spinRequests: new Map(),
  };
}

const globalStore = globalThis as typeof globalThis & { __wedBetMockStore?: MockState };
export const store = globalStore.__wedBetMockStore ?? initialState();
if (process.env.NODE_ENV !== "production") globalStore.__wedBetMockStore = store;

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
  if (process.env.NODE_ENV === "production") throw new Error("DEMO_LOGIN_DISABLED");
  const userId = rawToken === "guest-demo" ? "u-sofia" : rawToken === "admin-demo" ? "u-admin" : undefined;
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
