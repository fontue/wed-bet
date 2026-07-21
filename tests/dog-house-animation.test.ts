import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DogHouseAnimationDirector,
  buildDogHouseTimeline,
} from "../components/slots/dog-house/animation/director.ts";
import {
  createDisplayModel,
  withWinningLine,
} from "../components/slots/dog-house/animation/display-reels.ts";
import {
  NORMAL_TIMINGS,
  QUICK_TIMINGS,
  REDUCED_TIMINGS,
  TURBO_TIMINGS,
  timingsFor,
} from "../components/slots/dog-house/animation/animation-config.ts";
import { runDogHouseRound } from "../domain/slots/dog-house/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";
import type { DogHouseSlotRound } from "../domain/models.ts";

const asRound = (seed: string): DogHouseSlotRound => {
  const result = runDogHouseRound(100, createSeededRng(seed));
  return {
    id: `round-${seed}`,
    gameId: "casa-degli-sposi",
    mathVersion: result.mathVersion,
    userId: "test",
    stake: 100,
    mode: "STANDARD",
    chargedAmount: 100,
    baseWin: result.baseGamePayout,
    scatterWin: result.bonusScatterPayout,
    bonusWin: result.bonusPayout,
    totalWin: result.totalPayout,
    balanceBefore: 10_000,
    balanceAfter: 9_900 + result.totalPayout,
    bonusTriggered: result.bonusTriggered,
    maxMultiplier: result.maxMultiplier,
    idempotencyKey: seed,
    result,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
};
const find = (predicate: (round: DogHouseSlotRound) => boolean) => {
  for (let index = 0; index < 10_000; index += 1) {
    const round = asRound(`dog-animation-${index}`);
    if (predicate(round)) return round;
  }
  throw new Error("fixture not found");
};
const loss = find((round) => round.totalWin === 0),
  win = find((round) => round.result.base.wins.length > 0),
  bonus = find((round) => round.bonusTriggered),
  stickyRound = asRound("patch-428");
async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}
await test("проигрыш останавливает пять барабанов и завершается", () => {
  const states = buildDogHouseTimeline(loss);
  assert.equal(
    states.filter((step) => step.state === "stopping-reel").length,
    5,
  );
  assert.equal(states.at(-1)?.state, "round-complete");
});
await test("каждая линия проходит highlight → value → collect", () => {
  const states = buildDogHouseTimeline(win),
    index = states.findIndex((step) => step.state === "highlighting-line");
  assert.deepEqual(
    states.slice(index, index + 3).map((step) => step.state),
    ["highlighting-line", "showing-line-win", "collecting-win"],
  );
});
await test("big-win сохраняет тексты Casa, повторяет анимационную структуру Sweet Lemonza и ждёт клика", () => {
  const big = find((round) => round.result.base.payout / round.stake >= 5),
    step = buildDogHouseTimeline(big).find(
      (item) => item.state === "showing-big-win",
    ),
    playback = readFileSync(
      new URL(
        "../components/slots/dog-house/animation/use-dog-house-playback.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    overlay = readFileSync(
      new URL(
        "../components/slots/dog-house/components/animation-overlays.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    css = readFileSync(
      new URL("../app/slot-polish.css", import.meta.url),
      "utf8",
    );
  assert.ok(step);
  assert.equal(step.duration, undefined);
  assert.ok(playback.includes('step.state==="showing-big-win"'));
  assert.ok(playback.includes("overlayResolve.current=resolve"));
  for (const marker of [
    "BRAVO!",
    "GRANDE!",
    "MAGNIFICO!",
    "FESTA DA CANI!",
    "dogslot-big-win-shadow",
    "Нажмите, чтобы продолжить",
  ])
    assert.ok(overlay.includes(marker), marker);
  assert.ok(
    css.includes(".dogslot-screen .dogslot-big-win{display:flex!important"),
  );
  assert.ok(css.includes("animation:lemonza-big-title 1.3s"));
  assert.ok(css.includes("animation:lemonza-counter-pop .9s .4s"));
});
await test("бонус раскрывает ровно девять серверных значений", () => {
  const steps = buildDogHouseTimeline(bonus),
    tokens = steps.filter((step) => step.state === "revealing-free-spins");
  assert.equal(tokens.length, 9);
  assert.deepEqual(
    tokens.map((step) => step.tokenValue),
    bonus.result.freeSpinReveal,
  );
  assert.ok(steps.some((step) => step.state === "bonus-summary"));
});
await test("последняя лапа крутится вдвое дольше и сопровождается звуковым индикатором", () => {
  const steps = buildDogHouseTimeline(bonus),
    anticipation = steps.findIndex(
      (step) => step.state === "anticipating-bonus",
    ),
    stop = steps.findIndex(
      (step, index) =>
        index > anticipation &&
        step.state === "stopping-reel" &&
        step.reel === 4,
    ),
    source = readFileSync(
      new URL(
        "../components/slots/dog-house/animation/use-dog-house-playback.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    sound = readFileSync(
      new URL(
        "../components/slots/dog-house/audio/sound-manager.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    overlay = readFileSync(
      new URL(
        "../components/slots/dog-house/components/animation-overlays.tsx",
        import.meta.url,
      ),
      "utf8",
    );
  assert.ok(anticipation >= 0);
  assert.equal(steps[anticipation].reel, 4);
  assert.ok(stop > anticipation);
  assert.equal(NORMAL_TIMINGS.anticipationExtra, 6800);
  assert.equal(QUICK_TIMINGS.anticipationExtra, 3840);
  assert.equal(TURBO_TIMINGS.anticipationExtra, 1360);
  assert.ok(
    source.includes("stoppedReels:4,stoppingReel:-1,anticipationLevel:2"),
  );
  assert.ok(sound.includes('this.stopLoops();if(event==="reel-stop")'));
  assert.ok(sound.includes("Math.max(145,315-step*14)"));
  assert.equal(overlay.includes("Ещё одна лапа"), false);
});
await test("profiles normal quick turbo reduced различаются", () => {
  assert.deepEqual(timingsFor("normal"), NORMAL_TIMINGS);
  assert.deepEqual(timingsFor("quick"), QUICK_TIMINGS);
  assert.deepEqual(timingsFor("turbo"), TURBO_TIMINGS);
  assert.deepEqual(timingsFor("normal", true), REDUCED_TIMINGS);
  assert.ok(
    TURBO_TIMINGS.minimumSpin < QUICK_TIMINGS.minimumSpin &&
      QUICK_TIMINGS.minimumSpin < NORMAL_TIMINGS.minimumSpin,
  );
});
await test("director воспроизводит состояния строго последовательно", async () => {
  const expected = buildDogHouseTimeline(loss).map((step) => step.state),
    seen: string[] = [];
  const director = new DogHouseAnimationDirector({
    speed: "turbo",
    wait: async () => {},
  });
  await director.playRound(loss, {
    onStep: (step) => {
      seen.push(step.state);
    },
    onComplete: () => {},
  });
  assert.deepEqual(seen, expected);
});
await test("первый fast-forward ускоряет весь раунд без потери lifecycle", async () => {
  const expected = buildDogHouseTimeline(bonus).map((step) => step.state),
    seen: string[] = [],
    waits: number[] = [];
  const director = new DogHouseAnimationDirector({
    speed: "normal",
    wait: async (duration) => {
      waits.push(duration);
    },
  });
  let accelerated = false;
  await director.playRound(bonus, {
    onStep: (step) => {
      seen.push(step.state);
      if (!accelerated && step.state === "spinning") {
        accelerated = true;
        director.enableFastForwardForRound();
      }
    },
    onComplete: (kind) => assert.equal(kind, "completed"),
  });
  assert.deepEqual(seen, expected);
  assert.equal(
    seen.filter((state) => state === "stopping-reel").length,
    5 * (1 + bonus.result.freeSpins.length),
  );
  assert.equal(
    seen.filter((state) => state === "revealing-free-spins").length,
    9,
  );
  assert.equal(
    seen.filter((state) => state === "playing-free-spin").length,
    bonus.result.freeSpins.length,
  );
  assert.ok(waits.length > 0);
});
await test("повторное нажатие завершает только текущую паузу и не прыгает в round-complete", async () => {
  const seen: string[] = [];
  const director = new DogHouseAnimationDirector({
    speed: "normal",
    wait: async () => {},
  });
  let taps = 0;
  await director.playRound(win, {
    onStep: (step) => {
      seen.push(step.state);
      if (step.state === "spinning" && taps === 0) {
        taps = 2;
        director.enableFastForwardForRound();
        director.accelerateCurrentPhase();
      }
    },
    onComplete: (kind) => assert.equal(kind, "completed"),
  });
  assert.deepEqual(
    seen,
    buildDogHouseTimeline(win).map((step) => step.state),
  );
  assert.ok(seen.includes("highlighting-line"));
  assert.equal(seen.at(-1), "round-complete");
});
await test("пользовательский playback не вызывает skipToRoundEnd", () => {
  const source = readFileSync(
    new URL(
      "../components/slots/dog-house/animation/use-dog-house-playback.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.equal(source.includes("skipToRoundEnd"), false);
});
await test("dispose отменяет playback без complete", async () => {
  let completed = false,
    started = false;
  const director = new DogHouseAnimationDirector();
  const playing = director.playRound(loss, {
    onStep: (step) => {
      if (step.state === "starting-reels") {
        started = true;
        director.dispose();
      }
    },
    onComplete: () => {
      completed = true;
    },
  });
  while (!started) await Promise.resolve();
  await playing;
  assert.equal(completed, false);
});
await test("Sticky Wild сохраняет animationId между free spins", () => {
  const spins = bonus.result.freeSpins;
  const target = spins.findIndex((spin) => spin.stickyWilds.length > 0);
  if (target < 0) return;
  const first = createDisplayModel(spins[target], {
      roundId: bonus.id,
      spinIndex: target + 1,
    }),
    next = spins[target + 1]
      ? createDisplayModel(spins[target + 1], {
          roundId: bonus.id,
          spinIndex: target + 2,
          previousSticky: first.stickyIds,
        })
      : first;
  for (const [index, id] of first.stickyIds)
    if (next.stickyIds.has(index)) assert.equal(next.stickyIds.get(index), id);
});
await test("несколько Sticky Wild на одном reel сохраняют IDs и multiplier", () => {
  const spin = structuredClone(stickyRound.result.freeSpins.at(-1)!);
  for (const [index, multiplier] of [
    [1, 2],
    [6, 3],
    [11, 2],
  ] as const) {
    spin.grid[index] = { ...spin.grid[index], symbol: "WILD", multiplier };
    if (!spin.stickyWilds.some((item) => item.index === index))
      spin.stickyWilds.push({ index, multiplier });
  }
  const first = createDisplayModel(spin, {
      roundId: stickyRound.id,
      spinIndex: 1,
      isFreeSpin: true,
    }),
    next = createDisplayModel(spin, {
      roundId: stickyRound.id,
      spinIndex: 2,
      isFreeSpin: true,
      previousSticky: first.stickyIds,
    });
  for (const index of [1, 6, 11]) {
    assert.equal(next.stickyIds.get(index), first.stickyIds.get(index));
    assert.equal(next.cells[index].multiplier, spin.grid[index].multiplier);
  }
});
await test("fast-forward не удаляет sticky-lock stages, включая последний free spin", async () => {
  const expected = buildDogHouseTimeline(stickyRound),
    locks = expected.filter(
      (step) => step.state === "locking-sticky-wild",
    ).length,
    seen: string[] = [];
  const director = new DogHouseAnimationDirector({ wait: async () => {} });
  await director.playRound(stickyRound, {
    onStep: (step) => {
      seen.push(step.state);
      if (step.state === "spinning") director.enableFastForwardForRound();
    },
    onComplete: () => {},
  });
  assert.equal(
    seen.filter((state) => state === "locking-sticky-wild").length,
    locks,
  );
  assert.equal(
    seen.filter((state) => state === "playing-free-spin").length,
    stickyRound.result.freeSpins.length,
  );
});
await test("подсветка линии не меняет animationId", () => {
  const model = createDisplayModel(win.result.base, {
      roundId: win.id,
      spinIndex: 0,
    }),
    highlighted = withWinningLine(model, win.result.base.wins[0].positions);
  assert.deepEqual(
    highlighted.cells.map((cell) => cell.animationId),
    model.cells.map((cell) => cell.animationId),
  );
});
await test("payline строится напрямую по сетке 5×3 и остаётся поверх барабанов", () => {
  const overlay = readFileSync(
      new URL(
        "../components/slots/dog-house/components/payline-overlay.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    css = readFileSync(
      new URL("../app/slot-polish.css", import.meta.url),
      "utf8",
    );
  assert.equal(overlay.includes("getBoundingClientRect"), false);
  assert.ok(overlay.includes('viewBox="0 0 500 300"'));
  assert.ok(overlay.includes("reel*100+50"));
  assert.ok(overlay.includes('className="dogslot-payline-main"'));
  assert.ok(css.includes(".dogslot-payline-overlay{z-index:30!important"));
  assert.ok(css.includes(".dogslot-payline-overlay .dogslot-payline-main"));
});
await test("Dog House использует одну компактную ленту без мигания на handoff", () => {
  const reelSource = readFileSync(
      new URL(
        "../components/slots/dog-house/components/dog-house-reel.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    gridSource = readFileSync(
      new URL(
        "../components/slots/dog-house/components/dog-house-grid.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    css = readFileSync(
      new URL("../app/slot-polish.css", import.meta.url),
      "utf8",
    );
  assert.ok(reelSource.includes(".slice(0,8)"));
  assert.ok(reelSource.includes("track=[...targets,...filler,...filler]"));
  assert.ok(reelSource.includes("rows=3+filler.length*2"));
  assert.ok(reelSource.includes("getComputedStyle(track).transform"));
  assert.ok(reelSource.includes("track.animate(["));
  assert.ok(reelSource.includes("animationRef.current.playbackRate"));
  assert.ok(reelSource.includes(".08/strip.rows*100"));
  assert.ok(gridSource.includes("useMemo"));
  assert.ok(
    css.includes(
      ".dogslot-reels-v2 .dogslot-target-strip>div{height:var(--dog-track-height);grid-template-rows:repeat(var(--dog-track-rows)",
    ),
  );
  assert.ok(
    css.includes(
      ".dogslot-reels-v2 .dogslot-target-strip svg{width:100%;height:100%;filter:none",
    ),
  );
  assert.ok(
    css.includes("transition:none!important;opacity:1;visibility:visible"),
  );
  assert.ok(
    css.includes(
      ".dogslot-reel-result.is-landed .dogslot-cell:not(.is-sticky):not(.is-winning) svg{filter:none}",
    ),
  );
});
await test("dev-лаба Casa покрывает бонус и все уровни большого выигрыша", () => {
  const source = readFileSync(
      new URL("../components/slots/dog-house-game.tsx", import.meta.url),
      "utf8",
    ),
    css = readFileSync(
      new URL("../app/slot-polish.css", import.meta.url),
      "utf8",
    );
  for (const marker of [
    'process.env.NODE_ENV==="development"',
    '"win-bravo":5',
    '"win-grande":15',
    '"win-magnifico":40',
    '"win-festa":100',
    'label:"Выпадение бонуса"',
    "<DogHouseDevMenu",
  ])
    assert.ok(source.includes(marker), marker);
  assert.ok(
    css.includes(
      ".dogslot-screen .dogslot-status>strong{padding:.3rem .65rem;font-size:1.25rem!important",
    ),
  );
});
console.log("Все проверки Casa degli Sposi Animation Director пройдены.");
