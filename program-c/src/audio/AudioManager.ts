import { SOUND_EVENT_MAP, type GameSoundEventName, type SoundId } from "./soundMap";

export interface AudioManagerOptions {
  readonly masterVolume?: number;
  readonly enabled?: boolean;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private bgmTimers: number[] = [];
  private enabled: boolean;
  private masterVolume: number;

  constructor(options: AudioManagerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.masterVolume = options.masterVolume ?? 0.72;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.stopBgm();
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  async unlock(): Promise<void> {
    const context = this.ensureContext();

    if (context.state === "suspended") {
      await context.resume();
    }
  }

  handleGameEvent(eventName: string): void {
    const soundId = SOUND_EVENT_MAP[eventName as GameSoundEventName];

    if (soundId) {
      this.play(soundId);
    }
  }

  play(soundId: SoundId): void {
    if (!this.enabled) {
      return;
    }

    const context = this.ensureContext();
    const now = context.currentTime;

    switch (soundId) {
      case "data-pulse":
        this.arpeggio([261.63, 329.63, 392, 523.25], now, 0.045, 0.09, "triangle", 0.09);
        break;
      case "slot-click":
        this.tone({ frequency: 659.25, duration: 0.045, type: "triangle", startTime: now, gain: 0.08 });
        this.tone({ frequency: 987.77, duration: 0.07, type: "sine", startTime: now + 0.035, gain: 0.07 });
        break;
      case "package-seal":
        this.arpeggio([196, 261.63, 329.63, 392], now, 0.055, 0.12, "triangle", 0.08);
        this.chord([196, 293.66, 392], now + 0.22, 0.22, "sine", 0.045);
        break;
      case "neon-charge":
        this.arpeggio([220, 277.18, 329.63, 440, 554.37, 659.25], now, 0.04, 0.1, "sine", 0.075);
        this.tone({ frequency: 880, duration: 0.18, type: "triangle", startTime: now + 0.2, gain: 0.06 });
        break;
      case "glitch-fail":
        this.chord([174.61, 185, 233.08], now, 0.16, "sawtooth", 0.045);
        this.tone({ frequency: 87.31, duration: 0.24, type: "triangle", startTime: now + 0.1, gain: 0.08 });
        this.noise({ duration: 0.08, gain: 0.04 });
        break;
      case "coin-burst":
        this.arpeggio([523.25, 659.25, 783.99, 1046.5], now, 0.05, 0.1, "triangle", 0.08);
        this.chord([523.25, 659.25, 783.99], now + 0.18, 0.18, "sine", 0.04);
        break;
      case "transaction-seal":
        this.arpeggio([392, 329.63, 261.63], now, 0.075, 0.15, "triangle", 0.075);
        this.chord([130.81, 196, 261.63], now + 0.24, 0.28, "sine", 0.045);
        break;
      case "risk-ping":
        this.arpeggio([880, 739.99, 698.46], now, 0.055, 0.09, "square", 0.06);
        break;
      case "crt-news":
        this.newsBell(now, 0.85);
        break;
      case "news-broadcast":
        this.newsBell(now, 1);
        this.chord([196, 246.94, 392], now + 0.24, 0.2, "sine", 0.035);
        break;
      case "news-ticker":
        this.arpeggio([987.77, 783.99, 880, 659.25], now, 0.045, 0.055, "triangle", 0.07);
        break;
      case "opinion-pulse":
        this.arpeggio([392, 466.16, 554.37, 466.16], now, 0.06, 0.11, "square", 0.052);
        this.noise({ duration: 0.035, gain: 0.018 });
        break;
      case "emotion-select":
        this.arpeggio([329.63, 392, 493.88], now, 0.055, 0.1, "sine", 0.07);
        break;
      case "emotion-empathy":
        this.arpeggio([293.66, 349.23, 440, 587.33], now, 0.07, 0.18, "sine", 0.055);
        this.chord([293.66, 440, 587.33], now + 0.28, 0.25, "triangle", 0.035);
        break;
      case "emotion-anger":
        this.arpeggio([196, 233.08, 277.18, 466.16], now, 0.045, 0.1, "sawtooth", 0.055);
        this.noise({ duration: 0.045, gain: 0.035 });
        break;
      case "emotion-numbness":
        this.tone({ frequency: 261.63, duration: 0.24, type: "sine", startTime: now, gain: 0.045 });
        this.tone({ frequency: 196, duration: 0.32, type: "sine", startTime: now + 0.16, gain: 0.038 });
        this.tone({ frequency: 164.81, duration: 0.28, type: "triangle", startTime: now + 0.32, gain: 0.032 });
        break;
      case "challenge-success":
        this.arpeggio([261.63, 329.63, 392, 659.25], now, 0.07, 0.15, "triangle", 0.07);
        this.chord([329.63, 392, 659.25], now + 0.28, 0.22, "sine", 0.04);
        break;
      case "challenge-fail":
        this.chord([196, 207.65, 261.63], now, 0.2, "sawtooth", 0.04);
        this.arpeggio([261.63, 220, 174.61], now + 0.08, 0.09, 0.16, "triangle", 0.06);
        this.noise({ duration: 0.09, gain: 0.035 });
        break;
      case "blackbox-voice":
        this.tone({ frequency: 73.42, duration: 0.18, type: "sine", startTime: now, gain: 0.035 });
        this.tone({ frequency: 146.83, duration: 0.12, type: "triangle", startTime: now + 0.05, gain: 0.028 });
        this.noise({ duration: 0.045, gain: 0.012 });
        break;
      case "bgm-blackbox":
        this.switchBgm([55, 110, 165], 0.026, "blackbox");
        break;
      case "bgm-pressure":
        this.switchBgm([46, 92, 185], 0.034, "pressure");
        break;
      case "bgm-silence":
        this.stopBgm();
        break;
      case "conscience-shift":
        this.arpeggio([196, 261.63, 329.63, 523.25], now, 0.065, 0.13, "triangle", 0.06);
        break;
      case "ending-stinger":
        this.chord([65.41, 98, 130.81, 196], now, 0.55, "sawtooth", 0.04);
        this.arpeggio([392, 329.63, 261.63, 196], now + 0.15, 0.12, 0.22, "triangle", 0.055);
        break;
    }
  }

  private arpeggio(
    frequencies: readonly number[],
    startTime: number,
    step: number,
    duration: number,
    type: OscillatorType,
    gain = 0.08,
  ): void {
    frequencies.forEach((frequency, index) => {
      this.tone({
        frequency,
        duration,
        type,
        startTime: startTime + index * step,
        gain,
      });
    });
  }

  private chord(
    frequencies: readonly number[],
    startTime: number,
    duration: number,
    type: OscillatorType,
    gain = 0.045,
  ): void {
    frequencies.forEach((frequency) => {
      this.tone({ frequency, duration, type, startTime, gain });
    });
  }

  private newsBell(startTime: number, gainScale: number): void {
    this.noise({ duration: 0.045, gain: 0.018 * gainScale });
    this.arpeggio([392, 523.25, 659.25, 783.99], startTime + 0.02, 0.052, 0.1, "triangle", 0.065 * gainScale);
    this.tone({
      frequency: 523.25,
      duration: 0.16,
      type: "sine",
      startTime: startTime + 0.24,
      gain: 0.05 * gainScale,
    });
  }

  private switchBgm(
    frequencies: readonly number[],
    gainValue: number,
    pattern: "blackbox" | "pressure",
  ): void {
    if (!this.enabled) {
      return;
    }

    const context = this.ensureContext();
    const output = this.masterGain;

    if (!output) {
      return;
    }

    this.stopBgm();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.4);
    gain.connect(output);

    this.bgmGain = gain;
    this.bgmOscillators = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : "sawtooth";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = pattern === "pressure" ? index * 9 : index * 3;
      oscillator.connect(gain);
      oscillator.start(now);
      return oscillator;
    });

    if (pattern === "blackbox") {
      this.bgmTimers.push(
        window.setInterval(() => {
          if (!this.enabled || !this.context) {
            return;
          }

          const startTime = this.context.currentTime;
          this.arpeggio([220, 277.18, 329.63, 277.18], startTime, 0.18, 0.22, "sine", 0.026);
        }, 1800),
      );
      this.bgmTimers.push(
        window.setInterval(() => {
          if (!this.enabled || !this.context) {
            return;
          }

          this.noise({ duration: 0.075, gain: 0.018 });
        }, 3100),
      );
      return;
    }

    this.bgmTimers.push(
      window.setInterval(() => {
        if (!this.enabled || !this.context) {
          return;
        }

        const startTime = this.context.currentTime;
        this.arpeggio([184.99, 220, 246.94, 277.18], startTime, 0.12, 0.16, "triangle", 0.032);
      }, 620),
    );
    this.bgmTimers.push(
      window.setInterval(() => {
        if (!this.enabled || !this.context) {
          return;
        }

        const startTime = this.context.currentTime;
        this.arpeggio([987.77, 739.99, 659.25], startTime, 0.07, 0.08, "sine", 0.035);
        this.noise({ duration: 0.025, gain: 0.014 });
      }, 1650),
    );
  }

  private stopBgm(): void {
    const context = this.context;
    const now = context?.currentTime ?? 0;

    if (context && this.bgmGain) {
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }

    for (const oscillator of this.bgmOscillators) {
      try {
        oscillator.stop(context ? now + 0.18 : undefined);
      } catch {
        // Oscillators may already be stopped when the BGM mode switches quickly.
      }
    }

    for (const timer of this.bgmTimers) {
      window.clearInterval(timer);
    }

    this.bgmOscillators = [];
    this.bgmGain = null;
    this.bgmTimers = [];
  }

  private ensureContext(): AudioContext {
    if (this.context && this.masterGain) {
      return this.context;
    }

    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  private tone(options: {
    readonly frequency: number;
    readonly duration: number;
    readonly type: OscillatorType;
    readonly startTime: number;
    readonly gain?: number;
  }): void {
    const context = this.ensureContext();
    const output = this.masterGain;

    if (!output) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = options.type;
    oscillator.frequency.value = options.frequency;
    gain.gain.setValueAtTime(0.0001, options.startTime);
    gain.gain.exponentialRampToValueAtTime(options.gain ?? 0.12, options.startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, options.startTime + options.duration);

    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(options.startTime);
    oscillator.stop(options.startTime + options.duration + 0.02);
  }

  private noise(options: { readonly duration: number; readonly gain: number }): void {
    const context = this.ensureContext();
    const output = this.masterGain;

    if (!output) {
      return;
    }

    const sampleCount = Math.max(1, Math.floor(context.sampleRate * options.duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = buffer;
    gain.gain.value = options.gain;
    source.connect(gain);
    gain.connect(output);
    source.start();
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
