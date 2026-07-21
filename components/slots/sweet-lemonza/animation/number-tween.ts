export interface NumberTweenOptions {
  from: number;
  to: number;
  duration: number;
  onUpdate: (value: number) => void;
  signal?: AbortSignal;
  reducedMotion?: boolean;
}
export const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

export function animateNumber({
  from,
  to,
  duration,
  onUpdate,
  signal,
  reducedMotion,
}: NumberTweenOptions): Promise<void> {
  if (reducedMotion || duration <= 0 || from === to) {
    onUpdate(to);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const started = performance.now();
    let frame = 0,
      lastPaint = started - 34,
      lastValue = from,
      finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      if (lastValue !== to) onUpdate(to);
      resolve();
    };
    const tick = (now: number) => {
      if (signal?.aborted) {
        finish();
        return;
      }
      const progress = Math.min(1, (now - started) / duration),
        value = Math.round(from + (to - from) * easeOutCubic(progress));
      if (progress >= 1 || now - lastPaint >= 32) {
        if (value !== lastValue) onUpdate(value);
        lastValue = value;
        lastPaint = now;
      }
      if (progress >= 1) finish();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });
}
