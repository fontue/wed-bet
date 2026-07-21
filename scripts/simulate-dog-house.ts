import { DOG_HOUSE_MATH_VERSION } from "../domain/slots/dog-house/config.ts";
import { runDogHouseRound } from "../domain/slots/dog-house/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";
const arg = (name: string) =>
  process.argv
    .find((item) => item.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const positional = process.argv.slice(2).find((item) => /^\d+$/.test(item)),
  spins = Math.max(1, Number(arg("spins") ?? positional ?? 200_000)),
  seed = arg("seed") ?? "casa-v1",
  json = process.argv.includes("--json"),
  stake = 100,
  rng = createSeededRng(seed);
let wager = 0,
  payout = 0,
  base = 0,
  scatter = 0,
  bonus = 0,
  hits = 0,
  bonusRounds = 0,
  totalFreeSpins = 0,
  totalBonusValue = 0,
  wild2 = 0,
  wild3 = 0,
  maxSticky = 0,
  maxLineMultiplier = 1,
  maxSpin = 0,
  maxRound = 0,
  mean = 0,
  m2 = 0;
const wins: number[] = [],
  freeSpinDistribution = new Map<number, number>(),
  stickyDistribution = new Map<number, number>(),
  lineMultiplierDistribution = new Map<number, number>(),
  buckets: Record<string, number> = {
    "0": 0,
    "0–1X": 0,
    "1–2X": 0,
    "2–5X": 0,
    "5–10X": 0,
    "10–25X": 0,
    "25–50X": 0,
    "50–100X": 0,
    "100X+": 0,
  };
const add = (map: Map<number, number>, value: number) =>
    map.set(value, (map.get(value) ?? 0) + 1),
  bucket = (ratio: number) =>
    ratio === 0
      ? "0"
      : ratio < 1
        ? "0–1X"
        : ratio < 2
          ? "1–2X"
          : ratio < 5
            ? "2–5X"
            : ratio < 10
              ? "5–10X"
              : ratio < 25
                ? "10–25X"
                : ratio < 50
                  ? "25–50X"
                  : ratio < 100
                    ? "50–100X"
                    : "100X+";
for (let index = 0; index < spins; index++) {
  const round = runDogHouseRound(stake, rng),
    ratio = round.totalPayout / stake;
  wager += stake;
  payout += round.totalPayout;
  base += round.baseGamePayout;
  scatter += round.bonusScatterPayout;
  bonus += round.bonusPayout;
  if (round.totalPayout > 0) hits++;
  if (round.bonusTriggered) {
    bonusRounds++;
    totalFreeSpins += round.awardedFreeSpins;
    totalBonusValue += round.bonusScatterPayout + round.bonusPayout;
    add(freeSpinDistribution, round.awardedFreeSpins);
  }
  for (const spin of [round.base, ...round.freeSpins]) {
    maxSpin = Math.max(maxSpin, spin.payout);
    for (const cell of spin.grid)
      if (cell.symbol === "WILD") {
        if (cell.multiplier === 2) wild2++;
        else wild3++;
      }
    for (const win of spin.wins)
      add(lineMultiplierDistribution, win.wildMultiplier);
  }
  const sticky = round.stickyWildCount;
  add(stickyDistribution, sticky);
  maxSticky = Math.max(maxSticky, sticky);
  maxLineMultiplier = Math.max(maxLineMultiplier, round.maxLineMultiplier);
  maxRound = Math.max(maxRound, round.totalPayout);
  wins.push(ratio);
  buckets[bucket(ratio)]++;
  const delta = ratio - mean;
  mean += delta / (index + 1);
  m2 += delta * (ratio - mean);
}
wins.sort((a, b) => a - b);
const percentile = (value: number) =>
    wins[Math.min(wins.length - 1, Math.floor((wins.length - 1) * value))],
  entries = (map: Map<number, number>) =>
    Object.fromEntries([...map.entries()].sort((a, b) => a[0] - b[0]));
const report = {
  mathVersion: DOG_HOUSE_MATH_VERSION,
  seed,
  totalSpins: spins,
  totalWager: wager,
  totalPayout: payout,
  rtp: payout / wager,
  baseRtp: base / wager,
  scatterRtp: scatter / wager,
  bonusRtp: bonus / wager,
  hitFrequency: hits / spins,
  zeroWinShare: buckets["0"] / spins,
  bonusFrequency: bonusRounds / spins,
  averageBonusInterval: bonusRounds ? spins / bonusRounds : null,
  averageBonusValue: bonusRounds ? totalBonusValue / bonusRounds / stake : 0,
  averageFreeSpinsAwarded: bonusRounds ? totalFreeSpins / bonusRounds : 0,
  freeSpinDistribution: entries(freeSpinDistribution),
  wild2Count: wild2,
  wild3Count: wild3,
  stickyWildDistribution: entries(stickyDistribution),
  maximumStickyCount: maxSticky,
  lineMultiplierDistribution: entries(lineMultiplierDistribution),
  maximumLineMultiplier: maxLineMultiplier,
  maximumSpinWinX: maxSpin / stake,
  maximumRoundWinX: maxRound / stake,
  percentiles: {
    p95: percentile(0.95),
    p99: percentile(0.99),
    p999: percentile(0.999),
  },
  winBuckets: buckets,
  rtpStandardError: Math.sqrt(m2 / Math.max(1, spins - 1) / spins),
};
if (json) console.log(JSON.stringify(report));
else console.log(JSON.stringify(report, null, 2));
