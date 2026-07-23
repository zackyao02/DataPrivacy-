import { CanvasSurface } from "../core/CanvasSurface";
import type { ProgramAEventMap } from "../core/events";
import { GameLoop, type LoopFrame } from "../core/GameLoop";
import { InputManager } from "../core/InputManager";
import { TypedEventBus } from "../core/TypedEventBus";
import {
  PLAYER_SCENE_IDS,
  RENDER_LAYERS,
  SCENE_IDS,
  type AppLifecycleState,
  type PlayerSceneId,
  type RenderLayer,
  type SceneId,
} from "../core/types";
import { DebugPanel, type DebugMetrics } from "../debug/DebugPanel";
import {
  CAdapter,
  createMockCAdapter,
  type BlackBoxLineStage,
  type MockAudioPort,
  type PackagePreviewOptions,
} from "../adapters/CAdapter";
import type { ProgramBAdapterPort } from "../adapters/BAdapter";
import { MockBAdapter } from "../adapters/MockBAdapter";
import type {
  DailyChallengeResponse,
  GameCommandPort,
} from "../game/GamePorts";
import {
  type ProgramBEvent,
  type ProgramBEventListener,
  type ProgramBGameState,
  type ProgramBStateListener,
  type ProgramBStatePatch,
} from "../game/ProgramBBridge";
import type {
  VisibleDailyPhase,
  VisibleGameState,
} from "../game/VisibleGameState";
import { LayerRenderer } from "../render/LayerRenderer";
import { MonitorDesktopScene } from "../scenes/MonitorDesktopScene";
import {
  MonitorRoomScene,
  type DeskDebugState,
} from "../scenes/MonitorRoomScene";
import { PlaceholderScene } from "../scenes/PlaceholderScene";
import type { SceneFrame } from "../scenes/Scene";
import { SceneManager } from "../scenes/SceneManager";

export interface ProgramADebugSnapshot {
  readonly lifecycle: AppLifecycleState;
  readonly currentScene: SceneId;
  readonly frameNumber: number;
  readonly deltaTime: number;
  readonly elapsedTime: number;
  readonly viewport: ReturnType<ProgramACanvasApp["getViewportSnapshot"]>;
  readonly layers: Readonly<Record<RenderLayer, boolean>>;
  readonly input: ReturnType<InputManager["getSnapshot"]>;
  readonly gameState: Readonly<ProgramBGameState>;
  readonly desk: DeskDebugState;
  readonly monitorDesktop: ReturnType<MonitorDesktopScene["getDebugState"]>;
}

export interface ProgramAAdapterOptions {
  readonly bAdapter?: ProgramBAdapterPort;
  readonly cAdapter?: CAdapter;
}

export interface ProgramADebugApi {
  readonly scenes: readonly SceneId[];
  readonly layers: readonly RenderLayer[];
  switchScene(sceneId: PlayerSceneId): boolean;
  setLayerVisible(layer: RenderLayer, visible: boolean): void;
  setDeskHitAreasVisible(visible: boolean): void;
  submitCardToOperationPad(cardId: string): void;
  placeCardToSlot(cardId: string, slotIndex: number): void;
  removeCardFromSlot(slotIndex: number): void;
  createPackage(preferredRecipeId?: string): void;
  selectPackage(packageId: string): void;
  selectBuyer(buyerId: string): void;
  submitTransaction(packageId: string, buyerId: string): void;
  submitDailyChallengeChoice(challengeId: string, choiceId: string): void;
  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void;
  selectEmotion(emotion: "empathy" | "anger" | "numbness"): void;
  advanceDailyPhase(): void;
  closeMonitor(): boolean;
  pause(): void;
  resume(): void;
  destroy(): void;
  getSnapshot(): ProgramADebugSnapshot;
  readonly programB: {
    getState(): Readonly<ProgramBGameState>;
    getVisibleState(): Readonly<VisibleGameState>;
    setMockDay(day: number, phase?: VisibleDailyPhase): Readonly<ProgramBGameState>;
    patchState(patch: ProgramBStatePatch): Readonly<ProgramBGameState>;
    emit(type: string, payload?: unknown): ProgramBEvent;
    onStateChange(listener: ProgramBStateListener): () => void;
    onEvent(listener: ProgramBEventListener): () => void;
  };
  readonly programC: {
    getHandledAudioEvents(): readonly string[];
    findPackagePreviews(
      cardIds: readonly string[],
      options?: PackagePreviewOptions,
    ): readonly unknown[];
    pickNewsForPackage(packageType: string): unknown | null;
    findChallengeByDay(day: number): unknown | null;
    findDataCleaningIcon(iconHint: string): unknown | null;
    pickPublicOpinionScript(packageType: string): unknown | null;
    pickProfilePuzzleByDay(day: number): unknown | null;
    pickBuyerNegotiationScript(packageType: string): unknown | null;
    findDailyMonologueByDay(day: number): unknown | null;
    pickBlackBoxLine(
      stage: BlackBoxLineStage,
      filters?: { readonly day?: number; readonly packageType?: string },
    ): unknown | null;
  };
}

const INITIAL_SCENE: PlayerSceneId = "monitor-room";

export class ProgramACanvasApp {
  readonly debugApi: ProgramADebugApi;

  private readonly events = new TypedEventBus<ProgramAEventMap>();
  private readonly surface: CanvasSurface;
  private readonly input: InputManager;
  private readonly bAdapter: ProgramBAdapterPort;
  private readonly cAdapter: CAdapter;
  private readonly mockAudioPort: MockAudioPort | null;
  private readonly commandPort: GameCommandPort;
  private readonly monitorRoomScene: MonitorRoomScene;
  private readonly monitorDesktopScene: MonitorDesktopScene;
  private readonly sceneManager: SceneManager;
  private readonly renderer: LayerRenderer;
  private readonly loop: GameLoop;
  private readonly debugPanel: DebugPanel;
  private lifecycle: AppLifecycleState = "running";
  private audioUnlocked = false;
  private latestFrame: SceneFrame;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    debugRoot: HTMLElement,
    adapterOptions: ProgramAAdapterOptions = {},
  ) {
    const mockCAdapter = createMockCAdapter();
    this.bAdapter =
      adapterOptions.bAdapter ?? new MockBAdapter(INITIAL_SCENE);
    this.cAdapter = adapterOptions.cAdapter ?? mockCAdapter.adapter;
    this.mockAudioPort = adapterOptions.cAdapter ? null : mockCAdapter.audio;
    this.commandPort = this.bAdapter;
    this.surface = new CanvasSurface(canvas);
    this.surface.resize();

    this.monitorRoomScene = new MonitorRoomScene({
      onEnterMonitorDesktop: () =>
        this.navigatePlayerScene("monitor-desktop"),
      commandPort: this.commandPort,
      onCursorChange: (cursor) => {
        this.canvas.style.cursor = cursor;
      },
    });
    this.monitorDesktopScene = new MonitorDesktopScene({
      onReturnToDesk: () => this.closeMonitor(),
      commandPort: this.commandPort,
      onCursorChange: (cursor) => {
        this.canvas.style.cursor = cursor;
      },
    });
    this.bAdapter.onGameEvent((event) => {
      this.monitorDesktopScene.handleGameEvent(event);
      this.cAdapter.handleGameEvent(event.type);
    });

    const scenes = SCENE_IDS.map((sceneId) => {
      if (sceneId === "monitor-room") {
        return this.monitorRoomScene;
      }

      if (sceneId === "monitor-desktop") {
        return this.monitorDesktopScene;
      }

      return new PlaceholderScene(sceneId);
    });
    this.sceneManager = new SceneManager(
      scenes,
      INITIAL_SCENE,
      this.events,
      (previousScene, currentScene) =>
        this.bAdapter.setScene?.(previousScene, currentScene),
    );
    this.input = new InputManager(canvas, this.surface, (event) => {
      if (!this.audioUnlocked && event.phase === "pointer-down") {
        this.audioUnlocked = true;
        void this.cAdapter.unlock().catch((error: unknown) => {
          console.warn("[Program A] 程序 C 音频解锁失败。", error);
        });
      }
      this.events.emit("input:event", event);
      this.latestFrame = {
        ...this.latestFrame,
        input: this.input.getSnapshot(),
        visibleState: this.bAdapter.getVisibleState(),
      };
      this.sceneManager.handleInput(event, this.latestFrame);
    });
    this.renderer = new LayerRenderer(this.surface, this.sceneManager);
    this.latestFrame = this.createSceneFrame({
      deltaTime: 0,
      elapsedTime: 0,
      frameNumber: 0,
    });
    this.sceneManager.start(this.latestFrame);

    this.debugPanel = new DebugPanel(debugRoot, {
      onSceneChange: (sceneId) => {
        this.navigateDebugScene(sceneId);
      },
      onLayerChange: (layer, visible) => {
        this.setLayerVisible(layer, visible);
      },
      onDeskHitAreasChange: (visible) => {
        this.setDeskHitAreasVisible(visible);
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

  private navigatePlayerScene(sceneId: PlayerSceneId): boolean {
    if (!PLAYER_SCENE_IDS.includes(sceneId)) {
      return false;
    }

    return this.switchRegisteredScene(sceneId);
  }

  private navigateDebugScene(sceneId: SceneId): boolean {
    return this.switchRegisteredScene(sceneId);
  }

  private switchRegisteredScene(sceneId: SceneId): boolean {
    if (this.lifecycle === "destroyed" || !SCENE_IDS.includes(sceneId)) {
      return false;
    }

    const changed = this.sceneManager.switchTo(sceneId, this.latestFrame);

    if (changed && this.lifecycle !== "running") {
      this.latestFrame = {
        ...this.latestFrame,
        visibleState: this.bAdapter.getVisibleState(),
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

  setDeskHitAreasVisible(visible: boolean): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.monitorRoomScene.setHitAreasVisible(visible);
    this.monitorDesktopScene.setHitAreasVisible(visible);
    this.debugPanel.setHitAreasVisible(visible);

    if (this.lifecycle !== "running") {
      this.render();
    }
  }

  submitCardToOperationPad(cardId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }
    this.commandPort.submitCardToOperationPad(cardId);
  }

  placeCardToSlot(cardId: string, slotIndex: number): void {
    if (this.lifecycle === "destroyed") {
      return;
    }
    this.commandPort.placeCardToSlot(cardId, slotIndex);
  }

  removeCardFromSlot(slotIndex: number): void {
    if (this.lifecycle === "destroyed") {
      return;
    }
    this.commandPort.removeCardFromSlot(slotIndex);
  }

  createPackage(preferredRecipeId?: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }
    this.commandPort.createPackage(preferredRecipeId);
  }

  selectPackage(packageId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.selectPackage(packageId);
  }

  selectBuyer(buyerId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.selectBuyer(buyerId);
  }

  submitTransaction(packageId: string, buyerId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.submitTransaction(packageId, buyerId);
  }

  submitDailyChallengeChoice(challengeId: string, choiceId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.submitDailyChallengeChoice(challengeId, choiceId);
  }

  submitDailyChallenge(
    challengeId: string,
    response: DailyChallengeResponse,
  ): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.submitDailyChallenge(challengeId, response);
  }

  selectEmotion(emotion: "empathy" | "anger" | "numbness"): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.selectEmotion(emotion);
  }

  advanceDailyPhase(): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    this.commandPort.advanceDailyPhase();
  }

  closeMonitor(): boolean {
    if (this.lifecycle === "destroyed") {
      return false;
    }

    return this.navigatePlayerScene("monitor-room");
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
    this.bAdapter.destroy();
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
    const snapshotFrame = {
      ...this.latestFrame,
      input: this.input.getSnapshot(),
      visibleState: this.bAdapter.getVisibleState(),
    };

    return {
      lifecycle: this.lifecycle,
      currentScene: this.sceneManager.currentId,
      frameNumber: this.latestFrame.frameNumber,
      deltaTime: this.latestFrame.deltaTime,
      elapsedTime: this.latestFrame.elapsedTime,
      viewport: this.getViewportSnapshot(),
      layers: this.renderer.getVisibility(),
      input: this.input.getSnapshot(),
      gameState: this.getDebugGameState(),
      desk: this.monitorRoomScene.getDebugState(snapshotFrame),
      monitorDesktop: this.monitorDesktopScene.getDebugState(),
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
      visibleState: this.bAdapter.getVisibleState(),
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
      interaction: this.getInteractionMetrics(),
    };

    this.debugPanel.update(metrics);
  }

  private createSceneFrame(frame: LoopFrame): SceneFrame {
    return {
      ...frame,
      viewport: this.surface.snapshot,
      input: this.input.getSnapshot(),
      visibleState: this.bAdapter.getVisibleState(),
    };
  }

  private getViewportSnapshot() {
    return { ...this.surface.snapshot };
  }

  private createDebugApi(): ProgramADebugApi {
    return Object.freeze({
      scenes: SCENE_IDS,
      layers: RENDER_LAYERS,
      switchScene: (sceneId: PlayerSceneId) =>
        this.navigatePlayerScene(sceneId),
      setLayerVisible: (layer: RenderLayer, visible: boolean) =>
        this.setLayerVisible(layer, visible),
      setDeskHitAreasVisible: (visible: boolean) =>
        this.setDeskHitAreasVisible(visible),
      submitCardToOperationPad: (cardId: string) =>
        this.submitCardToOperationPad(cardId),
      placeCardToSlot: (cardId: string, slotIndex: number) =>
        this.placeCardToSlot(cardId, slotIndex),
      removeCardFromSlot: (slotIndex: number) =>
        this.removeCardFromSlot(slotIndex),
      createPackage: (preferredRecipeId?: string) =>
        this.createPackage(preferredRecipeId),
      selectPackage: (packageId: string) => this.selectPackage(packageId),
      selectBuyer: (buyerId: string) => this.selectBuyer(buyerId),
      submitTransaction: (packageId: string, buyerId: string) =>
        this.submitTransaction(packageId, buyerId),
      submitDailyChallengeChoice: (challengeId: string, choiceId: string) =>
        this.submitDailyChallengeChoice(challengeId, choiceId),
      submitDailyChallenge: (
        challengeId: string,
        response: DailyChallengeResponse,
      ) => this.submitDailyChallenge(challengeId, response),
      selectEmotion: (emotion: "empathy" | "anger" | "numbness") =>
        this.selectEmotion(emotion),
      advanceDailyPhase: () => this.advanceDailyPhase(),
      closeMonitor: () => this.closeMonitor(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      destroy: () => this.destroy(),
      getSnapshot: () => this.getSnapshot(),
      programB: Object.freeze({
        getState: () => this.getDebugGameState(),
        getVisibleState: () => this.bAdapter.getVisibleState(),
        setMockDay: (day: number, phase?: VisibleDailyPhase) => {
          const mockAdapter = this.getMockBAdapter();
          return mockAdapter
            ? mockAdapter.setDebugDay(day, phase)
            : this.getDebugGameState();
        },
        patchState: (patch: ProgramBStatePatch) => {
          const mockAdapter = this.getMockBAdapter();
          return mockAdapter
            ? mockAdapter.patchDebugState(patch)
            : this.getDebugGameState();
        },
        emit: (type: string, payload?: unknown) => {
          const mockAdapter = this.getMockBAdapter();
          return mockAdapter
            ? mockAdapter.emitDebugEvent(type, payload)
            : Object.freeze({ type, payload, timestamp: performance.now() });
        },
        onStateChange: (listener: ProgramBStateListener) => {
          const mockAdapter = this.getMockBAdapter();
          return mockAdapter
            ? mockAdapter.onDebugStateChange(listener)
            : this.bAdapter.onVisibleStateChange(() =>
                listener(this.getDebugGameState()),
              );
        },
        onEvent: (listener: ProgramBEventListener) =>
          this.bAdapter.onGameEvent(listener),
      }),
      programC: Object.freeze({
        getHandledAudioEvents: () =>
          this.mockAudioPort?.getHandledEvents() ?? [],
        findPackagePreviews: (
          cardIds: readonly string[],
          options?: PackagePreviewOptions,
        ) => this.cAdapter.findPackagePreviews(cardIds, options),
        pickNewsForPackage: (packageType: string) =>
          this.cAdapter.pickNewsForPackage(packageType),
        findChallengeByDay: (day: number) =>
          this.cAdapter.findChallengeByDay(day),
        findDataCleaningIcon: (iconHint: string) =>
          this.cAdapter.findDataCleaningIcon(iconHint),
        pickPublicOpinionScript: (packageType: string) =>
          this.cAdapter.pickPublicOpinionScript(packageType),
        pickProfilePuzzleByDay: (day: number) =>
          this.cAdapter.pickProfilePuzzleByDay(day),
        pickBuyerNegotiationScript: (packageType: string) =>
          this.cAdapter.pickBuyerNegotiationScript(packageType),
        findDailyMonologueByDay: (day: number) =>
          this.cAdapter.findDailyMonologueByDay(day),
        pickBlackBoxLine: (
          stage: BlackBoxLineStage,
          filters?: { readonly day?: number; readonly packageType?: string },
        ) => this.cAdapter.pickBlackBoxLine(stage, filters),
      }),
    });
  }

  private getMockBAdapter(): MockBAdapter | null {
    return this.bAdapter instanceof MockBAdapter ? this.bAdapter : null;
  }

  private getDebugGameState(): Readonly<ProgramBGameState> {
    const mockAdapter = this.getMockBAdapter();

    if (mockAdapter) {
      return mockAdapter.getDebugState();
    }

    return Object.freeze({
      schemaVersion: 1,
      currentScene: this.sceneManager.currentId,
      previousScene: null,
      phase: "real-adapter",
      visibleState: this.bAdapter.getVisibleState(),
      flags: Object.freeze({}),
      counters: Object.freeze({}),
      data: Object.freeze({}),
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

    if (event.code === "Escape") {
      if (this.sceneManager.currentId === "monitor-desktop") {
        this.closeMonitor();
      } else if (this.sceneManager.currentId === "monitor-room") {
        const closed = this.monitorRoomScene.closeOpenOverlay();

        if (closed && this.lifecycle !== "running") {
          this.render();
        }
      }

      return;
    }

    if (event.code === "KeyH") {
      this.setDeskHitAreasVisible(
        !this.monitorRoomScene.getDebugState(this.latestFrame).hitAreasVisible,
      );
      return;
    }

    const numericIndex = Number(event.key) - 1;

    if (numericIndex >= 0 && numericIndex < SCENE_IDS.length) {
      this.navigateDebugScene(SCENE_IDS[numericIndex]);
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

  private getInteractionMetrics(): DebugMetrics["interaction"] {
    if (this.sceneManager.currentId === "monitor-room") {
      const desk = this.monitorRoomScene.getDebugState(this.latestFrame);

      return {
        view: desk.view,
        hitAreasVisible: desk.hitAreasVisible,
        hoveredItemId: desk.hoveredItemId,
        draggingItemId: desk.draggingItemId,
        draggingCardId: desk.draggingCardId,
        newsOpen: desk.newsOpen,
        cardDetailOpen: desk.cardDetailOpen,
        cameraLightOn: desk.cameraLightOn,
        assets: desk.assets,
      };
    }

    if (this.sceneManager.currentId === "monitor-desktop") {
      const desktop = this.monitorDesktopScene.getDebugState();

      return {
        view: desktop.view,
        currentApp: desktop.currentApp,
        hitAreasVisible: desktop.hitAreasVisible,
        hoveredItemId: desktop.hoveredItemId,
        draggingItemId: desktop.draggingItemId,
        pressedItemId: desktop.pressedItemId,
        highlightedSlotIndex: desktop.highlightedSlotIndex,
        disabledRawCardIds: desktop.disabledRawCardIds,
        selectedRawCardId: desktop.selectedRawCardId,
        selectedPackageId: desktop.selectedPackageId,
        selectedBuyerId: desktop.selectedBuyerId,
        slotCardIds: desktop.slotCardIds,
        assets: desktop.assets,
      };
    }

    return {
      view: this.sceneManager.currentId,
      hitAreasVisible: false,
      hoveredItemId: null,
    };
  }
}
