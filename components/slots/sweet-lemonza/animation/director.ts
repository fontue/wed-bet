import type { LemonzaRoundResult } from "@/domain/slots/sweet-lemonza/types";
import type {
  AnimationStep,
  AnimationStepContext,
  GameAnimationState,
} from "./states";
import {
  CASCADE_SPEED,
  NORMAL_TIMINGS,
  REDUCED_MOTION_TIMINGS,
  TURBO_TIMINGS,
  type AnimationTimings,
} from "./timings";
import { MIN_CELEBRATION_MULTIPLIER } from "../config/animation-config";

export interface DirectorCallbacks {
  onStep: (step: AnimationStepContext) => void | Promise<void>;
  onComplete: (kind: "completed" | "skipped") => void | Promise<void>;
  onState?: (state: GameAnimationState) => void;
}
export interface DirectorOptions {
  turbo?: boolean;
  reducedMotion?: boolean;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export function buildAnimationTimeline(
  round: LemonzaRoundResult,
): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const appendPlay = (
    play: NonNullable<LemonzaRoundResult["base"]>,
    playIndex: number,
    isFreeSpin: boolean,
    freeSpinNumber?: number,
  ) => {
    if (isFreeSpin)
      steps.push({
        state: "playing-free-spin",
        durationKey: "anticipation",
        play,
        playIndex,
        isFreeSpin,
        freeSpinNumber,
        freeSpinTotal: round.freeSpins.length,
      });
    steps.push({
      state: "anticipation",
      durationKey: "anticipation",
      play,
      playIndex,
      isFreeSpin,
      freeSpinNumber,
      freeSpinTotal: round.freeSpins.length,
    });
    steps.push({
      state: "initial-drop",
      durationKey: "initialDrop",
      play,
      playIndex,
      isFreeSpin,
      freeSpinNumber,
      freeSpinTotal: round.freeSpins.length,
    });
    steps.push({
      state: "evaluating",
      durationKey: play.cascades.length ? "evaluationPause" : "losingPause",
      play,
      playIndex,
      isFreeSpin,
      freeSpinNumber,
      freeSpinTotal: round.freeSpins.length,
    });
    play.cascades.forEach((cascade, cascadeIndex) => {
      for (const [state, durationKey] of [
        ["highlighting-win", "winHighlight"],
        ["showing-win-value", "winValueHold"],
        ["removing-symbols", "symbolRemoval"],
        ["collapsing-grid", "collapse"],
        ["dropping-new-symbols", "newSymbolDrop"],
        ["evaluating", "cascadePause"],
      ] as const)
        steps.push({
          state,
          durationKey,
          play,
          playIndex,
          cascade,
          cascadeIndex,
          isFreeSpin,
          freeSpinNumber,
          freeSpinTotal: round.freeSpins.length,
        });
    });
    const scatterTriggered = isFreeSpin
      ? play.awardedFreeSpins > 0
      : play.scatterPayout > 0;
    if (scatterTriggered)
      steps.push({
        state: "showing-scatter-result",
        durationKey: "scatterAnticipation",
        play,
        playIndex,
        isFreeSpin,
        freeSpinNumber,
        freeSpinTotal: round.freeSpins.length,
      });
    if (
      isFreeSpin &&
      play.collectedMultipliers.length &&
      play.clusterPayout > 0
    ) {
      const multiplierCells = play.finalGrid.filter(
        (cell) => cell.symbol === "MULTIPLIER",
      );
      steps.push({
        state: "revealing-multipliers",
        durationKey: "multiplierReveal",
        play,
        playIndex,
        isFreeSpin,
        freeSpinNumber,
        freeSpinTotal: round.freeSpins.length,
      });
      play.collectedMultipliers.forEach((multiplierValue, multiplierIndex) =>
        steps.push({
          state: "collecting-multiplier",
          durationKey: "multiplierCollect",
          play,
          playIndex,
          isFreeSpin,
          freeSpinNumber,
          freeSpinTotal: round.freeSpins.length,
          multiplierIndex,
          multiplierValue,
          multiplierCellId: multiplierCells[multiplierIndex]?.id,
        }),
      );
      steps.push({
        state: "applying-multipliers",
        play,
        playIndex,
        isFreeSpin,
        freeSpinNumber,
        freeSpinTotal: round.freeSpins.length,
      });
    }
    if (
      isFreeSpin &&
      play.totalPayout / round.stake >= MIN_CELEBRATION_MULTIPLIER
    )
      steps.push({
        state: "showing-big-win",
        play,
        playIndex,
        isFreeSpin,
        freeSpinNumber,
        freeSpinTotal: round.freeSpins.length,
      });
  };
  if (round.base) appendPlay(round.base, 0, false);
  if (round.freeSpins.length) {
    steps.push({
      state: "entering-bonus",
      play: round.freeSpins[0],
      playIndex: 1,
      isFreeSpin: true,
      freeSpinNumber: 1,
      freeSpinTotal: round.freeSpins.length,
    });
    round.freeSpins.forEach((play, index) =>
      appendPlay(play, index + 1, true, index + 1),
    );
    steps.push({
      state: "bonus-summary",
      play: round.freeSpins.at(-1)!,
      playIndex: round.freeSpins.length,
      isFreeSpin: true,
      freeSpinNumber: round.freeSpins.length,
      freeSpinTotal: round.freeSpins.length,
    });
  }
  steps.push({
    state: "counting-win",
    play: round.freeSpins.at(-1) ?? round.base!,
    playIndex: round.freeSpins.length,
    isFreeSpin: Boolean(round.freeSpins.length),
  });
  if (
    !round.freeSpins.length &&
    round.totalPayout / round.stake >= MIN_CELEBRATION_MULTIPLIER
  )
    steps.push({
      state: "showing-big-win",
      play: round.base!,
      playIndex: 0,
      isFreeSpin: false,
    });
  steps.push({
    state: "round-complete",
    play: round.freeSpins.at(-1) ?? round.base!,
    playIndex: round.freeSpins.length,
    isFreeSpin: Boolean(round.freeSpins.length),
  });
  return steps;
}

const timerWait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      },
      timer = setTimeout(done, milliseconds);
    signal.addEventListener("abort", done, { once: true });
  });

export class AnimationDirector {
  private controller?: AbortController;
  private phaseController?: AbortController;
  private accelerationTimer?: ReturnType<typeof setTimeout>;
  private activePlayIndex?: number;
  private activeState?: GameAnimationState;
  private acceleratedPlayIndex?: number;
  private fastForwardForRound = false;
  private paused = false;
  private pauseResolvers: Array<() => void> = [];
  private disposed = false;
  private turbo: boolean;
  private reduced: boolean;
  private waitImpl: DirectorOptions["wait"];
  constructor(options: DirectorOptions = {}) {
    this.turbo = Boolean(options.turbo);
    this.reduced = Boolean(options.reducedMotion);
    this.waitImpl = options.wait ?? timerWait;
  }
  get timings(): AnimationTimings {
    return this.reduced
      ? REDUCED_MOTION_TIMINGS
      : this.turbo || this.fastForwardForRound
        ? TURBO_TIMINGS
        : NORMAL_TIMINGS;
  }
  setTurboMode(enabled: boolean) {
    this.turbo = enabled;
  }
  setReducedMotion(enabled: boolean) {
    this.reduced = enabled;
  }
  activate() {
    this.disposed = false;
  }
  skipCurrentPhase() {
    this.phaseController?.abort();
  }
  accelerateCurrentPhase() {
    this.phaseController?.abort();
  }
  enableFastForwardForRound() {
    this.fastForwardForRound = true;
    this.accelerateCurrentPhase();
  }
  accelerateCurrentSpin() {
    if (this.activePlayIndex === undefined) return;
    this.acceleratedPlayIndex = this.activePlayIndex;
    this.enableFastForwardForRound();
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
    for (const resolve of this.pauseResolvers.splice(0)) resolve();
  }
  cancel() {
    clearTimeout(this.accelerationTimer);
    this.controller?.abort();
    this.phaseController?.abort();
  }
  dispose() {
    this.disposed = true;
    this.cancel();
    this.resume();
  }
  private async waitWhilePaused() {
    if (!this.paused) return;
    await new Promise<void>((resolve) => this.pauseResolvers.push(resolve));
  }
  async playRound(round: LemonzaRoundResult, callbacks: DirectorCallbacks) {
    this.cancel();
    this.activePlayIndex = undefined;
    this.activeState = undefined;
    this.acceleratedPlayIndex = undefined;
    this.fastForwardForRound = false;
    const controller = new AbortController();
    this.controller = controller;
    const timeline = buildAnimationTimeline(round);
    const tailStates = new Set<GameAnimationState>([
        "entering-bonus",
        "bonus-summary",
        "counting-win",
        "showing-big-win",
        "round-complete",
      ]),
      fallStates = new Set<GameAnimationState>([
        "anticipation",
        "initial-drop",
      ]);
    for (const step of timeline) {
      if (this.disposed || controller.signal.aborted) return "aborted" as const;
      if (
        this.acceleratedPlayIndex !== undefined &&
        (step.playIndex !== this.acceleratedPlayIndex ||
          tailStates.has(step.state))
      )
        this.acceleratedPlayIndex = undefined;
      await this.waitWhilePaused();
      if (this.disposed || controller.signal.aborted) return "aborted" as const;
      this.activePlayIndex = step.playIndex;
      this.activeState = step.state;
      const cascadeSpeed =
        step.cascadeIndex === undefined ? 1 : CASCADE_SPEED(step.cascadeIndex);
      const context = { ...step, round, cascadeSpeed };
      callbacks.onState?.(step.state);
      await callbacks.onStep(context);
      if (step.durationKey) {
        this.phaseController = new AbortController();
        const regularDuration = this.timings[step.durationKey] * cascadeSpeed,
          accelerated =
            this.fastForwardForRound ||
            (this.acceleratedPlayIndex === step.playIndex &&
              fallStates.has(step.state));
        const duration = accelerated
          ? Math.min(
              regularDuration,
              step.state === "anticipation"
                ? 70
                : step.state === "initial-drop"
                  ? 220
                  : regularDuration,
            )
          : regularDuration;
        await this.waitImpl!(duration, this.phaseController.signal);
      }
    }
    await callbacks.onComplete("completed");
    return "completed" as const;
  }
}
