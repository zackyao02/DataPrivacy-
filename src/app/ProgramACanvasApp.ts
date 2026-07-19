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
import type {
  CreatePackageCommand,
  GameCommand,
  GameCommandPort,
  PlaceCardToSlotCommand,
  RemoveCardFromSlotCommand,
  SelectBuyerCommand,
  SelectPackageCommand,
  SubmitCardToOperationPadCommand,
  SubmitTransactionCommand,
} from "../game/GamePorts";
import {
  ProgramBBridge,
  type ProgramBEvent,
  type ProgramBEventListener,
  type ProgramBGameState,
  type ProgramBStateListener,
  type ProgramBStatePatch,
} from "../game/ProgramBBridge";
import type {
  VisibleGameState,
  VisibleRiskStatus,
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
  closeMonitor(): boolean;
  pause(): void;
  resume(): void;
  destroy(): void;
  getSnapshot(): ProgramADebugSnapshot;
  readonly programB: {
    getState(): Readonly<ProgramBGameState>;
    getVisibleState(): Readonly<VisibleGameState>;
    patchState(patch: ProgramBStatePatch): Readonly<ProgramBGameState>;
    emit(type: string, payload?: unknown): ProgramBEvent;
    onStateChange(listener: ProgramBStateListener): () => void;
    onEvent(listener: ProgramBEventListener): () => void;
  };
}

const INITIAL_SCENE: PlayerSceneId = "monitor-room";

export class ProgramACanvasApp {
  readonly debugApi: ProgramADebugApi;

  private readonly events = new TypedEventBus<ProgramAEventMap>();
  private readonly surface: CanvasSurface;
  private readonly input: InputManager;
  private readonly programB = new ProgramBBridge(INITIAL_SCENE);
  private readonly commandPort: GameCommandPort;
  private readonly monitorRoomScene: MonitorRoomScene;
  private readonly monitorDesktopScene: MonitorDesktopScene;
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

    this.commandPort = {
      submitCardToOperationPad: (cardId) =>
        this.submitCardToOperationPad(cardId),
      placeCardToSlot: (cardId, slotIndex) =>
        this.placeCardToSlot(cardId, slotIndex),
      removeCardFromSlot: (slotIndex) =>
        this.removeCardFromSlot(slotIndex),
      createPackage: (preferredRecipeId) =>
        this.createPackage(preferredRecipeId),
      selectPackage: (packageId) => this.selectPackage(packageId),
      selectBuyer: (buyerId) => this.selectBuyer(buyerId),
      submitTransaction: (packageId, buyerId) =>
        this.submitTransaction(packageId, buyerId),
    };
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
    this.programB.onEvent((event) => {
      this.monitorDesktopScene.handleGameEvent(event);
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
      this.programB,
    );
    this.input = new InputManager(canvas, this.surface, (event) => {
      this.events.emit("input:event", event);
      this.latestFrame = {
        ...this.latestFrame,
        input: this.input.getSnapshot(),
        gameState: this.programB.getState(),
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

    const command: SubmitCardToOperationPadCommand = {
      type: "submitCardToOperationPad",
      cardId,
    };

    this.logMockCommand(command, "submitCardToOperationPad(cardId)");
    this.patchVisibleState({ operationPadCardId: cardId });
    this.programB.emit("cardSubmittedToOperationPad", {
      cardId,
      message: "Mock Program B：数据文件已递交到操作托盘。",
    });
  }

  placeCardToSlot(cardId: string, slotIndex: number): void {
    if (this.lifecycle === "destroyed" || slotIndex < 0 || slotIndex > 2) {
      return;
    }

    const command: PlaceCardToSlotCommand = {
      type: "placeCardToSlot",
      cardId,
      slotIndex,
    };
    this.logMockCommand(command, "placeCardToSlot(cardId, slotIndex)");

    const visibleState = this.programB.getVisibleState();
    const slotCardIds = Array.from(
      { length: 3 },
      (_, index) => visibleState.workbench.slotCardIds[index] ?? null,
    );
    slotCardIds[slotIndex] = cardId;
    this.patchVisibleState({
      workbench: { slotCardIds },
    });
  }

  removeCardFromSlot(slotIndex: number): void {
    if (this.lifecycle === "destroyed" || slotIndex < 0 || slotIndex > 2) {
      return;
    }

    const command: RemoveCardFromSlotCommand = {
      type: "removeCardFromSlot",
      slotIndex,
    };
    this.logMockCommand(command, "removeCardFromSlot(slotIndex)");

    const visibleState = this.programB.getVisibleState();
    const slotCardIds = Array.from(
      { length: 3 },
      (_, index) => visibleState.workbench.slotCardIds[index] ?? null,
    );
    slotCardIds[slotIndex] = null;
    this.patchVisibleState({
      workbench: { slotCardIds },
    });
  }

  createPackage(preferredRecipeId?: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    const command: CreatePackageCommand = {
      type: "createPackage",
      ...(preferredRecipeId ? { preferredRecipeId } : {}),
    };
    this.logMockCommand(command, "createPackage(preferredRecipeId?)");

    const outcome =
      this.programB.getState().data.mockPackageOutcome === "packageWasted"
        ? "packageWasted"
        : "packageCreated";

    const packageId = `MOCK-PKG-${Math.floor(performance.now())}`;
    const visibleState = this.programB.getVisibleState();
    const hasVisiblePackageCapacity =
      visibleState.processedPackages.length < 4;

    if (outcome === "packageCreated" && hasVisiblePackageCapacity) {
      this.patchVisibleState({
        processedPackages: [
          ...visibleState.processedPackages,
          {
            id: packageId,
            label: preferredRecipeId
              ? `Mock 封装 · ${preferredRecipeId}`
              : "Mock 封装数据包",
          },
        ],
      });
    }

    const payload =
      outcome === "packageCreated"
        ? {
            packageId,
            message: hasVisiblePackageCapacity
              ? "Mock Program B：数据包已生成。"
              : "Mock Program B：数据包已生成，可见区仅展示前 4 个。",
          }
        : {
            message: "Mock Program B：本次封装未生成有效数据包。",
          };
    this.programB.emit(outcome, payload);
  }

  selectPackage(packageId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    const command: SelectPackageCommand = {
      type: "selectPackage",
      packageId,
    };
    this.logMockCommand(command, "selectPackage(packageId)");
    this.patchVisibleState({ selectedPackageId: packageId });
  }

  selectBuyer(buyerId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    const command: SelectBuyerCommand = {
      type: "selectBuyer",
      buyerId,
    };
    this.logMockCommand(command, "selectBuyer(buyerId)");
    this.patchVisibleState({ selectedBuyerId: buyerId });
  }

  submitTransaction(packageId: string, buyerId: string): void {
    if (this.lifecycle === "destroyed") {
      return;
    }

    const command: SubmitTransactionCommand = {
      type: "submitTransaction",
      packageId,
      buyerId,
    };
    this.logMockCommand(command, "submitTransaction(packageId, buyerId)");

    const gameState = this.programB.getState();
    const succeeded =
      gameState.data.mockTransactionOutcome !== "transactionFailed";
    const eventType = succeeded
      ? "transactionSuccess"
      : "transactionFailed";
    const summary = succeeded
      ? "Mock Program B：交易请求已成功处理。"
      : "Mock Program B：交易请求被拒绝。";
    const requestedRiskStatus = gameState.data.mockRiskStatus;
    const nextRiskStatus = this.isRiskStatus(requestedRiskStatus)
      ? requestedRiskStatus
      : gameState.visibleState.riskStatus;
    const previousRiskStatus = gameState.visibleState.riskStatus;
    const mockRiskLog = {
      id: `MOCK-RISK-${Math.round(performance.now())}`,
      status: nextRiskStatus,
      message: succeeded
        ? `Mock Program B：交易 ${packageId} → ${buyerId} 已完成。`
        : `Mock Program B：交易 ${packageId} → ${buyerId} 未通过。`,
    } as const;

    this.patchVisibleState({
      lastTransactionResult: {
        packageId,
        buyerId,
        status: succeeded ? "success" : "failed",
        summary,
      },
      riskStatus: nextRiskStatus,
      riskLogs: [mockRiskLog, ...gameState.visibleState.riskLogs].slice(0, 4),
    });
    this.programB.emit(eventType, { packageId, buyerId, message: summary });
    this.programB.emit("riskChanged", {
      previousStatus: previousRiskStatus,
      riskStatus: nextRiskStatus,
      message: `Mock Program B：风险状态更新为 ${nextRiskStatus}。`,
    });
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
    const snapshotFrame = {
      ...this.latestFrame,
      input: this.input.getSnapshot(),
      gameState: this.programB.getState(),
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
      gameState: this.programB.getState(),
      desk: this.monitorRoomScene.getDebugState(snapshotFrame),
      monitorDesktop: this.monitorDesktopScene.getDebugState(),
    };
  }

  private logMockCommand(command: GameCommand, signature: string): void {
    console.info(`[Program A] ${signature}`, command);
    this.programB.emit(`command:${command.type}`, command);
  }

  private patchVisibleState(patch: Partial<VisibleGameState>): void {
    const visibleState = this.programB.getVisibleState();
    this.programB.patchState({
      visibleState: {
        ...visibleState,
        ...patch,
      },
    });
  }

  private isRiskStatus(value: unknown): value is VisibleRiskStatus {
    return value === "normal" || value === "warning" || value === "critical";
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
      interaction: this.getInteractionMetrics(),
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
      closeMonitor: () => this.closeMonitor(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      destroy: () => this.destroy(),
      getSnapshot: () => this.getSnapshot(),
      programB: Object.freeze({
        getState: () => this.programB.getState(),
        getVisibleState: () => this.programB.getVisibleState(),
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
