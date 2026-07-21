"use client";
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseDisplayCell } from "../animation/display-reels";
import { buildPresentationStrip } from "../animation/presentation-strips";
import { DogHouseSymbolIcon } from "../../dog-house-symbol";

export const DogHouseReel = memo(function DogHouseReel({
  reel,
  cells,
  spinning,
  stopping,
  speed,
  fastForward = false,
  reducedMotion,
  roundSeed,
  spinIndex,
  isFreeSpin,
}: {
  reel: number;
  cells: DogHouseDisplayCell[];
  spinning: boolean;
  stopping: boolean;
  speed: DogHouseSpeed;
  fastForward?: boolean;
  reducedMotion: boolean;
  roundSeed: string;
  spinIndex: number;
  isFreeSpin: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null),
    animationRef = useRef<Animation | null>(null);
  const strip = useMemo(() => {
    const filler = buildPresentationStrip({
        reel,
        roundSeed,
        spinIndex,
        isFreeSpin,
      }).slice(0, 8),
      targets = cells.map((cell) => ({
        id: Number(cell.roundCellId),
        symbol: cell.symbol,
        multiplier: cell.multiplier,
      })),
      track = [...targets, ...filler, ...filler],
      rows = 3 + filler.length * 2;
    return {
      track,
      rows,
      start: (-(3 + filler.length) / rows) * 100,
      end: (-3 / rows) * 100,
      key: `${roundSeed}-${spinIndex}-${reel}`,
    };
  }, [cells, isFreeSpin, reel, roundSeed, spinIndex]);
  const loopDuration = reducedMotion
      ? 700
      : speed === "turbo"
        ? 135
        : speed === "quick"
          ? 240
          : 380,
    stopDuration = reducedMotion
      ? 100
      : speed === "turbo"
        ? 90
        : speed === "quick"
          ? 165
          : reel === 4 && stopping
            ? 420
            : 300,
    spinKey = spinning ? strip.key : undefined;
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !spinKey) return;
    animationRef.current?.cancel();
    const animation = track.animate(
      [
        { transform: `translate3d(0,${strip.start}%,0)` },
        { transform: `translate3d(0,${strip.end}%,0)` },
      ],
      { duration: loopDuration, iterations: Infinity, easing: "linear" },
    );
    animation.playbackRate =
      fastForward || track.closest(".is-fast-forward") ? 4 : 1;
    animationRef.current = animation;
    return () => {
      animation.onfinish = null;
      animation.cancel();
      if (animationRef.current === animation) animationRef.current = null;
    };
  }, [fastForward, loopDuration, spinKey, strip.end, strip.start]);
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !spinning || !stopping) return;
    const current = getComputedStyle(track).transform;
    animationRef.current?.cancel();
    track.style.transform =
      current === "none" ? `translate3d(0,${strip.end}%,0)` : current;
    const landing = (0.08 / strip.rows) * 100,
      animation = track.animate(
        [
          {
            transform: track.style.transform,
            offset: 0,
            easing: "cubic-bezier(.18,.62,.2,1)",
          },
          {
            transform: `translate3d(0,${landing}%,0)`,
            offset: 0.82,
            easing: "ease-out",
          },
          {
            transform: `translate3d(0,${-landing * 0.5}%,0)`,
            offset: 0.93,
            easing: "ease-out",
          },
          { transform: "translate3d(0,0,0) scaleY(1)", offset: 1 },
        ],
        { duration: stopDuration, fill: "forwards" },
      );
    animation.playbackRate =
      fastForward || track.closest(".is-fast-forward") ? 4 : 1;
    animationRef.current = animation;
    return () => {
      animation.onfinish = null;
      animation.cancel();
      if (animationRef.current === animation) animationRef.current = null;
    };
  }, [fastForward, spinning, stopping, stopDuration, strip.end, strip.rows]);
  useEffect(() => {
    const root = trackRef.current?.closest(".dogslot-screen"),
      apply = () => {
        if (animationRef.current)
          animationRef.current.playbackRate =
            fastForward || root?.classList.contains("is-fast-forward") ? 4 : 1;
      };
    apply();
    if (!root) return;
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [fastForward]);
  const style = {
    "--dog-track-height": `${(strip.rows / 3) * 100}%`,
    "--dog-track-rows": strip.rows,
  } as CSSProperties;
  return (
    <div
      className={`dogslot-reel ${stopping ? "is-stopping" : ""}`}
      data-reel={reel}
    >
      <div
        className={`dogslot-reel-result ${spinning ? "is-spinning" : "is-landed"}`}
      >
        {cells.map((cell) => (
          <div
            className={`dogslot-cell ${cell.isWinning ? "is-winning" : ""} ${cell.isDimmed ? "is-dimmed" : ""} ${cell.isSticky ? "is-sticky" : ""} ${cell.isNewSticky ? "is-new-sticky" : ""} ${cell.isBonus ? "is-bonus" : ""}`}
            key={cell.animationId}
            data-animation-id={cell.animationId}
            data-cell-index={cell.row * 5 + cell.reel}
            role="gridcell"
          >
            <DogHouseSymbolIcon
              cell={{
                id: Number(cell.roundCellId),
                symbol: cell.symbol,
                multiplier: cell.multiplier,
              }}
            />
          </div>
        ))}
      </div>
      {spinning && (
        <div
          className={`dogslot-target-strip ${stopping ? "is-stopping" : ""} ${reducedMotion ? "is-reduced" : ""}`}
          style={style}
          aria-hidden="true"
        >
          <div ref={trackRef}>
            {strip.track.map((cell, index) => (
              <span key={`${cell.id}-${index}`}>
                <DogHouseSymbolIcon cell={cell} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
