import type {
  DogHouseLineWin,
  DogHouseSpin,
} from "@/domain/slots/dog-house/types";

export type DogHouseAnimationState =
  | "idle"
  | "requesting-spin"
  | "starting-reels"
  | "spinning"
  | "landing-bonus"
  | "anticipating-bonus"
  | "confirming-bonus"
  | "stopping-reel"
  | "evaluating"
  | "highlighting-line"
  | "showing-line-win"
  | "collecting-win"
  | "showing-base-win"
  | "entering-bonus"
  | "revealing-free-spins"
  | "showing-free-spin-award"
  | "starting-free-spins"
  | "playing-free-spin"
  | "locking-sticky-wild"
  | "showing-free-spin-win"
  | "showing-big-win"
  | "bonus-summary"
  | "round-complete"
  | "skipping";

export type DogHouseSpeed = "normal" | "quick" | "turbo";
export type DogHouseCelebrationTier =
  "BRAVO" | "GRANDE" | "MAGNIFICO" | "FESTA";
export interface DogHouseAnimationStep {
  state: DogHouseAnimationState;
  duration?: keyof import("./animation-config").DogHouseTimings;
  spin: DogHouseSpin;
  spinIndex: number;
  isFreeSpin: boolean;
  freeSpinNumber?: number;
  reel?: number;
  line?: DogHouseLineWin;
  lineIndex?: number;
  tokenIndex?: number;
  tokenValue?: number;
  newStickyIndices?: number[];
  celebrationTier?: DogHouseCelebrationTier;
}
export interface DogHouseAnimationContext extends DogHouseAnimationStep {
  roundId: string;
  speed: DogHouseSpeed;
  reducedMotion: boolean;
}
