export type LemonzaRegularSymbol =
  | "LIMONCELLO"
  | "RINGS"
  | "WINE"
  | "PROSECCO"
  | "CAKE"
  | "BOUQUET"
  | "LEMON"
  | "GRAPES"
  | "OLIVES";
export type LemonzaSymbol = LemonzaRegularSymbol | "SCATTER" | "MULTIPLIER";
export type LemonzaMode = "STANDARD" | "LEMON_BOOST" | "BONUS_BUY";

export interface LemonzaCell {
  id: number;
  symbol: LemonzaSymbol;
  multiplier?: number;
}
export interface LemonzaWin {
  symbol: LemonzaRegularSymbol;
  count: number;
  payout: number;
  payoutHundredths: number;
}
export interface LemonzaCascade {
  grid: LemonzaCell[];
  wins: LemonzaWin[];
  removedIndices: number[];
  newSymbols: Array<{ index: number; cell: LemonzaCell }>;
  nextGrid: LemonzaCell[];
  payout: number;
}
export interface LemonzaPlay {
  initialGrid: LemonzaCell[];
  finalGrid: LemonzaCell[];
  cascades: LemonzaCascade[];
  scatterCount: number;
  scatterPayout: number;
  awardedFreeSpins: number;
  collectedMultipliers: number[];
  appliedMultiplier: number;
  clusterPayout: number;
  totalPayout: number;
  cascadeLimitReached: boolean;
}
export interface LemonzaRoundResult {
  mathVersion: string;
  mode: LemonzaMode;
  stake: number;
  chargedAmount: number;
  base?: LemonzaPlay;
  freeSpins: LemonzaPlay[];
  totalFreeSpinsPlayed: number;
  baseGamePayout: number;
  scatterPayout: number;
  bonusPayout: number;
  totalPayout: number;
  maxMultiplier: number;
  totalCascades: number;
  bonusTriggered: boolean;
  safetyLimitReached: boolean;
}
export interface LemonzaRng {
  int(maxExclusive: number): number;
}
export interface LemonzaEngineOptions {
  captureDetails?: boolean;
  includeBonus?: boolean;
  mode?: LemonzaMode;
}
