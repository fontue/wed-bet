"use client";
import { formatLira } from "@/domain/market";
import { applyFreeSpinMultiplier } from "@/domain/slots/sweet-lemonza/math";
import { winTierByMultiplier } from "../config/animation-config";
import type { GameAnimationState } from "../animation/states";

export function CascadeWinLabel({
  value,
  visible,
}: {
  value: number;
  visible: boolean;
}) {
  if (!visible || !value) return null;
  return (
    <div className="lemonza-cascade-label" aria-live="polite">
      +{formatLira(value)}
    </div>
  );
}
export function ScatterOverlay({
  count,
  isFreeSpin,
}: {
  count: number;
  isFreeSpin: boolean;
}) {
  const triggered = isFreeSpin ? count >= 3 : count >= 4;
  if (!triggered) return null;
  const label = isFreeSpin
    ? "+5 · La festa continua!"
    : `${count} AMORE · 10 GIRI GRATIS`;
  return (
    <div className={`lemonza-scatter-callout scatter-${Math.min(count, 4)}`}>
      <span>{label}</span>
    </div>
  );
}
export function BonusIntro({
  total,
  onContinue,
}: {
  total: number;
  onContinue: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className="lemonza-bonus-intro"
      aria-label="Начать бесплатные вращения"
    >
      <div className="lemonza-light-wave" />
      <strong>{Math.min(10, total)} GIRI GRATIS</strong>
      <span>La festa comincia!</span>
      <small>Нажмите, чтобы начать</small>
    </button>
  );
}
export function BonusSpinCounter({
  win,
  baseWin,
  multiplier,
  multiplierActive,
}: {
  win: number;
  baseWin: number;
  multiplier: number;
  multiplierActive: boolean;
}) {
  const shownMultiplier = Math.max(1, multiplier),
    fixedWin = multiplierActive ? baseWin : win,
    multipliedWin = applyFreeSpinMultiplier(baseWin, shownMultiplier);
  return (
    <div
      className={`lemonza-spin-win-counter ${multiplierActive ? "is-formula" : ""}`}
    >
      <small>Выигрыш</small>
      <strong>{formatLira(fixedWin)}</strong>
      {multiplierActive && (
        <>
          <span className="lemonza-math-sign" aria-hidden="true">
            ×
          </span>
          <b key={shownMultiplier}>{shownMultiplier}</b>
          <span className="lemonza-math-sign" aria-hidden="true">
            =
          </span>
          <strong key={multipliedWin} className="lemonza-multiplied-win">
            {formatLira(multipliedWin)}
          </strong>
        </>
      )}
    </div>
  );
}
export function BigWinOverlay({
  win,
  stake,
  onContinue,
}: {
  win: number;
  stake: number;
  onContinue: () => void;
}) {
  const multiplier = win / stake,
    tier = winTierByMultiplier(multiplier);
  return (
    <button
      type="button"
      onClick={onContinue}
      className={`lemonza-big-win ${tier.className}`}
      aria-label={`${tier.label}. Продолжить`}
    >
      <span className="lemonza-big-win-shadow">{tier.label}</span>
      <strong>{tier.label}</strong>
      <b>{formatLira(win)}</b>
      <small>Нажмите, чтобы продолжить</small>
    </button>
  );
}
export function BonusSummary({
  freeSpins,
  win,
  onContinue,
}: {
  freeSpins: number;
  win: number;
  onContinue: () => void;
}) {
  return (
    <div className="lemonza-bonus-summary">
      <section
        className="lemonza-bonus-summary-card"
        aria-labelledby="lemonza-bonus-summary-title"
      >
        <div className="lemonza-bonus-summary-lemon" aria-hidden="true">
          🍋
        </div>
        <span>Festa conclusa</span>
        <h2 id="lemonza-bonus-summary-title">Бонус завершён</h2>
        <div className="lemonza-bonus-summary-prize">
          <small>Выигрыш за бонус</small>
          <strong>{formatLira(win)}</strong>
        </div>
        <div className="lemonza-bonus-summary-spins">
          <span>Сыграно фриспинов</span>
          <b>{freeSpins}</b>
        </div>
        <button type="button" onClick={onContinue}>
          Забрать выигрыш
        </button>
      </section>
    </div>
  );
}
export function AnimationStatus({ state }: { state: GameAnimationState }) {
  return (
    <span className="sr-only" aria-live="polite">
      {state}
    </span>
  );
}
