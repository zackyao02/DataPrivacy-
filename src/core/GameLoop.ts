export interface LoopFrame {
  readonly deltaTime: number;
  readonly elapsedTime: number;
  readonly frameNumber: number;
}

interface GameLoopCallbacks {
  update(frame: LoopFrame): void;
  render(frame: LoopFrame): void;
}

const MAX_DELTA_TIME = 0.1;

export class GameLoop {
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private elapsedTime = 0;
  private frameNumber = 0;
  private running = false;
  private destroyed = false;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    this.resume();
  }

  pause(): void {
    if (!this.running || this.destroyed) {
      return;
    }

    this.running = false;
    this.lastTimestamp = null;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (this.running || this.destroyed) {
      return;
    }

    this.running = true;
    this.lastTimestamp = null;
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  destroy(): void {
    this.pause();
    this.destroyed = true;
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running || this.destroyed) {
      return;
    }

    const rawDeltaTime =
      this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    const deltaTime = Math.min(Math.max(rawDeltaTime, 0), MAX_DELTA_TIME);

    this.lastTimestamp = timestamp;
    this.elapsedTime += deltaTime;
    this.frameNumber += 1;

    const frame: LoopFrame = {
      deltaTime,
      elapsedTime: this.elapsedTime,
      frameNumber: this.frameNumber,
    };

    this.callbacks.update(frame);
    this.callbacks.render(frame);

    if (this.running) {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };
}

