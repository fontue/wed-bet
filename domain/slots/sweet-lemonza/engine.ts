import {
  LEMONZA_BASE_GAME_SYMBOL_WEIGHTS, LEMONZA_BONUS_BUY_COST_X, LEMONZA_BONUS_BUY_MULTIPLIER_CHANCE_BPS, LEMONZA_BONUS_BUY_SYMBOL_WEIGHTS,
  LEMONZA_BONUS_BUY_TRIGGER_SCATTERS, LEMONZA_BONUS_BUY_TRIGGER_SYMBOL_WEIGHTS, LEMONZA_BOOST_COST_BPS,
  LEMONZA_BOOST_FREE_SPINS_MULTIPLIER_CHANCE_BPS, LEMONZA_BOOST_SYMBOL_WEIGHTS, LEMONZA_COLUMNS, LEMONZA_FREE_SPINS_MULTIPLIER_CHANCE_BPS,
  LEMONZA_FREE_SPINS_SYMBOL_WEIGHTS, LEMONZA_GRID_SIZE, LEMONZA_MATH_VERSION,
  LEMONZA_MAX_CASCADES, LEMONZA_MAX_FREE_SPINS, LEMONZA_MULTIPLIER_WEIGHTS, LEMONZA_ROWS,
  LEMONZA_SCATTER_PAYOUTS, LEMONZA_SYMBOL_META,
} from "./config";
import { applyFreeSpinMultiplier } from "./math";
import type { LemonzaCascade, LemonzaCell, LemonzaEngineOptions, LemonzaMode, LemonzaPlay, LemonzaRegularSymbol, LemonzaRng, LemonzaRoundResult, LemonzaWin } from "./types";

interface EngineContext { rng: LemonzaRng; nextCellId: number; freeSpin: boolean; mode: LemonzaMode; captureDetails: boolean }
const REGULAR_SYMBOLS: LemonzaRegularSymbol[] = ["LIMONCELLO", "RINGS", "WINE", "PROSECCO", "CAKE", "BOUQUET", "LEMON", "GRAPES", "OLIVES"];
const MULTIPLIER_TOTAL = LEMONZA_MULTIPLIER_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);

function weightedChoice<T>(entries: readonly { value: T; weight: number }[], rng: LemonzaRng): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let draw = rng.int(total);
  for (const entry of entries) { draw -= entry.weight; if (draw < 0) return entry.value; }
  return entries.at(-1)!.value;
}

function createCell(context: EngineContext): LemonzaCell {
  const multiplierChance = context.mode === "BONUS_BUY" ? LEMONZA_BONUS_BUY_MULTIPLIER_CHANCE_BPS : context.mode === "LEMON_BOOST" ? LEMONZA_BOOST_FREE_SPINS_MULTIPLIER_CHANCE_BPS : LEMONZA_FREE_SPINS_MULTIPLIER_CHANCE_BPS;
  if (context.freeSpin && context.rng.int(10_000) < multiplierChance) {
    let draw = context.rng.int(MULTIPLIER_TOTAL);
    let multiplier = LEMONZA_MULTIPLIER_WEIGHTS.at(-1)!.value;
    for (const item of LEMONZA_MULTIPLIER_WEIGHTS) { draw -= item.weight; if (draw < 0) { multiplier = item.value; break; } }
    return { id: context.nextCellId++, symbol: "MULTIPLIER", multiplier };
  }
  const weights = context.freeSpin
    ? (context.mode === "BONUS_BUY" ? LEMONZA_BONUS_BUY_SYMBOL_WEIGHTS : LEMONZA_FREE_SPINS_SYMBOL_WEIGHTS)
    : context.mode === "BONUS_BUY"
      ? LEMONZA_BONUS_BUY_TRIGGER_SYMBOL_WEIGHTS
      : context.mode === "LEMON_BOOST"
        ? LEMONZA_BOOST_SYMBOL_WEIGHTS
        : LEMONZA_BASE_GAME_SYMBOL_WEIGHTS;
  const symbol = weightedChoice([
    ...REGULAR_SYMBOLS.map((value) => ({ value: value as LemonzaCell["symbol"], weight: weights[value] })),
    { value: "SCATTER" as const, weight: weights.SCATTER },
  ], context.rng);
  return { id: context.nextCellId++, symbol };
}

export function generateLemonzaGrid(context: EngineContext): LemonzaCell[] {
  return Array.from({ length: LEMONZA_GRID_SIZE }, () => createCell(context));
}

function payoutBand(count: number): number { return count >= 12 ? 2 : count >= 10 ? 1 : 0; }

export function evaluateLemonzaWins(grid: LemonzaCell[], stake: number): LemonzaWin[] {
  const counts = new Map<LemonzaRegularSymbol, number>();
  for (const cell of grid) if (cell.symbol !== "SCATTER" && cell.symbol !== "MULTIPLIER") counts.set(cell.symbol, (counts.get(cell.symbol) ?? 0) + 1);
  const wins: LemonzaWin[] = [];
  for (const [symbol, count] of counts) {
    if (count < 8) continue;
    const payoutHundredths = LEMONZA_SYMBOL_META[symbol].payouts[payoutBand(count)];
    wins.push({ symbol, count, payoutHundredths, payout: Math.floor(stake * payoutHundredths / 100) });
  }
  return wins;
}

export function applyLemonzaTumble(grid: LemonzaCell[], wins: LemonzaWin[], context: EngineContext) {
  const winningSymbols = new Set(wins.map((win) => win.symbol));
  const removedIndices = grid.map((cell, index) => winningSymbols.has(cell.symbol as LemonzaRegularSymbol) ? index : -1).filter((index) => index >= 0);
  const removed = new Set(removedIndices);
  const nextGrid = Array<LemonzaCell>(LEMONZA_GRID_SIZE);
  const newSymbols: Array<{ index: number; cell: LemonzaCell }> = [];
  for (let column = 0; column < LEMONZA_COLUMNS; column += 1) {
    const kept: LemonzaCell[] = [];
    for (let row = 0; row < LEMONZA_ROWS; row += 1) { const index = row * LEMONZA_COLUMNS + column; if (!removed.has(index)) kept.push(grid[index]); }
    const missing = LEMONZA_ROWS - kept.length;
    const columnCells = [...Array.from({ length: missing }, () => createCell(context)), ...kept];
    for (let row = 0; row < LEMONZA_ROWS; row += 1) { const index = row * LEMONZA_COLUMNS + column; nextGrid[index] = columnCells[row]; if (row < missing) newSymbols.push({ index, cell: columnCells[row] }); }
  }
  return { nextGrid, newSymbols, removedIndices };
}

function safeScatterCount(grid: LemonzaCell[]): number { return Math.max(0, Math.min(LEMONZA_GRID_SIZE, grid.filter((cell) => cell.symbol === "SCATTER").length)); }
function baseScatterPayoutHundredths(count: number): number { return count >= 6 ? LEMONZA_SCATTER_PAYOUTS[6] : count === 5 ? LEMONZA_SCATTER_PAYOUTS[5] : count === 4 ? LEMONZA_SCATTER_PAYOUTS[4] : 0; }
export function evaluateLemonzaBaseScatter(stake: number, count: number) { const safeCount = Math.max(0, Math.min(LEMONZA_GRID_SIZE, Math.floor(count))); return { count: safeCount, payout: Math.floor(stake * baseScatterPayoutHundredths(safeCount) / 100), freeSpins: safeCount >= 4 ? 10 : 0 }; }
export function evaluateLemonzaFreeSpinRetrigger(count: number) { return Math.max(0, Math.min(LEMONZA_GRID_SIZE, Math.floor(count))) >= 3 ? 5 : 0; }

function guaranteedBonusTriggerGrid(context: EngineContext): LemonzaCell[] {
  const grid = generateLemonzaGrid(context);
  const candidates = grid.flatMap((cell, index) => cell.symbol === "SCATTER" ? [] : [index]);
  let missing = Math.max(0, LEMONZA_BONUS_BUY_TRIGGER_SCATTERS - safeScatterCount(grid));
  while (missing > 0 && candidates.length > 0) {
    const candidateIndex = context.rng.int(candidates.length);
    const [gridIndex] = candidates.splice(candidateIndex, 1);
    grid[gridIndex] = { id: grid[gridIndex].id, symbol: "SCATTER" };
    missing -= 1;
  }
  return grid;
}

function runPlay(stake: number, context: EngineContext, preparedGrid?: LemonzaCell[]): LemonzaPlay {
  const initialGrid = preparedGrid ?? generateLemonzaGrid(context);
  const cascades: LemonzaCascade[] = [];
  let grid = initialGrid;
  let clusterPayout = 0;
  let cascadeLimitReached = false;
  for (let index = 0; index < LEMONZA_MAX_CASCADES; index += 1) {
    const wins = evaluateLemonzaWins(grid, stake);
    if (!wins.length) break;
    const payout = wins.reduce((sum, win) => sum + win.payout, 0);
    clusterPayout += payout;
    const tumble = applyLemonzaTumble(grid, wins, context);
    cascades.push({ grid: context.captureDetails ? grid : [], wins, removedIndices: tumble.removedIndices, newSymbols: context.captureDetails ? tumble.newSymbols : [], nextGrid: context.captureDetails ? tumble.nextGrid : [], payout });
    grid = tumble.nextGrid;
    if (index === LEMONZA_MAX_CASCADES - 1 && evaluateLemonzaWins(grid, stake).length) cascadeLimitReached = true;
  }
  const scatterCount = safeScatterCount(grid);
  const baseScatter = evaluateLemonzaBaseScatter(stake, scatterCount);
  const scatterPayout = context.freeSpin ? 0 : baseScatter.payout;
  const awardedFreeSpins = context.freeSpin ? evaluateLemonzaFreeSpinRetrigger(scatterCount) : baseScatter.freeSpins;
  const collectedMultipliers = context.freeSpin ? grid.filter((cell) => cell.symbol === "MULTIPLIER" && cell.multiplier).map((cell) => cell.multiplier!) : [];
  const appliedMultiplier = collectedMultipliers.length ? collectedMultipliers.reduce((sum, value) => sum + value, 0) : 1;
  return {
    initialGrid: context.captureDetails ? initialGrid : [], finalGrid: context.captureDetails ? grid : [], cascades,
    scatterCount, scatterPayout, awardedFreeSpins, collectedMultipliers, appliedMultiplier, clusterPayout,
    totalPayout: context.freeSpin ? applyFreeSpinMultiplier(clusterPayout, appliedMultiplier) : clusterPayout + scatterPayout,
    cascadeLimitReached,
  };
}

export function runSweetLemonzaRound(stake: number, rng: LemonzaRng, options: LemonzaEngineOptions = {}): LemonzaRoundResult {
  if (!Number.isSafeInteger(stake) || stake <= 0) throw new Error("INVALID_STAKE");
  const mode: LemonzaMode = options.mode ?? "STANDARD";
  const captureDetails = options.captureDetails ?? true;
  const includeBonus = options.includeBonus ?? true;
  const chargedAmount = mode === "BONUS_BUY" ? stake * LEMONZA_BONUS_BUY_COST_X : mode === "LEMON_BOOST" ? Math.ceil(stake * LEMONZA_BOOST_COST_BPS / 10_000) : stake;
  const context: EngineContext = { rng, nextCellId: 1, freeSpin: false, mode, captureDetails };
  const base = mode === "BONUS_BUY" ? runPlay(stake, context, guaranteedBonusTriggerGrid(context)) : runPlay(stake, context);
  const freeSpins: LemonzaPlay[] = [];
  let remaining = includeBonus ? base.awardedFreeSpins : 0;
  let awardedTotal = remaining;
  let freeSpinAwardTruncated = false;
  context.freeSpin = true;
  while (remaining > 0 && freeSpins.length < LEMONZA_MAX_FREE_SPINS) {
    remaining -= 1;
    const play = runPlay(stake, context);
    freeSpins.push(play);
    const awarded = Math.min(play.awardedFreeSpins, LEMONZA_MAX_FREE_SPINS - awardedTotal);
    if (awarded < play.awardedFreeSpins) freeSpinAwardTruncated = true;
    awardedTotal += awarded;
    remaining += awarded;
  }
  const freeSpinLimitReached = remaining > 0 || freeSpinAwardTruncated;
  const bonusPayout = freeSpins.reduce((sum, play) => sum + play.totalPayout, 0);
  const baseGamePayout = base?.clusterPayout ?? 0;
  const scatterPayout = base?.scatterPayout ?? 0;
  return {
    mathVersion: LEMONZA_MATH_VERSION, mode, stake, chargedAmount, base, freeSpins,
    totalFreeSpinsPlayed: freeSpins.length, baseGamePayout, scatterPayout, bonusPayout,
    totalPayout: baseGamePayout + scatterPayout + bonusPayout,
    maxMultiplier: Math.max(1, ...freeSpins.map((play) => play.appliedMultiplier)),
    totalCascades: (base?.cascades.length ?? 0) + freeSpins.reduce((sum, play) => sum + play.cascades.length, 0),
    bonusTriggered: Boolean(base.awardedFreeSpins),
    safetyLimitReached: freeSpinLimitReached || Boolean(base?.cascadeLimitReached) || freeSpins.some((play) => play.cascadeLimitReached),
  };
}
