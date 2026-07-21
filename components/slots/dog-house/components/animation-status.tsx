import type { DogHouseAnimationState } from "../animation/animation-types";
export function AnimationStatus({ state }: { state: DogHouseAnimationState }) {
  return (
    <span className="sr-only" aria-live="polite">
      {state}
    </span>
  );
}
