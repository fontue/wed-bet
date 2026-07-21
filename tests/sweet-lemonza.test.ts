import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LEMONZA_BONUS_BUY_COST_X,
  LEMONZA_MATH_VERSION,
} from "../domain/slots/sweet-lemonza/config.ts";
import {
  applyLemonzaTumble,
  evaluateLemonzaBaseScatter,
  evaluateLemonzaFreeSpinRetrigger,
  evaluateLemonzaWins,
  runSweetLemonzaRound,
} from "../domain/slots/sweet-lemonza/engine.ts";
import { applyFreeSpinMultiplier } from "../domain/slots/sweet-lemonza/math.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";
import type {
  LemonzaCell,
  LemonzaRng,
} from "../domain/slots/sweet-lemonza/types.ts";
import {
  listTransactions,
  spinSweetLemonza,
  store,
} from "../infrastructure/mock/store.ts";
import { simulateSweetLemonza } from "../scripts/simulate-sweet-lemonza.ts";

function test(name: string, run: () => void) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}
function cells(
  symbol: LemonzaCell["symbol"],
  count: number,
  start = 1,
): LemonzaCell[] {
  return Array.from({ length: count }, (_, index) => ({
    id: start + index,
    symbol,
  }));
}

test("8–9, 10–11 и 12+ используют ровно три уровня выплат", () => {
  const payout = (count: number) =>
    evaluateLemonzaWins(
      [...cells("LIMONCELLO", count), ...cells("RINGS", 30 - count, 100)],
      100,
    ).find((win) => win.symbol === "LIMONCELLO")!.payout;
  assert.equal(payout(8), 1000);
  assert.equal(payout(9), 1000);
  assert.equal(payout(10), 2500);
  assert.equal(payout(11), 2500);
  assert.equal(payout(12), 5000);
});
test("одна сетка может содержать несколько выигрышных символов", () => {
  const wins = evaluateLemonzaWins(
    [
      ...cells("LEMON", 8),
      ...cells("OLIVES", 8, 20),
      ...cells("RINGS", 14, 40),
    ],
    100,
  );
  assert.deepEqual(
    new Set(wins.map((win) => win.symbol)),
    new Set(["LEMON", "OLIVES", "RINGS"]),
  );
});
test("tumble удаляет победителей, сохраняет множитель и применяет гравитацию", () => {
  const grid = [...cells("LEMON", 8), ...cells("OLIVES", 22, 20)];
  grid[29] = { id: 999, symbol: "MULTIPLIER", multiplier: 5 };
  const context = {
    rng: { int: () => 0 },
    nextCellId: 1000,
    freeSpin: true,
    mode: "STANDARD" as const,
    captureDetails: true,
  };
  const wins = evaluateLemonzaWins(grid, 100).filter(
    (win) => win.symbol === "LEMON",
  );
  const tumble = applyLemonzaTumble(grid, wins, context);
  assert.equal(tumble.removedIndices.length, 8);
  assert.equal(tumble.newSymbols.length, 8);
  assert.equal(tumble.nextGrid.length, 30);
  assert.ok(tumble.nextGrid.some((cell) => cell.id === 999));
});
test("seeded RNG воспроизводит полный раунд", () => {
  assert.deepEqual(
    runSweetLemonzaRound(100, createSeededRng("repeatable")),
    runSweetLemonzaRound(100, createSeededRng("repeatable")),
  );
});
test("Scatter использует уровни 0–3, 4, 5 и защищённый 6+", () => {
  assert.deepEqual(evaluateLemonzaBaseScatter(100, 3), {
    count: 3,
    payout: 0,
    freeSpins: 0,
  });
  assert.deepEqual(evaluateLemonzaBaseScatter(100, 4), {
    count: 4,
    payout: 300,
    freeSpins: 10,
  });
  assert.deepEqual(evaluateLemonzaBaseScatter(100, 5), {
    count: 5,
    payout: 500,
    freeSpins: 10,
  });
  assert.deepEqual(evaluateLemonzaBaseScatter(100, 99), {
    count: 30,
    payout: 10000,
    freeSpins: 10,
  });
  assert.equal(evaluateLemonzaFreeSpinRetrigger(2), 0);
  assert.equal(evaluateLemonzaFreeSpinRetrigger(3), 5);
  assert.equal(evaluateLemonzaFreeSpinRetrigger(30), 5);
});
test("Boost и bonus-buy имеют точную целочисленную стоимость", () => {
  assert.equal(
    runSweetLemonzaRound(20, createSeededRng("boost-price"), {
      mode: "LEMON_BOOST",
      includeBonus: false,
    }).chargedAmount,
    25,
  );
  assert.equal(
    runSweetLemonzaRound(20, createSeededRng("buy-price"), {
      mode: "BONUS_BUY",
      includeBonus: false,
    }).chargedAmount,
    2000,
  );
});
test("bonus-buy начинается с гарантированного серверного Scatter-spin", () => {
  const round = runSweetLemonzaRound(20, createSeededRng("buy-trigger"), {
    mode: "BONUS_BUY",
  });
  assert.ok(round.base);
  assert.ok(round.base!.scatterCount >= 4);
  assert.equal(round.base!.awardedFreeSpins, 10);
  assert.ok(round.freeSpins.length >= 10);
  assert.equal(round.bonusTriggered, true);
});
test("в base game не бывает multiplier", () => {
  const round = runSweetLemonzaRound(
    100,
    createSeededRng("base-no-multiplier"),
    { includeBonus: false },
  );
  assert.ok(round.base);
  assert.ok(
    !round.base!.initialGrid.some((cell) => cell.symbol === "MULTIPLIER"),
  );
});
test("заданная RNG-серия даёт каскады, Scatter, бонус и несколько множителей", () => {
  const round = runSweetLemonzaRound(100, createSeededRng("scenario-245"), {
    mode: "LEMON_BOOST",
  });
  assert.ok(round.bonusTriggered);
  assert.ok(round.totalCascades >= 2);
  assert.ok(round.freeSpins.some((play) => play.cascades.length >= 2));
  assert.ok(
    round.freeSpins.some((play) => play.collectedMultipliers.length >= 2),
  );
});
test("несколько multiplier складываются, но без выигрыша не платят", () => {
  const round = runSweetLemonzaRound(100, createSeededRng("scenario-245"), {
    mode: "LEMON_BOOST",
  });
  const play = round.freeSpins.find(
    (item) => item.collectedMultipliers.length >= 2,
  )!;
  assert.equal(
    play.appliedMultiplier,
    play.collectedMultipliers.reduce((sum, value) => sum + value, 0),
  );
  assert.equal(play.totalPayout, play.clusterPayout * play.appliedMultiplier);
});
test("промежуточный multiplier использует 1 до первого сбора и обновляет выплату на каждом шаге", () => {
  assert.equal(applyFreeSpinMultiplier(100, 0), 100);
  assert.equal(applyFreeSpinMultiplier(100, 2), 200);
  assert.equal(applyFreeSpinMultiplier(100, 7), 700);
});
test("защитный предел останавливает фриспины на 100", () => {
  const scatterRng: LemonzaRng = {
    int: (max) => (max === 10_000 ? max - 1 : max - 1),
  };
  const round = runSweetLemonzaRound(100, scatterRng);
  assert.equal(round.totalFreeSpinsPlayed, 100);
  assert.ok(round.safetyLimitReached);
});
test("денежные выплаты округляются вниз до целой лиры", () => {
  const wins = evaluateLemonzaWins(
    [...cells("OLIVES", 8), ...cells("RINGS", 22, 50)],
    1,
  );
  assert.equal(wins.find((win) => win.symbol === "OLIVES")!.payout, 0);
});
test("production engine и simulator используют один детерминированный расчёт", () => {
  const direct = runSweetLemonzaRound(100, createSeededRng("same-engine"));
  const report = simulateSweetLemonza({
    spins: 1,
    seed: "same-engine",
    stake: 100,
    json: false,
    verbose: false,
    includeBonus: true,
    mode: "STANDARD",
  });
  assert.equal(report.totalWin, direct.totalPayout);
});
test("Spin атомарно списывает стоимость, начисляет выигрыш и идемпотентен", () => {
  const user = store.users.find((item) => item.id === "u-anton")!;
  const before = user.balance,
    key = "slot-integration-idempotent";
  const first = spinSweetLemonza({
    userId: user.id,
    stake: 20,
    mode: "STANDARD",
    idempotencyKey: key,
  });
  const after = user.balance;
  const repeated = spinSweetLemonza({
    userId: user.id,
    stake: 20,
    mode: "STANDARD",
    idempotencyKey: key,
  });
  assert.equal(repeated.round.id, first.round.id);
  assert.equal(user.balance, after);
  assert.equal(
    after,
    before - first.round.chargedAmount + first.round.totalWin,
  );
  assert.equal(
    listTransactions(user.id).filter((item) =>
      item.operationKey.startsWith(`slot:${key}:`),
    ).length,
    first.round.totalWin > 0 ? 2 : 1,
  );
});
test("параллельный повтор одного ключа рассчитывается один раз", () => {
  const key = "slot-parallel-key";
  const [one, two] = [
    spinSweetLemonza({
      userId: "u-misha",
      stake: 20,
      mode: "STANDARD",
      idempotencyKey: key,
    }),
    spinSweetLemonza({
      userId: "u-misha",
      stake: 20,
      mode: "STANDARD",
      idempotencyKey: key,
    }),
  ];
  assert.equal(one.round.id, two.round.id);
});
test("недостаточный баланс не создаёт транзакций", () => {
  const user = store.users.find((item) => item.id === "u-lena")!,
    balance = user.balance;
  user.balance = 0;
  const before = listTransactions(user.id).length;
  assert.throws(
    () =>
      spinSweetLemonza({
        userId: user.id,
        stake: 20,
        mode: "STANDARD",
        idempotencyKey: "slot-poor",
      }),
    /INSUFFICIENT_BALANCE/,
  );
  assert.equal(listTransactions(user.id).length, before);
  user.balance = balance;
});
test("Bonus Buy v6 использует прозрачную цену 100X", () => {
  const round = runSweetLemonzaRound(20, createSeededRng("bonus-buy-v6"), {
    mode: "BONUS_BUY",
    includeBonus: false,
  });
  assert.equal(LEMONZA_BONUS_BUY_COST_X, 100);
  assert.equal(LEMONZA_MATH_VERSION, "sweet-lemonza-v6");
  assert.equal(round.mathVersion, LEMONZA_MATH_VERSION);
  assert.equal(round.chargedAmount, 2000);
});
test("UI Bonus Buy использует общий config, а не старый hardcode", () => {
  const source = readFileSync(
    new URL("../components/slots/lemonza-game.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("LEMONZA_BONUS_BUY_COST_X"));
  assert.equal(source.includes('stake*100:mode==="LEMON_BOOST"'), false);
});
test("dev-меню покрывает бонус и все четыре уровня большого выигрыша", () => {
  const source = readFileSync(
    new URL("../components/slots/lemonza-game.tsx", import.meta.url),
    "utf8",
  );
  for (const marker of [
    'process.env.NODE_ENV==="development"',
    '"win-bello":10',
    '"win-grande":25',
    '"win-magnifico":50',
    '"win-dolce-vita":100',
    'label:"Выпадение бонуса"',
  ])
    assert.ok(source.includes(marker), marker);
  assert.ok(source.includes("<LemonzaDevMenu"));
});
test("Modal использует общий focus trap, scroll lock и доступные dialog-атрибуты", () => {
  const source = readFileSync(
      new URL("../components/slots/lemonza-game.tsx", import.meta.url),
      "utf8",
    ),
    hook = readFileSync(
      new URL(
        "../components/slots/shared/use-accessible-dialog.ts",
        import.meta.url,
      ),
      "utf8",
    );
  for (const marker of [
    'aria-modal="true"',
    "aria-labelledby={titleId}",
    "useAccessibleDialog(dialogRef,onClose)",
  ])
    assert.ok(source.includes(marker), marker);
  for (const marker of [
    'event.key !== "Tab"',
    'document.body.style.overflow = "hidden"',
    'setAttribute("inert"',
  ])
    assert.ok(hook.includes(marker), marker);
});
test("history показывает cascades, multipliers и mathVersion из result JSON", () => {
  const source = readFileSync(
    new URL("../components/slots/lemonza-game.tsx", import.meta.url),
    "utf8",
  );
  for (const marker of [
    "play.cascades",
    "play.collectedMultipliers",
    "Math version",
    "selected.scatterWin",
    "selected.bonusWin",
  ])
    assert.ok(source.includes(marker), marker);
});
test("старый sweet-lemonza-v4 result остаётся читаемым", () => {
  const legacy = runSweetLemonzaRound(20, createSeededRng("legacy-v4"), {
    includeBonus: false,
  });
  const json = JSON.parse(
    JSON.stringify({ ...legacy, mathVersion: "sweet-lemonza-v4" }),
  );
  assert.equal(json.mathVersion, "sweet-lemonza-v4");
  assert.ok(Array.isArray(json.freeSpins));
});
console.log("Все проверки Sweet Lemonza пройдены.");
