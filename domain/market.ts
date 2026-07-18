import type { MarketEvent, Outcome } from "./models";

export interface MarketOutcomeView extends Outcome {
  probabilityBps: number;
  coefficient: number;
}

export interface BetQuote {
  amount: number;
  coefficient: number;
  projectedPayout: number;
  probabilityBps: number;
  projectedTotalPool: number;
  projectedOutcomePool: number;
}

export function totalPool(outcomes: Outcome[]): number {
  return outcomes.reduce((sum, outcome) => sum + outcome.pool, 0);
}

/** Largest-remainder allocation guarantees that displayed probabilities total 100%. */
export function probabilityBasisPoints(outcomes: Outcome[]): Record<string, number> {
  const total = totalPool(outcomes);
  if (total <= 0) {
    return Object.fromEntries(outcomes.map((outcome) => [outcome.id, outcome.initialProbabilityBps]));
  }

  const raw = outcomes.map((outcome) => ({
    id: outcome.id,
    value: (outcome.pool * 10_000) / total,
  }));
  const result = Object.fromEntries(raw.map(({ id, value }) => [id, Math.floor(value)]));
  const remainder = 10_000 - Object.values(result).reduce((sum, value) => sum + value, 0);
  const ranked = [...raw].sort((a, b) => (b.value % 1) - (a.value % 1));

  for (let index = 0; index < remainder; index += 1) {
    result[ranked[index % ranked.length].id] += 1;
  }
  return result;
}

export function marketView(event: MarketEvent): MarketOutcomeView[] {
  const total = totalPool(event.outcomes);
  const probabilities = probabilityBasisPoints(event.outcomes);
  return [...event.outcomes]
    .sort((a, b) => a.order - b.order)
    .map((outcome) => ({
      ...outcome,
      probabilityBps: probabilities[outcome.id],
      coefficient: outcome.pool > 0 ? total / outcome.pool : 0,
    }));
}

/** Quote shows the coefficient this stake creates, not the pre-bet coefficient. */
export function quoteBet(event: MarketEvent, outcomeId: string, amount: number): BetQuote {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("INVALID_AMOUNT");
  const outcome = event.outcomes.find((item) => item.id === outcomeId);
  if (!outcome) throw new Error("OUTCOME_NOT_FOUND");

  const projectedTotalPool = totalPool(event.outcomes) + amount;
  const projectedOutcomePool = outcome.pool + amount;
  const coefficient = projectedTotalPool / projectedOutcomePool;

  return {
    amount,
    coefficient,
    projectedPayout: Math.floor(amount * coefficient),
    probabilityBps: Math.round((projectedOutcomePool / projectedTotalPool) * 10_000),
    projectedTotalPool,
    projectedOutcomePool,
  };
}

export interface SettlementShare {
  betId: string;
  exactPayout: number;
  payout: number;
  fraction: number;
}

/** Distributes the user-facing winning pool with deterministic integer rounding. */
export function allocateWinningPool(
  distributablePool: number,
  winningBets: Array<{ id: string; amount: number }>,
  winningUserPool: number,
): SettlementShare[] {
  if (winningUserPool <= 0 || winningBets.length === 0) return [];
  const shares = winningBets.map((bet) => {
    const exactPayout = (distributablePool * bet.amount) / winningUserPool;
    const payout = Math.floor(exactPayout);
    return { betId: bet.id, exactPayout, payout, fraction: exactPayout - payout };
  });
  const remainder = distributablePool - shares.reduce((sum, share) => sum + share.payout, 0);
  const ranked = [...shares].sort((a, b) => b.fraction - a.fraction || a.betId.localeCompare(b.betId));
  for (let index = 0; index < remainder; index += 1) ranked[index % ranked.length].payout += 1;
  return shares;
}

export function formatCoefficient(value: number): string {
  return value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatProbability(bps: number): string {
  return `${(bps / 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}

export function formatLira(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₤`;
}
