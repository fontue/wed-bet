import assert from "node:assert/strict";
import {
  AnimationDirector,
  buildAnimationTimeline,
} from "../components/slots/sweet-lemonza/animation/director.ts";
import {
  activateQueuedGrid,
  collapseSymbols,
  displayGrid,
  finalDisplayGrid,
  markWinning,
  queueDisplayGrid,
  refillSymbols,
} from "../components/slots/sweet-lemonza/animation/display-grid.ts";
import {
  ANIMATION_TIME_SCALE,
  NORMAL_TIMINGS,
  REDUCED_MOTION_TIMINGS,
  TURBO_TIMINGS,
} from "../components/slots/sweet-lemonza/animation/timings.ts";
import {
  MIN_CELEBRATION_MULTIPLIER,
  winTierByMultiplier,
} from "../components/slots/sweet-lemonza/config/animation-config.ts";
import { runSweetLemonzaRound } from "../domain/slots/sweet-lemonza/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";

async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}
const scenario = runSweetLemonzaRound(100, createSeededRng("scenario-245"), {
  mode: "LEMON_BOOST",
});
const loss = (() => {
  for (let index = 0; index < 500; index += 1) {
    const round = runSweetLemonzaRound(
      100,
      createSeededRng(`animation-loss-${index}`),
      { includeBonus: false },
    );
    if (round.totalPayout === 0) return round;
  }
  throw new Error("No deterministic loss fixture");
})();

await test("проигрыш проходит короткий линейный timeline", () => {
  const states = buildAnimationTimeline(loss).map((step) => step.state);
  assert.deepEqual(states, [
    "anticipation",
    "initial-drop",
    "evaluating",
    "counting-win",
    "round-complete",
  ]);
});
await test("каскады идут highlight → value → remove → collapse → refill", () => {
  const states = buildAnimationTimeline(scenario);
  const start = states.findIndex((step) => step.state === "highlighting-win");
  assert.deepEqual(
    states.slice(start, start + 6).map((step) => step.state),
    [
      "highlighting-win",
      "showing-win-value",
      "removing-symbols",
      "collapsing-grid",
      "dropping-new-symbols",
      "evaluating",
    ],
  );
});
await test("финальный counting и multiplier apply не получают второе ожидание", () => {
  const steps = buildAnimationTimeline(scenario);
  assert.equal(
    steps.find((step) => step.state === "counting-win")?.durationKey,
    undefined,
  );
  assert.ok(
    steps
      .filter((step) => step.state === "applying-multipliers")
      .every((step) => step.durationKey === undefined),
  );
});
await test("bonus и multiplier попадают в timeline из серверного результата", () => {
  const states = buildAnimationTimeline(scenario).map((step) => step.state);
  assert.ok(states.includes("entering-bonus"));
  assert.ok(states.includes("bonus-summary"));
  assert.ok(states.includes("revealing-multipliers"));
  assert.ok(states.includes("applying-multipliers"));
});
await test("полноэкранные заставки не имеют автоматического таймера", () => {
  const steps = buildAnimationTimeline(scenario);
  assert.equal(
    steps.find((step) => step.state === "entering-bonus")?.durationKey,
    undefined,
  );
  assert.equal(
    steps.find((step) => step.state === "bonus-summary")?.durationKey,
    undefined,
  );
  assert.ok(
    steps
      .filter((step) => step.state === "showing-big-win")
      .every((step) => step.durationKey === undefined),
  );
});
await test("заставка фриспина зависит от X к ставке, а не абсолютной суммы", () => {
  const round = structuredClone(scenario),
    play = structuredClone(loss.base!);
  round.freeSpins = [play];
  play.totalPayout = round.stake * (MIN_CELEBRATION_MULTIPLIER - 0.01);
  assert.ok(
    !buildAnimationTimeline(round).some(
      (step) => step.state === "showing-big-win" && step.isFreeSpin,
    ),
  );
  play.totalPayout = round.stake * MIN_CELEBRATION_MULTIPLIER;
  assert.ok(
    buildAnimationTimeline(round).some(
      (step) => step.state === "showing-big-win" && step.isFreeSpin,
    ),
  );
  assert.equal(winTierByMultiplier(10).label, "BELLA VINCITA!");
  assert.equal(winTierByMultiplier(25).label, "GRANDE!");
  assert.equal(winTierByMultiplier(50).label, "MAGNIFICO!");
  assert.equal(winTierByMultiplier(100).label, "LA DOLCE VITA!");
});
await test("retrigger проигрывается как Scatter внутри free spin", () => {
  const retrigger = structuredClone(scenario),
    play = retrigger.freeSpins[0];
  play.scatterCount = 3;
  play.awardedFreeSpins = 5;
  const step = buildAnimationTimeline(retrigger).find(
    (item) =>
      item.state === "showing-scatter-result" &&
      item.isFreeSpin &&
      item.play.awardedFreeSpins === 5,
  );
  assert.ok(step);
});
await test("Scatter без бонуса не добавляет экран и задержку", () => {
  const underTrigger = structuredClone(loss);
  underTrigger.base!.scatterCount = 3;
  underTrigger.base!.scatterPayout = 0;
  underTrigger.base!.awardedFreeSpins = 0;
  assert.ok(
    !buildAnimationTimeline(underTrigger).some(
      (step) => step.state === "showing-scatter-result",
    ),
  );
});
await test("множители с нулевым выигрышем не добавляют экран", () => {
  const noWin = structuredClone(scenario),
    play = noWin.freeSpins[0];
  play.collectedMultipliers = [10];
  play.appliedMultiplier = 10;
  play.clusterPayout = 0;
  play.totalPayout = 0;
  assert.ok(
    !buildAnimationTimeline(noWin).some(
      (step) =>
        step.play === play &&
        (step.state === "revealing-multipliers" ||
          step.state === "applying-multipliers"),
    ),
  );
});
await test("несколько multiplier визуализируются одной серверной суммой", () => {
  const step = buildAnimationTimeline(scenario).find(
    (item) =>
      item.state === "revealing-multipliers" &&
      item.play.collectedMultipliers.length > 1,
  );
  assert.ok(step);
  assert.equal(
    step.play.appliedMultiplier,
    step.play.collectedMultipliers.reduce((sum, value) => sum + value, 0),
  );
});
await test("multiplier исчезают по одному до применения выигрыша", () => {
  const steps = buildAnimationTimeline(scenario),
    revealIndex = steps.findIndex(
      (step) =>
        step.state === "revealing-multipliers" &&
        step.play.collectedMultipliers.length > 1,
    ),
    play = steps[revealIndex].play,
    collection = steps.slice(
      revealIndex + 1,
      revealIndex + 1 + play.collectedMultipliers.length,
    );
  assert.deepEqual(
    collection.map((step) => step.state),
    play.collectedMultipliers.map(() => "collecting-multiplier"),
  );
  assert.deepEqual(
    collection.map((step) => step.multiplierValue),
    play.collectedMultipliers,
  );
  assert.equal(
    steps[revealIndex + 1 + play.collectedMultipliers.length].state,
    "applying-multipliers",
  );
});
await test("normal, turbo и reduced profiles действительно различаются", () => {
  const normal = new AnimationDirector(),
    turbo = new AnimationDirector({ turbo: true }),
    reduced = new AnimationDirector({ reducedMotion: true });
  assert.deepEqual(normal.timings, NORMAL_TIMINGS);
  assert.deepEqual(turbo.timings, TURBO_TIMINGS);
  assert.deepEqual(reduced.timings, REDUCED_MOTION_TIMINGS);
  assert.ok(turbo.timings.initialDrop < normal.timings.initialDrop);
});
await test("общий темп анимаций установлен в 2×", () => {
  assert.equal(ANIMATION_TIME_SCALE, 2);
  assert.equal(NORMAL_TIMINGS.initialDrop, 720);
  assert.equal(NORMAL_TIMINGS.symbolRemoval, 480);
  assert.equal(TURBO_TIMINGS.initialDrop, 320);
});
await test("director выдаёт состояния строго последовательно и завершает один раз", async () => {
  const director = new AnimationDirector({ wait: async () => {} }),
    seen: string[] = [];
  let completions = 0;
  await director.playRound(loss, {
    onStep: (step) => {
      seen.push(step.state);
    },
    onComplete: () => {
      completions += 1;
    },
  });
  assert.deepEqual(
    seen,
    buildAnimationTimeline(loss).map((step) => step.state),
  );
  assert.equal(completions, 1);
});
await test("SKIP включает fast-forward раунда и сохраняет обычный lifecycle", async () => {
  const seen: string[] = [],
    waits: number[] = [];
  let completions = 0;
  const director = new AnimationDirector({
    wait: async (milliseconds) => {
      waits.push(milliseconds);
    },
  });
  await director.playRound(loss, {
    onStep: (step) => {
      seen.push(step.state);
      if (step.state === "anticipation") director.enableFastForwardForRound();
    },
    onComplete: () => {
      completions += 1;
    },
  });
  assert.deepEqual(
    seen,
    buildAnimationTimeline(loss).map((step) => step.state),
  );
  assert.equal(waits[0], 70);
  assert.equal(waits[1], 220);
  assert.equal(completions, 1);
});
await test("fast-forward сохраняет каскады, множители и free-spin order", async () => {
  const seen: Array<{ state: string; spin?: number }> = [];
  let accelerated = false;
  const director = new AnimationDirector({ wait: async () => {} });
  await director.playRound(scenario, {
    onStep: (step) => {
      seen.push({ state: step.state, spin: step.freeSpinNumber });
      if (!accelerated && step.state === "anticipation") {
        accelerated = true;
        director.enableFastForwardForRound();
      }
    },
    onComplete: () => {},
  });
  assert.deepEqual(
    seen.map((item) => item.state),
    buildAnimationTimeline(scenario).map((step) => step.state),
  );
  assert.ok(seen.some((item) => item.state === "highlighting-win"));
  assert.ok(seen.some((item) => item.state === "dropping-new-symbols"));
  assert.ok(seen.some((item) => item.state === "collecting-multiplier"));
  assert.equal(
    seen.filter((item) => item.state === "playing-free-spin").length,
    scenario.freeSpins.length,
  );
});
await test("повторный SKIP сокращает только текущую паузу и не прыгает в финал", async () => {
  const seen: string[] = [];
  let accelerated = false;
  const director = new AnimationDirector({ wait: async () => {} });
  await director.playRound(scenario, {
    onStep: (step) => {
      seen.push(step.state);
      if (!accelerated && step.state === "anticipation") {
        accelerated = true;
        director.enableFastForwardForRound();
        director.accelerateCurrentPhase();
      }
    },
    onComplete: (kind) => assert.equal(kind, "completed"),
  });
  assert.deepEqual(
    seen,
    buildAnimationTimeline(scenario).map((step) => step.state),
  );
  assert.equal(seen.at(-1), "round-complete");
});
await test("fast-forward не дублирует multiplier apply или payout lifecycle", async () => {
  const seen: string[] = [];
  const director = new AnimationDirector({ wait: async () => {} });
  await director.playRound(scenario, {
    onStep: (step) => {
      seen.push(step.state);
      if (step.state === "anticipation") director.enableFastForwardForRound();
    },
    onComplete: () => {},
  });
  assert.equal(
    seen.filter((state) => state === "applying-multipliers").length,
    buildAnimationTimeline(scenario).filter(
      (step) => step.state === "applying-multipliers",
    ).length,
  );
  assert.equal(seen.filter((state) => state === "counting-win").length, 1);
  assert.equal(seen.filter((state) => state === "round-complete").length, 1);
});
await test("director снова запускается после dev Strict Mode cleanup", async () => {
  const states: string[] = [];
  const director = new AnimationDirector({
    reducedMotion: true,
    wait: async () => {},
  });
  director.dispose();
  director.activate();
  const result = await director.playRound(loss, {
    onStep: (step) => {
      states.push(step.state);
    },
    onComplete: () => {},
  });
  assert.equal(result, "completed");
  assert.ok(states.includes("initial-drop"));
  assert.equal(states.at(-1), "round-complete");
});
await test("dispose/unmount прерывает AbortSignal и не вызывает complete", async () => {
  let complete = false,
    started = false;
  const director = new AnimationDirector({
    wait: (_milliseconds, signal) =>
      new Promise((resolve) => {
        started = true;
        signal.addEventListener("abort", () => resolve(), { once: true });
      }),
  });
  const playing = director.playRound(loss, {
    onStep: () => {},
    onComplete: () => {
      complete = true;
    },
  });
  while (!started) await Promise.resolve();
  director.dispose();
  await playing;
  assert.equal(complete, false);
});
await test("display model сохраняет ключи surviving symbols и удаляет победителей", () => {
  const play = [scenario.base, ...scenario.freeSpins].find(
      (item) => item && item.cascades.length,
    )!,
    cascade = play.cascades[0];
  const initial = displayGrid(cascade.grid, new Set()),
    marked = markWinning(initial, cascade, true),
    survivorIds = new Set(
      marked.filter((item) => !item.isWinning).map((item) => item.animationId),
    ),
    collapsed = collapseSymbols(marked, cascade),
    refilled = refillSymbols(collapsed, cascade);
  assert.ok(marked.some((item) => item.isRemoving));
  assert.ok(
    collapsed
      .filter((item) => !item.isQueued)
      .every((item) => survivorIds.has(item.animationId)),
  );
  assert.equal(collapsed.length, 30);
  assert.equal(refilled.length, 30);
  assert.deepEqual(
    refilled.map((item) => item.animationId),
    cascade.nextGrid.map((cell) => String(cell.id)),
  );
});
await test("surviving symbols получают реальные координаты из nextGrid", () => {
  const play = [scenario.base, ...scenario.freeSpins].find(
      (item) => item && item.cascades.length,
    )!,
    cascade = play.cascades[0],
    collapsed = collapseSymbols(
      markWinning(displayGrid(cascade.grid, new Set()), cascade, true),
      cascade,
    );
  for (const symbol of collapsed.filter((item) => !item.isQueued)) {
    const index = cascade.nextGrid.findIndex(
      (cell) => cell.id === symbol.cell.id,
    );
    assert.notEqual(index, -1);
    assert.equal(symbol.row, Math.floor(index / 6));
    assert.equal(symbol.column, index % 6);
    assert.equal(symbol.previousColumn, symbol.column);
  }
});
await test("incoming SVG монтируются в collapse и сохраняют DOM-ключи перед drop", () => {
  const play = [scenario.base, ...scenario.freeSpins].find(
      (item) => item && item.cascades.length,
    )!,
    cascade = play.cascades[0],
    collapsed = collapseSymbols(
      markWinning(displayGrid(cascade.grid, new Set()), cascade, true),
      cascade,
    ),
    refilled = refillSymbols(collapsed, cascade),
    queued = collapsed.filter((item) => item.isQueued);
  assert.equal(queued.length, cascade.newSymbols.length);
  for (const item of queued) {
    const dropped = refilled.find(
      (symbol) => symbol.animationId === item.animationId,
    );
    assert.ok(dropped);
    assert.equal(dropped.cell, item.cell);
    assert.equal(dropped.isQueued, false);
    assert.equal(dropped.isNew, true);
  }
});
await test("initial grid тоже сохраняет SVG и ключи между preload и drop", () => {
  const queued = queueDisplayGrid(scenario.base!.initialGrid),
    active = activateQueuedGrid(queued);
  assert.equal(queued.length, 30);
  assert.equal(active.length, 30);
  for (let index = 0; index < 30; index += 1) {
    assert.equal(queued[index].isQueued, true);
    assert.equal(active[index].isQueued, false);
    assert.equal(active[index].animationId, queued[index].animationId);
    assert.equal(active[index].cell, queued[index].cell);
  }
});
await test("новые символы сохраняют вертикальный порядок над сеткой и не накладываются", () => {
  const play = [scenario.base, ...scenario.freeSpins].find(
      (item) => item && item.cascades.length,
    )!,
    cascade = play.cascades[0],
    collapsed = collapseSymbols(
      markWinning(displayGrid(cascade.grid, new Set()), cascade, true),
      cascade,
    ),
    refilled = refillSymbols(collapsed, cascade);
  for (let column = 0; column < 6; column += 1) {
    const incoming = refilled
      .filter((item) => item.column === column && item.isNew)
      .sort((a, b) => a.row - b.row);
    assert.equal(
      new Set(incoming.map((item) => item.previousRow)).size,
      incoming.length,
    );
    for (let index = 1; index < incoming.length; index += 1)
      assert.equal(
        incoming[index].previousRow! - incoming[index - 1].previousRow!,
        1,
      );
  }
});
await test("initial drop начинает пять рядов с разных позиций", () => {
  const initial = displayGrid(scenario.base!.initialGrid);
  for (let column = 0; column < 6; column += 1)
    assert.deepEqual(
      initial
        .filter((item) => item.column === column)
        .map((item) => item.previousRow),
      [-5, -4, -3, -2, -1],
    );
});
await test("финальная display-grid в точности совпадает с серверной", () => {
  const expected =
    scenario.freeSpins.at(-1)?.finalGrid ?? scenario.base!.finalGrid;
  assert.deepEqual(
    finalDisplayGrid(scenario).map((item) => item.cell),
    expected,
  );
});
await test("после расчёта bonus multiplier не возвращаются на финальную сетку", () => {
  assert.ok(
    finalDisplayGrid(scenario, true).every((symbol) => !symbol.isMultiplier),
  );
});

console.log("Все проверки Sweet Lemonza Animation Director пройдены.");
