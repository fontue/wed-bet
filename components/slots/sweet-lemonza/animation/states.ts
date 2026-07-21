import type {
  LemonzaCascade,
  LemonzaPlay,
  LemonzaRoundResult,
} from "@/domain/slots/sweet-lemonza/types";

export type GameAnimationState =
  | "idle"
  | "requesting-spin"
  | "anticipation"
  | "initial-drop"
  | "evaluating"
  | "highlighting-win"
  | "showing-win-value"
  | "removing-symbols"
  | "collapsing-grid"
  | "dropping-new-symbols"
  | "showing-scatter-result"
  | "entering-bonus"
  | "playing-free-spin"
  | "revealing-multipliers"
  | "collecting-multiplier"
  | "applying-multipliers"
  | "counting-win"
  | "showing-big-win"
  | "bonus-summary"
  | "round-complete"
  | "skipping";

export interface AnimationStep {
  state: GameAnimationState;
  durationKey?: keyof import("./timings").AnimationTimings;
  play: LemonzaPlay;
  playIndex: number;
  cascade?: LemonzaCascade;
  cascadeIndex?: number;
  isFreeSpin: boolean;
  freeSpinNumber?: number;
  freeSpinTotal?: number;
  multiplierIndex?: number;
  multiplierValue?: number;
  multiplierCellId?: number;
}

export interface AnimationStepContext extends AnimationStep {
  round: LemonzaRoundResult;
  cascadeSpeed: number;
}
