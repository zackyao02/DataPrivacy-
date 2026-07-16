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
        this.tone({ frequency: 440, duration: 0.08, type: "sine", startTime: now });
        this.tone({ frequency: 880, duration: 0.05, type: "triangle", startTime: now + 0.05 });
        break;
      case "slot-click":
        this.noise({ duration: 0.035, gain: 0.08 });
        this.tone({ frequency: 360, duration: 0.04, type: "square", startTime: now });
        break;
      case "package-seal":
        this.tone({ frequency: 220, duration: 0.08, type: "sawtooth", startTime: now });
        this.tone({ frequency: 660, duration: 0.12, type: "triangle", startTime: now + 0.08 });
        break;
      case "neon-charge":
        this.tone({ frequency: 330, duration: 0.06, type: "sine", startTime: now });
        this.tone({ frequency: 660, duration: 0.08, type: "sine", startTime: now + 0.04 });
        this.tone({ frequency: 990, duration: 0.1, type: "triangle", startTime: now + 0.09 });
        break;
      case "glitch-fail":
        this.noise({ duration: 0.16, gain: 0.12 });
        this.tone({ frequency: 90, duration: 0.14, type: "sawtooth", startTime: now });
        break;
      case "coin-burst":
        [523, 659, 784].forEach((frequency, index) => {
          this.tone({ frequency, duration: 0.07, type: "triangle", startTime: now + index * 0.045 });
        });
        break;
      case "transaction-seal":
        this.tone({ frequency: 494, duration: 0.07, type: "triangle", startTime: now });
        this.tone({ frequency: 247, duration: 0.12, type: "square", startTime: now + 0.06 });
        this.noise({ duration: 0.04, gain: 0.035 });
        break;
      case "risk-ping":
        this.tone({ frequency: 1046, duration: 0.06, type: "square", startTime: now });
        this.tone({ frequency: 698, duration: 0.08, type: "square", startTime: now + 0.07 });
        break;
      case "crt-news":
        this.noise({ duration: 0.08, gain: 0.06 });
        this.tone({ frequency: 180, duration: 0.18, type: "triangle", startTime: now + 0.04 });
        break;
      case "news-broadcast":
        this.noise({ duration: 0.05, gain: 0.045 });
        this.tone({ frequency: 262, duration: 0.08, type: "triangle", startTime: now + 0.02 });
        this.tone({ frequency: 392, duration: 0.1, type: "triangle", startTime: now + 0.09 });
        this.tone({ frequency: 196, duration: 0.16, type: "sine", startTime: now + 0.18 });
        break;
      case "news-ticker":
        [880, 740, 660, 740].forEach((frequency, index) => {
          this.tone({ frequency, duration: 0.035, type: "square", startTime: now + index * 0.045 });
        });
        break;
      case "emotion-select":
        this.tone({ frequency: 330, duration: 0.05, type: "sine", startTime: now });
        this.tone({ frequency: 495, duration: 0.09, type: "sine", startTime: now + 0.04 });
        break;
      case "emotion-empathy":
        this.tone({ frequency: 392, duration: 0.08, type: "sine", startTime: now });
        this.tone({ frequency: 523, duration: 0.12, type: "triangle", startTime: now + 0.05 });
        break;
      case "emotion-anger":
        this.noise({ duration: 0.06, gain: 0.07 });
        this.tone({ frequency: 196, duration: 0.08, type: "sawtooth", startTime: now });
        this.tone({ frequency: 784, duration: 0.05, type: "square", startTime: now + 0.06 });
        break;
      case "emotion-numbness":
        this.tone({ frequency: 294, duration: 0.13, type: "sine", startTime: now });
        this.tone({ frequency: 247, duration: 0.16, type: "sine", startTime: now + 0.08 });
        break;
      case "bgm-blackbox":
        this.switchBgm([110, 165, 220], 0.032);
        break;
      case "bgm-pressure":
        this.switchBgm([92, 138, 277], 0.04);
        break;
      case "bgm-silence":
        this.stopBgm();
        break;
      case "conscience-shift":
        this.tone({ frequency: 260, duration: 0.12, type: "triangle", startTime: now });
        break;
      case "ending-stinger":
        this.tone({ frequency: 110, duration: 0.28, type: "sawtooth", startTime: now });
        this.noise({ duration: 0.2, gain: 0.05 });
        break;
    }
  }

  private switchBgm(frequencies: readonly number[], gainValue: number): void {
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
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 4;
      oscillator.connect(gain);
      oscillator.start(now);
      return oscillator;
    });
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

    this.bgmOscillators = [];
    this.bgmGain = null;
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
    gain.gain.exponentialRampToValueAtTime(0.14, options.startTime + 0.012);
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
