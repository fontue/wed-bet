import type { DogHouseRegularSymbol, DogHouseSymbol } from "./types";

export const DOG_HOUSE_MATH_VERSION = "casa-degli-sposi-v2";
export const DOG_HOUSE_COLUMNS = 5;
export const DOG_HOUSE_ROWS = 3;
export const DOG_HOUSE_GRID_SIZE = 15;
export const DOG_HOUSE_BETS = [20, 40, 100, 200, 500] as const;
export const DOG_HOUSE_MAX_WIN_X = 6750;

export const DOG_HOUSE_GAME = {
  id: "casa-degli-sposi",
  title: "Casa degli Sposi",
  subtitle: "Lucky Wedding Dogs",
  description:
    "Пять барабанов, двадцать линий и липкие домики-Wild во фриспинах.",
  minBet: DOG_HOUSE_BETS[0],
  mathVersion: DOG_HOUSE_MATH_VERSION,
} as const;

export const DOG_HOUSE_SYMBOLS: Array<{
  id: DogHouseRegularSymbol;
  title: string;
  payouts: [number, number, number];
}> = [
  { id: "BRUNO", title: "Бруно", payouts: [500, 1500, 7500] },
  { id: "BELLA", title: "Белла", payouts: [350, 1000, 5000] },
  { id: "PUG", title: "Мопс", payouts: [250, 600, 3000] },
  { id: "DACHSHUND", title: "Такса", payouts: [200, 400, 2000] },
  { id: "COLLAR", title: "Ошейник", payouts: [120, 250, 1500] },
  { id: "BONE", title: "Косточка", payouts: [80, 200, 1000] },
  { id: "A", title: "A", payouts: [50, 100, 500] },
  { id: "K", title: "K", payouts: [50, 100, 500] },
  { id: "Q", title: "Q", payouts: [20, 50, 250] },
  { id: "J", title: "J", payouts: [20, 50, 250] },
  { id: "TEN", title: "10", payouts: [20, 50, 250] },
];

export const DOG_HOUSE_SYMBOL_META = Object.fromEntries(
  DOG_HOUSE_SYMBOLS.map((item) => [item.id, item]),
) as Record<DogHouseRegularSymbol, (typeof DOG_HOUSE_SYMBOLS)[number]>;

export const DOG_HOUSE_PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 2, 1, 0, 1],
  [1, 0, 1, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [0, 2, 2, 2, 0],
];

export const DOG_HOUSE_BASE_WEIGHTS: Record<DogHouseRegularSymbol, number> = {
  BRUNO: 280,
  BELLA: 320,
  PUG: 400,
  DACHSHUND: 440,
  COLLAR: 600,
  BONE: 680,
  A: 800,
  K: 800,
  Q: 960,
  J: 960,
  TEN: 960,
};
export const DOG_HOUSE_FREE_WEIGHTS: Record<DogHouseRegularSymbol, number> = {
  BRUNO: 280,
  BELLA: 320,
  PUG: 360,
  DACHSHUND: 400,
  COLLAR: 560,
  BONE: 640,
  A: 760,
  K: 760,
  Q: 880,
  J: 880,
  TEN: 880,
};
export const DOG_HOUSE_WILD_WEIGHT = 280;
export const DOG_HOUSE_FREE_WILD_WEIGHT = 120;
export const DOG_HOUSE_BONUS_WEIGHT = 500;
export const DOG_HOUSE_FREE_SPIN_REVEAL_WEIGHTS = [
  { value: 1, weight: 62 },
  { value: 2, weight: 30 },
  { value: 3, weight: 8 },
] as const;
export const DOG_HOUSE_REGULAR_SYMBOLS = DOG_HOUSE_SYMBOLS.map(
  (item) => item.id,
);
export const DOG_HOUSE_WILD_REELS = new Set([1, 2, 3]);
export const DOG_HOUSE_BONUS_REELS = new Set([0, 2, 4]);
export const isDogHouseRegular = (
  symbol: DogHouseSymbol,
): symbol is DogHouseRegularSymbol => symbol !== "WILD" && symbol !== "BONUS";
