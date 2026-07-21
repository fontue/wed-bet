export type SoundEvent =
  | "spin-press"
  | "symbols-drop"
  | "symbol-land"
  | "win-highlight"
  | "symbol-pop"
  | "cascade"
  | "scatter-land-1"
  | "scatter-land-2"
  | "scatter-anticipation"
  | "bonus-trigger"
  | "free-spin-start"
  | "multiplier-land-small"
  | "multiplier-land-large"
  | "multiplier-add"
  | "multiplier-apply"
  | "win-count"
  | "big-win"
  | "bonus-summary";

interface Tone {
  frequency: number;
  endFrequency?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  attack?: number;
}
const SOUND: Record<
  Exclude<
    SoundEvent,
    "bonus-trigger" | "scatter-anticipation" | "big-win" | "bonus-summary"
  >,
  Tone
> = {
  "spin-press": {
    frequency: 245,
    endFrequency: 185,
    duration: 0.09,
    volume: 0.035,
    type: "sine",
  },
  "symbols-drop": {
    frequency: 390,
    endFrequency: 205,
    duration: 0.15,
    volume: 0.032,
    type: "triangle",
  },
  "symbol-land": {
    frequency: 155,
    endFrequency: 110,
    duration: 0.075,
    volume: 0.025,
    type: "sine",
  },
  "win-highlight": {
    frequency: 659,
    endFrequency: 784,
    duration: 0.22,
    volume: 0.052,
    type: "sine",
    attack: 0.018,
  },
  "symbol-pop": {
    frequency: 920,
    endFrequency: 510,
    duration: 0.11,
    volume: 0.038,
    type: "triangle",
  },
  cascade: {
    frequency: 440,
    endFrequency: 587,
    duration: 0.15,
    volume: 0.045,
    type: "triangle",
    attack: 0.012,
  },
  "scatter-land-1": {
    frequency: 587,
    endFrequency: 698,
    duration: 0.2,
    volume: 0.045,
    type: "sine",
    attack: 0.015,
  },
  "scatter-land-2": {
    frequency: 698,
    endFrequency: 880,
    duration: 0.24,
    volume: 0.052,
    type: "sine",
    attack: 0.015,
  },
  "free-spin-start": {
    frequency: 330,
    endFrequency: 440,
    duration: 0.12,
    volume: 0.03,
    type: "triangle",
    attack: 0.01,
  },
  "multiplier-land-small": {
    frequency: 392,
    endFrequency: 523,
    duration: 0.18,
    volume: 0.045,
    type: "square",
    attack: 0.012,
  },
  "multiplier-land-large": {
    frequency: 196,
    endFrequency: 392,
    duration: 0.34,
    volume: 0.06,
    type: "sawtooth",
    attack: 0.025,
  },
  "multiplier-add": {
    frequency: 784,
    endFrequency: 988,
    duration: 0.17,
    volume: 0.045,
    type: "sine",
    attack: 0.01,
  },
  "multiplier-apply": {
    frequency: 392,
    endFrequency: 784,
    duration: 0.42,
    volume: 0.062,
    type: "triangle",
    attack: 0.025,
  },
  "win-count": {
    frequency: 784,
    endFrequency: 880,
    duration: 0.065,
    volume: 0.018,
    type: "sine",
  },
};

export class LemonzaSoundManager {
  private context?: AudioContext;
  private muted = false;
  private hidden = false;
  private active = 0;
  private maxVoices = 14;
  private warmth = 0.72;
  constructor() {
    if (typeof document !== "undefined") {
      this.hidden = document.hidden;
      document.addEventListener("visibilitychange", this.visibility);
    }
  }
  private visibility = () => {
    this.hidden = document.hidden;
    if (this.hidden) this.context?.suspend();
  };
  setMuted(value: boolean) {
    this.muted = value;
    if (value) this.context?.suspend();
  }
  async unlock() {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      this.context ??= new AudioContextClass();
      if (!this.muted && !this.hidden && this.context.state === "suspended")
        await this.context.resume();
    } catch {
      /* Audio availability never controls gameplay. */
    }
  }
  private tone(context: AudioContext, tone: Tone, pitch = 1, delay = 0) {
    if (this.active >= this.maxVoices) return;
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      start = context.currentTime + delay,
      attack = Math.min(tone.attack ?? 0.006, tone.duration * 0.25),
      end = start + tone.duration,
      voicing = pitch * this.warmth;
    this.active += 1;
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency * voicing, start);
    if (tone.endFrequency)
      oscillator.frequency.exponentialRampToValueAtTime(
        tone.endFrequency * voicing,
        end,
      );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.volume * 0.78, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.onended = () => {
      this.active = Math.max(0, this.active - 1);
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  private scatterFanfare(context: AudioContext, pitch: number) {
    [523.25, 659.25, 783.99].forEach((frequency, index) =>
      this.tone(
        context,
        {
          frequency,
          duration: 0.2 + index * 0.04,
          volume: 0.038,
          type: "sine",
          attack: 0.012,
        },
        pitch,
        index * 0.095,
      ),
    );
    this.tone(
      context,
      {
        frequency: 261.63,
        endFrequency: 523.25,
        duration: 0.5,
        volume: 0.028,
        type: "triangle",
        attack: 0.025,
      },
      pitch,
      0.18,
    );
  }
  private bonusFanfare(context: AudioContext, pitch: number) {
    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((frequency, index) => {
      this.tone(
        context,
        {
          frequency,
          duration: index === 3 ? 0.72 : 0.3,
          volume: index === 3 ? 0.06 : 0.044,
          type: "triangle",
          attack: 0.014,
        },
        pitch,
        index * 0.105,
      );
      this.tone(
        context,
        {
          frequency: frequency * 2,
          duration: index === 3 ? 0.62 : 0.24,
          volume: 0.016,
          type: "sine",
          attack: 0.008,
        },
        pitch,
        index * 0.105,
      );
    });
    [523.25, 659.25, 783.99].forEach((frequency) =>
      this.tone(
        context,
        {
          frequency,
          duration: 0.7,
          volume: 0.018,
          type: "sine",
          attack: 0.035,
        },
        pitch,
        0.34,
      ),
    );
  }
  private bigWinFanfare(context: AudioContext, pitch: number) {
    [392, 523.25, 659.25, 783.99].forEach((frequency, index) =>
      this.tone(
        context,
        {
          frequency,
          duration: 0.34 + index * 0.08,
          volume: 0.04,
          type: index === 3 ? "sine" : "triangle",
          attack: 0.02,
        },
        pitch,
        index * 0.085,
      ),
    );
  }
  private summaryFanfare(context: AudioContext, pitch: number) {
    [783.99, 659.25, 523.25, 659.25].forEach((frequency, index) =>
      this.tone(
        context,
        {
          frequency,
          duration: index === 3 ? 0.52 : 0.22,
          volume: 0.036,
          type: "sine",
          attack: 0.015,
        },
        pitch,
        index * 0.09,
      ),
    );
  }
  play(event: SoundEvent, pitch = 1) {
    if (this.muted || this.hidden) return;
    void this.unlock()
      .then(() => {
        const context = this.context;
        if (!context || this.muted || this.hidden) return;
        if (event === "bonus-trigger") return this.bonusFanfare(context, pitch);
        if (event === "scatter-anticipation")
          return this.scatterFanfare(context, pitch);
        if (event === "big-win") return this.bigWinFanfare(context, pitch);
        if (event === "bonus-summary")
          return this.summaryFanfare(context, pitch);
        this.tone(context, SOUND[event], pitch);
        if (event === "symbols-drop")
          this.tone(
            context,
            {
              frequency: 105,
              endFrequency: 72,
              duration: 0.18,
              volume: 0.022,
              type: "sine",
            },
            pitch,
            0.015,
          );
        if (event === "win-highlight")
          this.tone(
            context,
            {
              frequency: 440,
              endFrequency: 523.25,
              duration: 0.28,
              volume: 0.022,
              type: "triangle",
              attack: 0.02,
            },
            pitch,
            0.035,
          );
        if (event === "cascade")
          this.tone(
            context,
            {
              frequency: 164.81,
              endFrequency: 220,
              duration: 0.2,
              volume: 0.026,
              type: "sine",
              attack: 0.015,
            },
            pitch,
          );
        if (event === "multiplier-apply")
          this.tone(
            context,
            {
              frequency: 196,
              endFrequency: 392,
              duration: 0.48,
              volume: 0.028,
              type: "sine",
              attack: 0.03,
            },
            pitch,
            0.025,
          );
      })
      .catch(() => undefined);
  }
  stop() {
    this.context?.suspend();
    this.active = 0;
  }
  diagnostics() {
    return {
      activeVoices: this.active,
      activeLoops: 0,
      contextState: this.context?.state ?? "unavailable",
    };
  }
  dispose() {
    if (typeof document !== "undefined")
      document.removeEventListener("visibilitychange", this.visibility);
    void this.context?.close();
  }
}
