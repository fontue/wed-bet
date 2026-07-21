import assert from "node:assert/strict";
import {
  DOG_HOUSE_BONUS_REELS,
  DOG_HOUSE_PAYLINES,
  DOG_HOUSE_SYMBOLS,
  DOG_HOUSE_WILD_REELS,
} from "../domain/slots/dog-house/config.ts";
import {
  evaluateDogHouseLines,
  generateDogHouseGrid,
  runDogHouseRound,
} from "../domain/slots/dog-house/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";
import {
  BASE_PRESENTATION_STRIPS,
  FREE_SPIN_PRESENTATION_STRIPS,
} from "../components/slots/dog-house/animation/presentation-strips.ts";
import type { DogHouseCell } from "../domain/slots/dog-house/types.ts";
import {
  getDogHouseState,
  spinDogHouse,
} from "../infrastructure/mock/store.ts";
const cell = (
  id: number,
  symbol: DogHouseCell["symbol"],
  multiplier?: 2 | 3,
): DogHouseCell => ({ id, symbol, ...(multiplier ? { multiplier } : {}) });
const blank = (symbol: DogHouseCell["symbol"] = "BONUS") =>
  Array.from({ length: 15 }, (_, index) => cell(index + 1, symbol));
const putLine = (
  grid: DogHouseCell[],
  line: number,
  symbol: DogHouseCell["symbol"],
  wilds: Record<number, 2 | 3> = {},
) =>
  DOG_HOUSE_PAYLINES[line].forEach((row, reel) => {
    const index = row * 5 + reel;
    grid[index] = wilds[reel]
      ? cell(index + 1, "WILD", wilds[reel])
      : cell(index + 1, symbol);
  });
async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}
await test("определены ровно 20 корректных линий", () => {
  assert.equal(DOG_HOUSE_PAYLINES.length, 20);
  for (const line of DOG_HOUSE_PAYLINES) {
    assert.equal(line.length, 5);
    assert.ok(line.every((row) => row >= 0 && row < 3));
  }
});
await test("3, 4 и 5 соседних символов платят только старшую комбинацию", () => {
  for (const count of [3, 4, 5] as const) {
    const grid = blank();
    putLine(grid, 0, "BRUNO");
    for (let reel = count; reel < 5; reel++)
      grid[5 + reel] = cell(6 + reel, "BELLA");
    const win = evaluateDogHouseLines(grid, 100).find(
      (item) => item.line === 1,
    )!;
    assert.equal(win.count, count);
    assert.equal(win.payoutHundredths, DOG_HOUSE_SYMBOLS[0].payouts[count - 3]);
  }
});
await test("разрыв на соседнем барабане прекращает линию", () => {
  const grid = blank();
  putLine(grid, 0, "BRUNO");
  grid[7] = cell(8, "BELLA");
  assert.equal(
    evaluateDogHouseLines(grid, 100).some((win) => win.line === 1),
    false,
  );
});
await test("Wild 2X и 3X складываются, а base payout сохраняется отдельно", () => {
  const grid = blank();
  putLine(grid, 0, "BRUNO", { 1: 2, 3: 3 });
  const win = evaluateDogHouseLines(grid, 100).find((item) => item.line === 1)!;
  assert.equal(win.wildMultiplier, 5);
  assert.deepEqual(win.wildPositions, [6, 8]);
  assert.equal(win.basePayout, 7_500);
  assert.equal(win.payout, 37_500);
});
await test("три участвующих Wild складываются", () => {
  const grid = blank();
  putLine(grid, 0, "BRUNO", { 1: 2, 2: 3, 3: 3 });
  const win = evaluateDogHouseLines(grid, 100).find((item) => item.line === 1)!;
  assert.deepEqual(win.wildMultipliers, [2, 3, 3]);
  assert.equal(win.wildMultiplier, 8);
  assert.equal(win.payout, win.basePayout * 8);
});
await test("один Sticky Wild влияет на пересекающиеся линии независимо", () => {
  const grid = Array.from({ length: 15 }, (_, index) =>
    cell(index + 1, "BRUNO"),
  );
  grid[6] = cell(7, "WILD", 3);
  const wins = evaluateDogHouseLines(grid, 100).filter((win) =>
    win.wildPositions.includes(6),
  );
  assert.ok(wins.length > 1);
  for (const win of wins) {
    assert.equal(win.wildMultiplier, 3);
    assert.equal(win.payout, win.basePayout * 3);
  }
});
await test("не участвующий Wild не влияет на линию", () => {
  const grid = blank();
  putLine(grid, 0, "BRUNO", { 1: 2 });
  grid[0] = cell(1, "WILD", 3);
  const win = evaluateDogHouseLines(grid, 100).find((item) => item.line === 1)!;
  assert.equal(win.wildMultiplier, 2);
});
await test("Bonus не является обычным символом и не заменяется Wild", () => {
  const grid = blank("BONUS");
  grid[1] = cell(2, "WILD", 3);
  grid[2] = cell(3, "WILD", 2);
  assert.equal(evaluateDogHouseLines(grid, 100).length, 0);
});
await test("paytable эквивалентна bet-per-line при 20 линиях", () => {
  const expected: Record<string, [number, number, number]> = {
    BRUNO: [100, 300, 1500],
    BELLA: [70, 200, 1000],
    PUG: [50, 120, 600],
    DACHSHUND: [40, 80, 400],
    COLLAR: [24, 50, 300],
    BONE: [16, 40, 200],
    A: [10, 20, 100],
    K: [10, 20, 100],
    Q: [4, 10, 50],
    J: [4, 10, 50],
    TEN: [4, 10, 50],
  };
  for (const symbol of DOG_HOUSE_SYMBOLS)
    assert.deepEqual(
      symbol.payouts,
      expected[symbol.id].map((value) => value * 5),
    );
});
await test("base/free ограничения символов и отсутствие retrigger соблюдаются", () => {
  for (let index = 0; index < 1_000; index++) {
    const base = generateDogHouseGrid(createSeededRng(`base-${index}`));
    base.forEach((item, cellIndex) => {
      const reel = cellIndex % 5;
      if (item.symbol === "WILD") assert.ok(DOG_HOUSE_WILD_REELS.has(reel));
      if (item.symbol === "BONUS") assert.ok(DOG_HOUSE_BONUS_REELS.has(reel));
    });
    const free = generateDogHouseGrid(createSeededRng(`free-${index}`), true);
    assert.ok(free.every((item) => item.symbol !== "BONUS"));
  }
});
await test("presentation strips соблюдают base/free ограничения", () => {
  BASE_PRESENTATION_STRIPS.forEach((strip, reel) =>
    strip.forEach((symbol) => {
      if (symbol === "BONUS") assert.ok(DOG_HOUSE_BONUS_REELS.has(reel));
      if (symbol === "WILD") assert.ok(DOG_HOUSE_WILD_REELS.has(reel));
    }),
  );
  FREE_SPIN_PRESENTATION_STRIPS.forEach((strip, reel) =>
    strip.forEach((symbol) => {
      assert.notEqual(symbol, "BONUS");
      if (symbol === "WILD") assert.ok(DOG_HOUSE_WILD_REELS.has(reel));
    }),
  );
});
await test("три Bonus платят 5X общей ставки и запускают feature", () => {
  let found;
  for (let index = 0; index < 10_000 && !found; index++) {
    const candidate = runDogHouseRound(
      100,
      createSeededRng(`bonus-payout-${index}`),
      { includeBonus: false },
    );
    if (candidate.bonusTriggered) found = candidate;
  }
  assert.ok(found);
  assert.equal(found.bonusScatterPayout, 500);
  assert.equal(found.base.bonusCount, 3);
  assert.equal(
    found.awardedFreeSpins,
    found.freeSpinReveal.reduce((sum, value) => sum + value, 0),
  );
});
await test("reveal всегда содержит девять значений 1–3 и сумму 9–27", () => {
  for (let index = 0; index < 2_000; index++) {
    const round = runDogHouseRound(100, createSeededRng(`dog-${index}`));
    assert.ok(
      round.awardedFreeSpins === 0 ||
        (round.freeSpinReveal.length === 9 &&
          round.freeSpinReveal.every((value) => value >= 1 && value <= 3) &&
          round.awardedFreeSpins >= 9 &&
          round.awardedFreeSpins <= 27),
    );
    assert.ok(round.freeSpins.every((spin) => spin.bonusCount === 0));
    assert.ok(Number.isSafeInteger(round.totalPayout));
    assert.ok(round.totalPayout <= 675_000);
  }
});
await test("Sticky Wild сохраняет позицию и multiplier", () => {
  for (let seed = 0; seed < 2_000; seed++) {
    const round = runDogHouseRound(100, createSeededRng(`sticky-${seed}`));
    for (let index = 1; index < round.freeSpins.length; index++) {
      const previous = round.freeSpins[index - 1].stickyWilds;
      for (const sticky of previous) {
        const current = round.freeSpins[index].stickyWilds.find(
          (item) => item.index === sticky.index,
        );
        assert.deepEqual(current, sticky);
      }
    }
  }
});
await test("Spin идемпотентен и история не дублируется", () => {
  const key = `dog-house-idempotency-${Date.now()}`,
    before = getDogHouseState("u-sofia"),
    first = spinDogHouse({ userId: "u-sofia", stake: 20, idempotencyKey: key }),
    repeat = spinDogHouse({
      userId: "u-sofia",
      stake: 20,
      idempotencyKey: key,
    }),
    after = getDogHouseState("u-sofia");
  assert.equal(first.round.id, repeat.round.id);
  assert.equal(first.balance, repeat.balance);
  assert.equal(after.history.length, before.history.length + 1);
  assert.equal(first.round.chargedAmount, 20);
});
await test("старый result JSON без новых presentation-полей остаётся читаемым", () => {
  const result = runDogHouseRound(100, createSeededRng("legacy-dog-house"), {
      includeBonus: false,
    }),
    legacy = JSON.parse(JSON.stringify(result));
  for (const win of legacy.base.wins) delete win.wildMultipliers;
  assert.equal(legacy.mathVersion, "casa-degli-sposi-v2");
  assert.ok(Array.isArray(legacy.base.grid));
});
console.log("Все проверки Casa degli Sposi пройдены.");
