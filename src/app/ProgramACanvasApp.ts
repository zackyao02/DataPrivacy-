import { CanvasSurface } from "../core/CanvasSurface";
import type { ProgramAEventMap } from "../core/events";
import { GameLoop, type LoopFrame } from "../core/GameLoop";
import { InputManager } from "../core/InputManager";
import { TypedEventBus } from "../core/TypedEventBus";
import {
  RENDER_LAYERS,
  SCENE_IDS,
  type AppLifecycleState,
  type RenderLayer,
  type SceneId,
} from "../core/types";
import { DebugPanel, type DebugMetrics } from "../debug/DebugPanel";
import {
  ProgramBBridge,
  type ProgramBEvent,
  type ProgramBEventListener,
  type ProgramBGameState,
  type ProgramBStateListener,
  type ProgramBStatePatch,
} from "../game/ProgramBBridge";
import { LayerRenderer } from "../render/LayerRenderer";
import { PlaceholderScene } from "../scenes/PlaceholderScene";
import type { SceneFrame } from "../scenes/Scene";
import { SceneManager } from "../scenes/SceneManager";

export interface ProgramADebugSnapshot {
  readonly lifecycle: AppLifecycleState;
  readonly currentScene: SceneId;
  readonly frameNumber: number;
  readonly deltaTime: number;
  readonly viewport: ReturnType<ProgramACanvasApp["getViewportSnapshot"]>;
  readonly layers: Readonly<Record<RenderLayer, boolean>>;
  readonly input: ReturnType<InputManager["getSnapshot"]>;
  readonly gameState: Readonly<ProgramBGameState>;
}

export interface ProgramADebugApi {
  readonly scenes: readonly SceneId[];
  readonly layers: readonly RenderLayer[];
  switchScene(sceneId: SceneId): boolean;
  setLayerVisible(layer: RenderLayer, visible: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  getSnapshot(): ProgramADebugSnapshot;
  readonly programB: {
    getState(): Readonly<ProgramBGameState>;
    patchState(patch: ProgramBStatePatch): Readonly<ProgramBGameState>;
    emit(type: string, payload?: unknown): ProgramBEvent;
    onStateChange(listener: ProgramBStateListener): () => void;
    onEvent(listener: ProgramBEventListener): () => void;
  };
}

const INITIAL_SCENE: SceneId = "monitor-room";

export class ProgramACanvasApp {
  readonly debugApi: ProgramADebugApi;

  private readonly events = new TypedEventBus<ProgramAEventMap>();
  private readonly surface: CanvasSurface;
  private readonly input: InputManager;
  private readonly programB = new ProgramBBridge(INITIAL_SCENE);
  private readonly sceneManager: SceneManager;
  private readonly renderer: LayerRenderer;
  private readonly loop: GameLoop;
  private readonly debugPanel: DebugPanel;
  private lifecycle: AppLifecycleState = "running";
  private latestFrame: SceneFrame;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    debugRoot: HTMLElement,
  ) {
    this.surface = new CanvasSurface(canvas);
    this.surface.resize();

    this.input = new InputManager(canvas, this.surface, (event) => {
      this.events.emit("input:event", event);
    });

    const scenes = SCENE_IDS.map((sceneId) => new PlaceholderScene(sceneId));
    this.sceneManager = new SceneManager(
      scenes,
      INITIAL_SCENE,
      this.events,
      this.programB,
    );
    this.renderer = new LayerRenderer(this.surface, this.sceneManager);
    this.latestFrame = this.createSceneFrame({
      deltaTime: 0,
      elapsedTime: 0,
      frameNumber: 0,
    });
    this.sceneManager.start(this.latestFrame);

    this.debugPanel = new DebugPanel(debugRoot, {
      onSceneChange: (sceneId) => {
        this.switchScene(sceneId);
      },
      onLayerChange: (layer, visible) => {
        this.setLayerVisible(layer, visible);
      },
      onPause: () => this.pause(),
      onResume: () => this.resume(),
      onDestroy: () => this.destroy(),
    });

    this.loop = new GameLoop({
      update: (frame) => this.update(frame),
      render: () => this.render(),
    });

    this.events.on("scene:changed", ({ currentScene }) => {
      this.debugPanel.setScene(currentScene);
    });
    this.events.on("lifecycle:changed", ({ state }) => {
      this.debugPanel.setLifecycle(state);
    });

    this.surface.observe((viewport) => {
      this.events.emit("viewport:changed", viewport);
      this.latestFrame = {
        ...this.latestFrame,
        viewport,
      };

      if (this.lifecycle !== "running") {
        this.render();
      }
    });

    window.addEventListener("keydown", this.handleKeyDown);

    this.debugApi = this.createDebugApi();
    this.render();
    this.loop.start();
  }

  switchScene(sceneId: SceneId): boolean {
    if (this.lifecycle === "destroyed" || !SCENE_IDS.includes(sceneId)) {
      return false;
    }

    const changed = this.sceneManager.switchTo(sceneId, this.latestFrame);

    if (changed && this.lifecycle !== "running") {
      this.latestFrame = {
        ...this.latestFrame,
        gameState: this.programB.getState(),
      };
      this.render();
    }

    return changed;
  }

  setLayerVisible(layer: RenderLayer, visible: boolean): void {
    if (this.lifecycle === "destroyed" || !RENDER_LAYERS.includes(layer)) {
      return;
    }

    this.renderer.setVisible(layer, visible);

    if (this.lifecycle !== "running") {
      this.render();
    }
  }

  pause(): void {
    if (this.lifecycle !== "running") {
      return;
    }

    this.loop.pause();
    this.lifecycle = "paused";
    this.events.emit("lifecycle:changed", { state: this.lifecycle });
    this.render();
  }

  resume(): void {
    if (this.lifecycle !== "paused") {
      return;
    }

    this.lifecycle = "running";
    this.events.emit("lifecycle:changed", { state: this.lifecycle });
    this.loop.resume();
  }

  destroy(): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.loop.destroy();
    this.lifecycle = "destroyed";
    this.events.emit("lifecycle:changed", { state: this.lifecycle });
    window.removeEventListener("keydown", this.handleKeyDown);
    this.input.destroy();
    this.surface.destroy();
    this.sceneManager.destroy(this.latestFrame);
    this.programB.destroy();
    this.debugPanel.destroy();
    this.events.clear();

    const context = this.canvas.getContext("2d");

    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#080b0f";
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getSnapshot(): ProgramADebugSnapshot {
    return {
      lifecycle: this.lifecycle,
      currentScene: this.sceneManager.currentId,
      frameNumber: this.latestFrame.frameNumber,
      deltaTime: this.latestFrame.deltaTime,
      viewport: this.getViewportSnapshot(),
      layers: this.renderer.getVisibility(),
      input: this.input.getSnapshot(),
      gameState: this.programB.getState(),
    };
  }

  private update(frame: LoopFrame): void {
    this.latestFrame = this.createSceneFrame(frame);
    this.sceneManager.update(this.latestFrame);
  }

  private render(): void {
    this.latestFrame = {
      ...this.latestFrame,
      input: this.input.getSnapshot(),
      gameState: this.programB.getState(),
      viewport: this.surface.snapshot,
    };
    this.renderer.render(this.latestFrame);

    const metrics: DebugMetrics = {
      lifecycle: this.lifecycle,
      scene: this.sceneManager.currentId,
      deltaTime: this.latestFrame.deltaTime,
      frameNumber: this.latestFrame.frameNumber,
      viewport: this.latestFrame.viewport,
      input: this.latestFrame.input,
    };

    this.debugPanel.update(metrics);
  }

  private createSceneFrame(frame: LoopFrame): SceneFrame {
    return {
      ...frame,
      viewport: this.surface.snapshot,
      input: this.input.getSnapshot(),
      gameState: this.programB.getState(),
    };
  }

  private getViewportSnapshot() {
    return { ...this.surface.snapshot };
  }

  private createDebugApi(): ProgramADebugApi {
    return Object.freeze({
      scenes: SCENE_IDS,
      layers: RENDER_LAYERS,
      switchScene: (sceneId: SceneId) => this.switchScene(sceneId),
      setLayerVisible: (layer: RenderLayer, visible: boolean) =>
        this.setLayerVisible(layer, visible),
      pause: () => this.pause(),
      resume: () => this.resume(),
      destroy: () => this.destroy(),
      getSnapshot: () => this.getSnapshot(),
      programB: Object.freeze({
        getState: () => this.programB.getState(),
        patchState: (patch: ProgramBStatePatch) =>
          this.programB.patchState(patch),
        emit: (type: string, payload?: unknown) =>
          this.programB.emit(type, payload),
        onStateChange: (listener: ProgramBStateListener) =>
          this.programB.onStateChange(listener),
        onEvent: (listener: ProgramBEventListener) =>
          this.programB.onEvent(listener),
      }),
    });
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const numericIndex = Number(event.key) - 1;

    if (numericIndex >= 0 && numericIndex < SCENE_IDS.length) {
      this.switchScene(SCENE_IDS[numericIndex]);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();

      if (this.lifecycle === "running") {
        this.pause();
      } else if (this.lifecycle === "paused") {
        this.resume();
      }
    }
  };
}
