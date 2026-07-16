import type { SceneId } from "../core/types";

export interface ProgramBGameState {
  readonly schemaVersion: 1;
  readonly currentScene: SceneId;
  readonly previousScene: SceneId | null;
  readonly phase: string;
  readonly flags: Readonly<Record<string, boolean>>;
  readonly counters: Readonly<Record<string, number>>;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface ProgramBStatePatch {
  readonly currentScene?: SceneId;
  readonly previousScene?: SceneId | null;
  readonly phase?: string;
  readonly flags?: Record<string, boolean>;
  readonly counters?: Record<string, number>;
  readonly data?: Record<string, unknown>;
}

export interface ProgramBEvent {
  readonly type: string;
  readonly payload?: unknown;
  readonly timestamp: number;
}

export type ProgramBStateListener = (
  state: Readonly<ProgramBGameState>,
) => void;
export type ProgramBEventListener = (event: ProgramBEvent) => void;

export class ProgramBBridge {
  private state: Readonly<ProgramBGameState>;
  private readonly stateListeners = new Set<ProgramBStateListener>();
  private readonly eventListeners = new Set<ProgramBEventListener>();

  constructor(initialScene: SceneId) {
    this.state = this.freezeState({
      schemaVersion: 1,
      currentScene: initialScene,
      previousScene: null,
      phase: "foundation",
      flags: {},
      counters: {},
      data: {},
    });
  }

  getState(): Readonly<ProgramBGameState> {
    return this.state;
  }

  patchState(patch: ProgramBStatePatch): Readonly<ProgramBGameState> {
    this.state = this.freezeState({
      ...this.state,
      ...patch,
      schemaVersion: 1,
      flags: {
        ...this.state.flags,
        ...patch.flags,
      },
      counters: {
        ...this.state.counters,
        ...patch.counters,
      },
      data: {
        ...this.state.data,
        ...patch.data,
      },
    });

    this.stateListeners.forEach((listener) => listener(this.state));
    return this.state;
  }

  emit(type: string, payload?: unknown): ProgramBEvent {
    const event: ProgramBEvent = Object.freeze({
      type,
      payload,
      timestamp: performance.now(),
    });

    this.eventListeners.forEach((listener) => listener(event));
    return event;
  }

  onStateChange(listener: ProgramBStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onEvent(listener: ProgramBEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  destroy(): void {
    this.stateListeners.clear();
    this.eventListeners.clear();
  }

  private freezeState(state: ProgramBGameState): Readonly<ProgramBGameState> {
    return Object.freeze({
      ...state,
      flags: Object.freeze({ ...state.flags }),
      counters: Object.freeze({ ...state.counters }),
      data: Object.freeze({ ...state.data }),
    });
  }
}

