import type { LemonzaRegularSymbol } from "./types";

export const LEMONZA_MATH_VERSION = "sweet-lemonza-v4";
export const LEMONZA_CALCULATED_RTP = "Standard 95,77% · Lemon Boost 96,56% · покупка бонуса ≈99%";
export const LEMONZA_COLUMNS = 6;
export const LEMONZA_ROWS = 5;
export const LEMONZA_GRID_SIZE = LEMONZA_COLUMNS * LEMONZA_ROWS;
export const LEMONZA_MAX_CASCADES = 100;
export const LEMONZA_MAX_FREE_SPINS = 100;
export const LEMONZA_BOOST_COST_BPS = 12_500;
export const LEMONZA_BONUS_BUY_COST_X = 100;
export const LEMONZA_BONUS_BUY_TRIGGER_SCATTERS = 4;
// Divisible by four so Lemon Boost costs exactly +25% in integer liras.
export const LEMONZA_BETS = [20, 40, 100, 200, 500] as const;

export interface LemonzaSymbolConfig {
  id: LemonzaRegularSymbol;
  title: string;
  /** Multipliers in hundredths for 8–9, 10–11 and 12+. */
  payouts: [number, number, number];
}

export const LEMONZA_SYMBOLS: LemonzaSymbolConfig[] = [
  { id: "LIMONCELLO", title: "Лимончелло", payouts: [1000, 2500, 5000] },
  { id: "RINGS", title: "Кольца", payouts: [250, 1000, 2500] },
  { id: "WINE", title: "Вино", payouts: [200, 500, 1500] },
  { id: "PROSECCO", title: "Просекко", payouts: [150, 200, 1200] },
  { id: "CAKE", title: "Торт", payouts: [100, 150, 1000] },
  { id: "BOUQUET", title: "Букет", payouts: [80, 120, 800] },
  { id: "LEMON", title: "Лимон", payouts: [50, 100, 500] },
  { id: "GRAPES", title: "Виноград", payouts: [40, 90, 400] },
  { id: "OLIVES", title: "Оливки", payouts: [25, 75, 200] },
];

export type LemonzaSymbolWeights = Record<LemonzaRegularSymbol, number> & { SCATTER: number };

// Three explicit, versioned distributions. Boost doubles only the Scatter weight.
export const LEMONZA_BASE_GAME_SYMBOL_WEIGHTS: LemonzaSymbolWeights = {
  LIMONCELLO: 1191, RINGS: 650, WINE: 720, PROSECCO: 800, CAKE: 900,
  BOUQUET: 1000, LEMON: 559, GRAPES: 1440, OLIVES: 1740, SCATTER: 100,
};
export const LEMONZA_BOOST_SYMBOL_WEIGHTS: LemonzaSymbolWeights = {
  ...LEMONZA_BASE_GAME_SYMBOL_WEIGHTS, LIMONCELLO: 1220, LEMON: 530, SCATTER: 240,
};
export const LEMONZA_FREE_SPINS_SYMBOL_WEIGHTS: LemonzaSymbolWeights = {
  LIMONCELLO: 43, RINGS: 45, WINE: 47, PROSECCO: 49, CAKE: 51,
  BOUQUET: 53, LEMON: 55, GRAPES: 57, OLIVES: 59, SCATTER: 10,
};
export const LEMONZA_FREE_SPINS_MULTIPLIER_CHANCE_BPS = 550;
export const LEMONZA_BOOST_FREE_SPINS_MULTIPLIER_CHANCE_BPS = 900;
export const LEMONZA_BONUS_BUY_SYMBOL_WEIGHTS: LemonzaSymbolWeights = {
  ...LEMONZA_BASE_GAME_SYMBOL_WEIGHTS, LIMONCELLO: 1204, LEMON: 546, SCATTER: 100,
};
export const LEMONZA_BONUS_BUY_TRIGGER_SYMBOL_WEIGHTS: LemonzaSymbolWeights = {
  ...LEMONZA_BASE_GAME_SYMBOL_WEIGHTS,
};
export const LEMONZA_BONUS_BUY_MULTIPLIER_CHANCE_BPS = 1250;

export const LEMONZA_MULTIPLIER_WEIGHTS = [
  { value: 2, weight: 300 }, { value: 3, weight: 220 }, { value: 4, weight: 190 },
  { value: 5, weight: 160 }, { value: 6, weight: 125 }, { value: 8, weight: 90 },
  { value: 10, weight: 70 }, { value: 12, weight: 55 }, { value: 15, weight: 40 },
  { value: 20, weight: 25 }, { value: 25, weight: 12 }, { value: 50, weight: 4 },
  { value: 100, weight: 1 },
] as const;

export const LEMONZA_SCATTER_PAYOUTS = { 4: 300, 5: 500, 6: 10_000 } as const;
export const LEMONZA_SYMBOL_META = Object.fromEntries(LEMONZA_SYMBOLS.map((symbol) => [symbol.id, symbol])) as Record<LemonzaRegularSymbol, LemonzaSymbolConfig>;

export const LEMONZA_GAME = {
  id: "sweet-lemonza", title: "Sweet Lemonza", subtitle: "La Dolce Vita Spins",
  description: "Лимонная терраса, свадебные каскады и щедрая синьора Удача.",
  minBet: LEMONZA_BETS[0], mathVersion: LEMONZA_MATH_VERSION,
} as const;
