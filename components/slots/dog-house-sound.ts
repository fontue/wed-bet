export type DogHouseSoundEvent =
  | "spin"
  | "reel-stop"
  | "paw"
  | "anticipation"
  | "wild-lock"
  | "line-win"
  | "bonus-trigger"
  | "token-reveal"
  | "bonus-ready"
  | "free-spin"
  | "bonus-summary";

type Tone = {
  frequency: number;
  end?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  delay?: number;
};

export class DogHouseSoundManager {
  private context?: AudioContext;
  private muted = false;
  private hidden = false;
  private voices = 0;

  constructor() {
    if (typeof document !== "undefined") {
      this.hidden = document.hidden;
      document.addEventListener("visibilitychange", this.onVisibility);
    }
  }

  private onVisibility = () => {
    this.hidden = document.hidden;
    if (this.hidden) void this.context?.suspend();
  };

  setMuted(value: boolean) {
    this.muted = value;
    if (value) void this.context?.suspend();
    else void this.unlock();
  }

  async unlock() {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (!this.muted && !this.hidden && this.context.state === "suspended")
      await this.context.resume();
  }

  private tone({ frequency, end, duration, volume, type, delay = 0 }: Tone) {
    const context = this.context;
    if (!context || this.muted || this.hidden || this.voices >= 12) return;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    const start = context.currentTime + delay,
      finish = start + duration;
    this.voices += 1;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, finish);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      start + Math.min(0.018, duration / 4),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, finish);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(finish + 0.01);
    oscillator.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  play(event: DogHouseSoundEvent, step = 0) {
    if (this.muted || this.hidden) return;
    void this.unlock().then(() => {
      if (event === "spin") {
        this.tone({
          frequency: 112,
          end: 72,
          duration: 0.34,
          volume: 0.035,
          type: "triangle",
        });
        this.tone({
          frequency: 58,
          end: 46,
          duration: 0.4,
          volume: 0.03,
          type: "sine",
        });
      }
      if (event === "reel-stop") {
        this.tone({
          frequency: 118 + step * 7,
          end: 88 + step * 5,
          duration: 0.09,
          volume: 0.042,
          type: "triangle",
        });
      }
      if (event === "paw") {
        this.tone({
          frequency: 196 + step * 28,
          end: 247 + step * 34,
          duration: 0.22,
          volume: 0.045,
          type: "sine",
        });
      }
      if (event === "anticipation") {
        [110, 123.47].forEach((frequency, index) =>
          this.tone({
            frequency,
            end: frequency * 0.92,
            duration: 0.28,
            volume: 0.026,
            type: "sine",
            delay: index * 0.13,
          }),
        );
      }
      if (event === "wild-lock") {
        this.tone({
          frequency: 174.61,
          end: 261.63,
          duration: 0.3,
          volume: 0.045,
          type: "triangle",
        });
        this.tone({
          frequency: 87.31,
          duration: 0.34,
          volume: 0.025,
          type: "sine",
        });
      }
      if (event === "line-win") {
        this.tone({
          frequency: 261.63 + step * 18,
          end: 329.63 + step * 22,
          duration: 0.22,
          volume: 0.035,
          type: "sine",
        });
      }
      if (event === "bonus-trigger") {
        [196, 246.94, 293.66, 392].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: index === 3 ? 0.65 : 0.27,
            volume: 0.04,
            type: "triangle",
            delay: index * 0.11,
          }),
        );
      }
      if (event === "token-reveal") {
        this.tone({
          frequency: 220 + step * 18,
          end: 277 + step * 22,
          duration: 0.16,
          volume: 0.035,
          type: "triangle",
        });
      }
      if (event === "bonus-ready") {
        [261.63, 329.63, 392].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: 0.38,
            volume: 0.035,
            type: "sine",
            delay: index * 0.08,
          }),
        );
      }
      if (event === "free-spin") {
        this.tone({
          frequency: 130.81,
          end: 196,
          duration: 0.23,
          volume: 0.03,
          type: "triangle",
        });
      }
      if (event === "bonus-summary") {
        [392, 329.63, 261.63, 392].forEach((frequency, index) =>
          this.tone({
            frequency,
            duration: index === 3 ? 0.55 : 0.2,
            volume: 0.035,
            type: "sine",
            delay: index * 0.09,
          }),
        );
      }
    });
  }

  dispose() {
    if (typeof document !== "undefined")
      document.removeEventListener("visibilitychange", this.onVisibility);
    void this.context?.close();
  }
}
