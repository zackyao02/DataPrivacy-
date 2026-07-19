import { ImageAssetStore } from "../assets/ImageAssetStore";
import {
  MONITOR_DESKTOP_ASSET_URLS,
  type MonitorDesktopAssetKey,
} from "../assets/ProgramAAssetManifest";
import type {
  NormalizedPointerEvent,
  Point,
  RenderLayer,
} from "../core/types";
import type { GameCommandPort } from "../game/GamePorts";
import type { ProgramBEvent } from "../game/ProgramBBridge";
import {
  MOCK_VISIBLE_STATE,
  type VisibleGameState,
} from "../game/VisibleGameState";
import { drawCanvasPlaceholder } from "../render/CanvasPlaceholder";
import {
  drawCRTEffect,
  getCRTJitter,
  MONITOR_DESKTOP_CRT_CONFIG,
} from "../render/CRTEffect";
import {
  renderMonitorAppContent,
  renderMonitorDraggedCard,
  type MonitorAppFeedback,
  type MonitorAppViewState,
} from "../views/monitor/MonitorAppView";
import type { Scene, SceneFrame } from "./Scene";
import {
  DESK_DESIGN_SIZE,
  MONITOR_APP_IDS,
  MONITOR_APP_LAYOUT,
  MONITOR_DESKTOP_LAYOUT,
  getDeskTransform,
  toDeskPoint,
  type MonitorAppId,
} from "./desk/DeskSceneConfig";
import {
  containsPoint,
  drawHitAreaDebug,
  hitTestInteractiveItems,
  type InteractiveItem,
  type Rect,
} from "./desk/InteractiveItem";

type MonitorDesktopItemId =
  | "monitor-desktop-return"
  | "monitor-app-close"
  | `monitor-app:${MonitorAppId}`
  | `data-raw-card:${string}`
  | `data-slot:${number}`
  | "data-create-package"
  | `trade-package:${string}`
  | `trade-buyer:${string}`
  | "trade-submit";

export interface MonitorDesktopDebugState {
  readonly view: "monitor-desktop" | "monitor-app";
  readonly currentApp: MonitorAppId | null;
  readonly hoveredItemId: MonitorDesktopItemId | null;
  readonly pressedItemId: MonitorDesktopItemId | null;
  readonly selectedRawCardId: string | null;
  readonly selectedPackageId: string | null;
  readonly selectedBuyerId: string | null;
  readonly slotCardIds: readonly (string | null)[];
  readonly draggingItemId: MonitorDesktopItemId | null;
  readonly highlightedSlotIndex: number | null;
  readonly disabledRawCardIds: readonly string[];
  readonly createPackageDisabled: boolean;
  readonly submitTransactionDisabled: boolean;
  readonly packageFeedback: MonitorAppFeedback | null;
  readonly transactionFeedback: MonitorAppFeedback | null;
  readonly riskFeedback: MonitorAppFeedback | null;
  readonly riskFeedbackPulse: number;
  readonly hitAreasVisible: boolean;
  readonly assets: ReturnType<
    ImageAssetStore<MonitorDesktopAssetKey>["getStatus"]
  >;
  readonly interactiveItems: readonly InteractiveItem<MonitorDesktopItemId>[];
}

interface MonitorDesktopSceneOptions {
  readonly onReturnToDesk: () => void;
  readonly commandPort: GameCommandPort;
  readonly onCursorChange?: (cursor: string) => void;
}

const APP_EVENT_FEEDBACK_DURATION_MS = 3200;
const COMPACT_HIT_PADDING = 3;
const SLOT_HIT_PADDING = 2;
const ACTION_HIT_PADDING_X = 8;
const ACTION_HIT_PADDING_Y = 4;
const MOBILE_MIN_HIT_SIZE = 44;

export class MonitorDesktopScene implements Scene {
  readonly id = "monitor-desktop" as const;
  readonly title = "Monitor Desktop";

  private readonly assets = new ImageAssetStore<MonitorDesktopAssetKey>(
    MONITOR_DESKTOP_ASSET_URLS,
  );
  private currentApp: MonitorAppId | null = null;
  private hoveredItemId: MonitorDesktopItemId | null = null;
  private pressedItemId: MonitorDesktopItemId | null = null;
  private activePointerId: number | null = null;
  private draggingItemId: MonitorDesktopItemId | null = null;
  private dragPoint: Point | null = null;
  private highlightedSlotIndex: number | null = null;
  private selectedRawCardId: string | null = null;
  private visibleState: Readonly<VisibleGameState> = MOCK_VISIBLE_STATE;
  private packageFeedback: MonitorAppFeedback | null = null;
  private transactionFeedback: MonitorAppFeedback | null = null;
  private riskFeedback: MonitorAppFeedback | null = null;
  private hitAreasVisible = false;

  constructor(private readonly options: MonitorDesktopSceneOptions) {}

  enter(frame: SceneFrame): void {
    this.currentApp = null;
    this.hoveredItemId = null;
    this.visibleState = frame.gameState.visibleState;
    this.resetPointerState();
  }

  exit(_frame: SceneFrame): void {
    this.currentApp = null;
    this.hoveredItemId = null;
    this.resetPointerState();
    this.options.onCursorChange?.("crosshair");
  }

  update(frame: SceneFrame): void {
    this.visibleState = frame.gameState.visibleState;
    const now = performance.now();

    if (this.packageFeedback?.expiresAt && this.packageFeedback.expiresAt <= now) {
      this.packageFeedback = null;
    }
    if (
      this.transactionFeedback?.expiresAt &&
      this.transactionFeedback.expiresAt <= now
    ) {
      this.transactionFeedback = null;
    }
    if (this.riskFeedback?.expiresAt && this.riskFeedback.expiresAt <= now) {
      this.riskFeedback = null;
    }
  }

  handleInput(event: NormalizedPointerEvent, frame: SceneFrame): void {
    this.visibleState = frame.gameState.visibleState;
    const point = toDeskPoint(event.position, getDeskTransform(frame.viewport));
    const item = hitTestInteractiveItems(this.getInteractiveItems(), point);

    if (event.phase === "pointer-move") {
      this.hoveredItemId = item?.id ?? null;
      this.options.onCursorChange?.(this.getCursor(item));
      return;
    }

    if (event.phase === "pointer-down") {
      if (this.activePointerId !== null) {
        return;
      }
      this.activePointerId = event.pointerId;
      this.pressedItemId =
        item && (item.clickable || item.draggable) ? item.id : null;
      this.hoveredItemId = item?.id ?? null;
      this.options.onCursorChange?.(this.getCursor(item));
      return;
    }

    if (event.pointerId !== this.activePointerId) {
      return;
    }

    if (event.phase === "drag-start") {
      if (this.pressedItemId?.startsWith("data-raw-card:")) {
        this.draggingItemId = this.pressedItemId;
        this.dragPoint = point;
        this.updateHighlightedSlot(point);
        this.options.onCursorChange?.("grabbing");
      }
      return;
    }

    if (event.phase === "drag-move") {
      if (this.draggingItemId) {
        this.dragPoint = point;
        this.updateHighlightedSlot(point);
      }
      return;
    }

    if (event.phase === "drag-end") {
      this.finishCardDrag(point);
      this.resetPointerState();
      this.refreshHover(point);
      return;
    }

    if (event.phase === "pointer-cancel") {
      this.resetPointerState();
      this.hoveredItemId = null;
      this.options.onCursorChange?.("default");
      return;
    }

    if (event.phase === "pointer-up") {
      return;
    }

    if (event.phase === "click") {
      this.handleClick(item);
      this.resetPointerState();
      this.refreshHover(point);
    }
  }

  handleGameEvent(event: ProgramBEvent): void {
    const message = this.getEventMessage(event.payload);
    const expiresAt = performance.now() + APP_EVENT_FEEDBACK_DURATION_MS;

    switch (event.type) {
      case "packageCreated":
      case "packageWasted":
        this.packageFeedback = {
          type: event.type,
          message:
            message ||
            (event.type === "packageCreated"
              ? "数据包已生成。"
              : "本次封装未生成有效数据包。"),
          expiresAt,
        };
        break;
      case "transactionSuccess":
      case "transactionFailed":
        this.transactionFeedback = {
          type: event.type,
          message:
            message ||
            (event.type === "transactionSuccess"
              ? "交易已完成。"
              : "交易未完成。"),
          expiresAt,
        };
        break;
      case "riskChanged":
        this.riskFeedback = {
          type: event.type,
          message: message || "风险状态已由 Program B 更新。",
          expiresAt,
        };
        break;
    }
  }

  renderLayer(
    context: CanvasRenderingContext2D,
    layer: RenderLayer,
    frame: SceneFrame,
  ): void {
    const transform = getDeskTransform(frame.viewport);

    if (layer === "background") {
      context.fillStyle = "#06111f";
      context.fillRect(
        0,
        0,
        frame.viewport.logicalWidth,
        frame.viewport.logicalHeight,
      );
    }

    context.save();
    context.translate(transform.offsetX, transform.offsetY);
    context.scale(transform.scale, transform.scale);
    context.imageSmoothingEnabled = false;

    if (layer === "background" || layer === "ui") {
      const jitter = getCRTJitter(
        frame.elapsedTime,
        MONITOR_DESKTOP_CRT_CONFIG,
        this.currentApp ? 0.55 : 0.82,
      );
      context.translate(jitter.x, jitter.y);
    }

    switch (layer) {
      case "background":
        this.renderWallpaper(context);
        break;
      case "ui":
        if (this.currentApp) {
          this.renderAppPage(context, this.currentApp, frame.gameState.visibleState);
        } else {
          this.renderDesktopHome(context);
        }
        this.renderTaskbar(context);
        break;
      case "effects":
        this.renderEffects(context, frame);
        break;
      case "devices":
      case "cards":
        break;
    }

    context.restore();
  }

  setHitAreasVisible(visible: boolean): void {
    this.hitAreasVisible = visible;
  }

  openApp(appId: MonitorAppId): boolean {
    if (!MONITOR_APP_IDS.includes(appId)) {
      return false;
    }
    this.currentApp = appId;
    this.hoveredItemId = null;
    this.resetPointerState();
    this.options.onCursorChange?.("default");
    return true;
  }

  backToDesktop(): boolean {
    if (!this.currentApp) {
      return false;
    }
    this.currentApp = null;
    this.hoveredItemId = null;
    this.resetPointerState();
    this.options.onCursorChange?.("default");
    return true;
  }

  closeMonitor(): void {
    this.currentApp = null;
    this.hoveredItemId = null;
    this.resetPointerState();
    this.options.onReturnToDesk();
  }

  getDebugState(): MonitorDesktopDebugState {
    return {
      view: this.currentApp ? "monitor-app" : "monitor-desktop",
      currentApp: this.currentApp,
      hoveredItemId: this.hoveredItemId,
      pressedItemId: this.pressedItemId,
      selectedRawCardId: this.selectedRawCardId,
      selectedPackageId: this.visibleState.selectedPackageId,
      selectedBuyerId: this.visibleState.selectedBuyerId,
      slotCardIds: [...this.visibleState.workbench.slotCardIds.slice(0, 3)],
      draggingItemId: this.draggingItemId,
      highlightedSlotIndex: this.highlightedSlotIndex,
      disabledRawCardIds: this.visibleState.rawCards
        .filter((card) => card.disabled === true)
        .map((card) => card.id),
      createPackageDisabled: this.isCreatePackageDisabled(),
      submitTransactionDisabled: this.isSubmitTransactionDisabled(),
      packageFeedback: this.packageFeedback,
      transactionFeedback: this.transactionFeedback,
      riskFeedback: this.riskFeedback,
      riskFeedbackPulse: this.getRiskFeedbackPulse(),
      hitAreasVisible: this.hitAreasVisible,
      assets: this.assets.getStatus(),
      interactiveItems: this.getInteractiveItems(),
    };
  }

  destroy(): void {
    this.assets.destroy();
  }

  private handleClick(
    item: InteractiveItem<MonitorDesktopItemId> | null,
  ): void {
    if (!item?.clickable) {
      return;
    }
    if (item.id === "monitor-desktop-return") {
      this.closeMonitor();
      return;
    }
    if (item.id === "monitor-app-close") {
      this.backToDesktop();
      return;
    }
    if (item.id.startsWith("monitor-app:")) {
      this.openApp(item.id.replace("monitor-app:", "") as MonitorAppId);
      return;
    }
    if (item.id.startsWith("data-raw-card:")) {
      this.selectedRawCardId = item.cardId ?? null;
      return;
    }
    if (item.id.startsWith("data-slot:")) {
      this.options.commandPort.removeCardFromSlot(
        Number(item.id.replace("data-slot:", "")),
      );
      return;
    }
    if (item.id === "data-create-package") {
      this.options.commandPort.createPackage();
      return;
    }
    if (item.id.startsWith("trade-package:")) {
      this.options.commandPort.selectPackage(
        item.id.replace("trade-package:", ""),
      );
      return;
    }
    if (item.id.startsWith("trade-buyer:")) {
      this.options.commandPort.selectBuyer(item.id.replace("trade-buyer:", ""));
      return;
    }
    if (item.id === "trade-submit") {
      const { selectedPackageId, selectedBuyerId } = this.visibleState;
      if (selectedPackageId && selectedBuyerId) {
        this.options.commandPort.submitTransaction(
          selectedPackageId,
          selectedBuyerId,
        );
      }
    }
  }

  private finishCardDrag(point: Point): void {
    if (!this.draggingItemId?.startsWith("data-raw-card:")) {
      return;
    }
    const slotIndex = MONITOR_APP_LAYOUT.dataProcessing.slotRects.findIndex(
      (rect) =>
        containsPoint(
          {
            type: "rect",
            rect: expandHitRect(rect, SLOT_HIT_PADDING, SLOT_HIT_PADDING),
          },
          point,
        ),
    );
    if (slotIndex < 0) {
      return;
    }
    const cardId = this.draggingItemId.replace("data-raw-card:", "");
    this.selectedRawCardId = cardId;
    this.options.commandPort.placeCardToSlot(cardId, slotIndex);
  }

  private updateHighlightedSlot(point: Point): void {
    const slotIndex = MONITOR_APP_LAYOUT.dataProcessing.slotRects.findIndex(
      (rect) =>
        containsPoint(
          {
            type: "rect",
            rect: expandHitRect(rect, SLOT_HIT_PADDING, SLOT_HIT_PADDING),
          },
          point,
        ),
    );
    this.highlightedSlotIndex = slotIndex >= 0 ? slotIndex : null;
  }

  private refreshHover(point: Point): void {
    const item = hitTestInteractiveItems(this.getInteractiveItems(), point);
    this.hoveredItemId = item?.id ?? null;
    this.options.onCursorChange?.(this.getCursor(item));
  }

  private resetPointerState(): void {
    this.activePointerId = null;
    this.pressedItemId = null;
    this.draggingItemId = null;
    this.dragPoint = null;
    this.highlightedSlotIndex = null;
  }

  private getCursor(
    item: InteractiveItem<MonitorDesktopItemId> | null,
  ): string {
    if (this.draggingItemId) {
      return "grabbing";
    }
    if (!item) {
      return "default";
    }
    if (!item.clickable && !item.draggable && !item.acceptsDrop) {
      return "not-allowed";
    }
    if (item.draggable) {
      return "grab";
    }
    return item.clickable || item.acceptsDrop ? "pointer" : "default";
  }

  private getEventMessage(payload: unknown): string | null {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }
    return null;
  }

  private isCreatePackageDisabled(): boolean {
    return !this.visibleState.workbench.slotCardIds
      .slice(0, 3)
      .some((cardId) => cardId !== null);
  }

  private isSubmitTransactionDisabled(): boolean {
    return !(
      this.visibleState.selectedPackageId &&
      this.visibleState.selectedBuyerId
    );
  }

  private getAppViewState(): MonitorAppViewState {
    return {
      hoveredItemId: this.hoveredItemId,
      pressedItemId: this.pressedItemId,
      selectedRawCardId: this.selectedRawCardId,
      draggingItemId: this.draggingItemId,
      highlightedSlotIndex: this.highlightedSlotIndex,
      createPackageDisabled: this.isCreatePackageDisabled(),
      submitTransactionDisabled: this.isSubmitTransactionDisabled(),
      packageFeedback: this.packageFeedback,
      transactionFeedback: this.transactionFeedback,
      riskFeedback: this.riskFeedback,
      riskFeedbackPulse: this.getRiskFeedbackPulse(),
    };
  }

  private getRiskFeedbackPulse(): number {
    return this.riskFeedback
      ? 0.5 + Math.sin(performance.now() / 95) * 0.5
      : 0;
  }

  private renderWallpaper(context: CanvasRenderingContext2D): void {
    const wallpaper = this.assets.get("wallpaper");
    if (!wallpaper) {
      drawCanvasPlaceholder(
        context,
        { x: 0, y: 0, width: 390, height: 844 },
        "MONITOR WALLPAPER",
        {
          background: "#315b79",
          border: "#8ba7b5",
          foreground: "#d6e6e7",
        },
      );
      return;
    }
    const targetRatio = DESK_DESIGN_SIZE.width / DESK_DESIGN_SIZE.height;
    const sourceWidth = wallpaper.height * targetRatio;
    const sourceX = (wallpaper.width - sourceWidth) / 2;
    context.drawImage(
      wallpaper,
      sourceX,
      0,
      sourceWidth,
      wallpaper.height,
      -1.5,
      -1.5,
      DESK_DESIGN_SIZE.width + 3,
      DESK_DESIGN_SIZE.height + 3,
    );
  }

  private renderDesktopHome(context: CanvasRenderingContext2D): void {
    for (const shortcut of MONITOR_DESKTOP_LAYOUT.shortcuts) {
      const itemId = `monitor-app:${shortcut.id}` as const;
      const hovered = this.hoveredItemId === itemId;
      const pressed = this.pressedItemId === itemId;

      context.save();
      if (pressed) {
        context.translate(0, 1);
      }

      if (hovered) {
        context.fillStyle = "rgba(8, 23, 36, 0.42)";
        context.strokeStyle = "rgba(231, 239, 224, 0.62)";
        context.lineWidth = 1;
        context.fillRect(
          shortcut.hitRect.x,
          shortcut.hitRect.y,
          shortcut.hitRect.width,
          shortcut.hitRect.height,
        );
        context.strokeRect(
          shortcut.hitRect.x,
          shortcut.hitRect.y,
          shortcut.hitRect.width,
          shortcut.hitRect.height,
        );
      }

      this.drawAppIcon(context, shortcut.id, shortcut.iconRect, shortcut.accent);
      context.save();
      context.fillStyle = "#f0f2e8";
      context.font = "700 10px sans-serif";
      context.textBaseline = "top";
      context.shadowColor = "rgba(0, 0, 0, 0.9)";
      context.shadowBlur = 2;
      context.fillText(
        shortcut.label,
        shortcut.iconRect.x,
        shortcut.iconRect.y + shortcut.iconRect.height + 8,
      );
      context.fillStyle = "#d9dfd7";
      context.font = "500 7px ui-monospace, Consolas, monospace";
      context.fillText(
        "单击打开",
        shortcut.iconRect.x,
        shortcut.iconRect.y + shortcut.iconRect.height + 25,
      );
      context.restore();
      context.restore();
    }
  }

  private renderAppPage(
    context: CanvasRenderingContext2D,
    appId: MonitorAppId,
    state: Readonly<VisibleGameState>,
  ): void {
    const shortcut = this.getShortcut(appId);
    const title =
      appId === "data-processing" ? "数据封装工具" : shortcut.label;
    this.renderAppWindow(context, appId, title, shortcut.accent);
    renderMonitorAppContent(
      context,
      appId,
      state,
      this.getAppViewState(),
      shortcut.accent,
    );
  }

  private renderAppWindow(
    context: CanvasRenderingContext2D,
    appId: MonitorAppId,
    title: string,
    accent: string,
  ): void {
    const windowRect = MONITOR_DESKTOP_LAYOUT.appWindow;
    context.save();
    context.fillStyle = "rgba(4, 11, 18, 0.42)";
    context.fillRect(0, 0, DESK_DESIGN_SIZE.width, DESK_DESIGN_SIZE.height);
    context.shadowColor = "rgba(0, 0, 0, 0.58)";
    context.shadowBlur = 16;
    context.shadowOffsetY = 8;
    context.fillStyle = "rgba(213, 221, 216, 0.98)";
    context.strokeStyle = "#172c42";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(
      windowRect.x,
      windowRect.y,
      windowRect.width,
      windowRect.height,
      5,
    );
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();
    context.fillStyle = "#173d82";
    context.fillRect(windowRect.x + 2, windowRect.y + 2, windowRect.width - 4, 52);
    this.drawAppIcon(context, appId, { x: 28, y: 65, width: 30, height: 30 }, accent);
    context.fillStyle = "#f3f4e9";
    context.font = "700 13px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(title, 66, 80);
    this.drawButton(
      context,
      MONITOR_DESKTOP_LAYOUT.appCloseButtonVisual,
      "×",
      this.hoveredItemId === "monitor-app-close",
      this.pressedItemId === "monitor-app-close",
    );
    context.restore();
  }

  private renderTaskbar(context: CanvasRenderingContext2D): void {
    const taskbar = MONITOR_DESKTOP_LAYOUT.taskbar;
    context.save();
    context.fillStyle = "rgba(12, 34, 55, 0.82)";
    context.fillRect(taskbar.x, taskbar.y, taskbar.width, taskbar.height);
    context.strokeStyle = "rgba(214, 227, 230, 0.54)";
    context.beginPath();
    context.moveTo(0, taskbar.y + 0.5);
    context.lineTo(390, taskbar.y + 0.5);
    context.stroke();
    context.fillStyle = "#e6ede6";
    context.font = "600 8px ui-monospace, Consolas, monospace";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
      this.currentApp
        ? `PROGRAM A · ${this.currentApp}`
        : "PROGRAM A · MONITOR DESKTOP",
      12,
      822,
    );
    this.drawButton(
      context,
      MONITOR_DESKTOP_LAYOUT.returnButtonVisual,
      "← 返回工位",
      this.hoveredItemId === "monitor-desktop-return",
      this.pressedItemId === "monitor-desktop-return",
    );
    context.restore();
  }

  private drawAppIcon(
    context: CanvasRenderingContext2D,
    appId: MonitorAppId,
    rect: Rect,
    accent: string,
  ): void {
    const icon = this.assets.get(appId);
    if (icon) {
      context.drawImage(icon, rect.x, rect.y, rect.width, rect.height);
      return;
    }
    drawCanvasPlaceholder(context, rect, appId.toUpperCase(), {
      background: "#242c2b",
      border: accent,
      foreground: "#edf1e7",
    });
  }

  private drawButton(
    context: CanvasRenderingContext2D,
    rect: Rect,
    label: string,
    hovered: boolean,
    pressed: boolean,
  ): void {
    context.save();
    if (pressed) {
      context.translate(0, 1);
    }
    context.fillStyle = pressed
      ? "rgba(178, 190, 181, 0.96)"
      : hovered
      ? "rgba(225, 231, 217, 0.94)"
      : "rgba(10, 27, 42, 0.82)";
    context.strokeStyle = "rgba(230, 237, 224, 0.76)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(rect.x, rect.y, rect.width, rect.height, 4);
    context.fill();
    context.stroke();
    context.fillStyle = hovered ? "#1b2a31" : "#edf1e7";
    context.font = "700 8px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
    context.restore();
  }

  private renderEffects(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    context.save();
    if (this.draggingItemId?.startsWith("data-raw-card:") && this.dragPoint) {
      const cardId = this.draggingItemId.replace("data-raw-card:", "");
      const card = this.visibleState.rawCards.find((item) => item.id === cardId) ?? null;
      renderMonitorDraggedCard(context, this.dragPoint, card, cardId);
    }

    drawCRTEffect(
      context,
      {
        x: 0,
        y: 0,
        width: DESK_DESIGN_SIZE.width,
        height: DESK_DESIGN_SIZE.height,
      },
      frame.elapsedTime,
      {
        config: MONITOR_DESKTOP_CRT_CONFIG,
        cornerRadius: 17,
        intensity: this.currentApp ? 0.72 : 0.92,
        signalDrift: true,
      },
    );

    if (this.hitAreasVisible) {
      for (const item of this.getInteractiveItems()) {
        drawHitAreaDebug(context, item, item.id === this.hoveredItemId);
      }
      this.renderInteractionDebug(context);
    }
    context.restore();
  }

  private renderInteractionDebug(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgba(4, 12, 18, 0.86)";
    context.fillRect(140, 10, 236, 82);
    context.fillStyle = "#9ed7d2";
    context.font = "600 7px ui-monospace, Consolas, monospace";
    context.textBaseline = "top";
    const lines = [
      `view: ${this.currentApp ? "monitor-app" : "monitor-desktop"}`,
      `currentApp: ${this.currentApp ?? "none"}`,
      `selectedPackageId: ${this.visibleState.selectedPackageId ?? "none"}`,
      `selectedBuyerId: ${this.visibleState.selectedBuyerId ?? "none"}`,
      `slotCardIds: ${this.visibleState.workbench.slotCardIds
        .slice(0, 3)
        .map((cardId) => cardId ?? "-")
        .join(" | ")}`,
      `pointer: ${this.activePointerId ?? "none"} · pressed: ${this.pressedItemId ?? "none"}`,
      `drag: ${this.draggingItemId ?? "none"} · highlight: ${this.highlightedSlotIndex ?? "none"}`,
    ];
    lines.forEach((line, index) => context.fillText(line, 148, 15 + index * 11));
  }

  private getShortcut(appId: MonitorAppId) {
    return (
      MONITOR_DESKTOP_LAYOUT.shortcuts.find(
        (shortcut) => shortcut.id === appId,
      ) ?? MONITOR_DESKTOP_LAYOUT.shortcuts[0]
    );
  }

  private getInteractiveItems(): readonly InteractiveItem<MonitorDesktopItemId>[] {
    const returnItem: InteractiveItem<MonitorDesktopItemId> = {
      id: "monitor-desktop-return",
      label: "关闭显示器并返回现实工位",
      hitArea: { type: "rect", rect: MONITOR_DESKTOP_LAYOUT.returnButton },
      clickable: true,
      draggable: false,
      zIndex: 30,
    };

    if (!this.currentApp) {
      return [
        ...MONITOR_DESKTOP_LAYOUT.shortcuts.map(
          (shortcut): InteractiveItem<MonitorDesktopItemId> => ({
            id: `monitor-app:${shortcut.id}`,
            label: `${shortcut.label} App 入口`,
            hitArea: { type: "rect", rect: shortcut.hitRect },
            clickable: true,
            draggable: false,
            zIndex: 20,
          }),
        ),
        returnItem,
      ];
    }

    const closeItem: InteractiveItem<MonitorDesktopItemId> = {
      id: "monitor-app-close",
      label: "关闭 App 并返回电脑主页",
      hitArea: { type: "rect", rect: MONITOR_DESKTOP_LAYOUT.appCloseButton },
      clickable: true,
      draggable: false,
      zIndex: 60,
    };
    const appItems: InteractiveItem<MonitorDesktopItemId>[] = [];

    if (this.currentApp === "data-processing") {
      this.visibleState.rawCards.slice(0, 6).forEach((card, index) => {
        const disabled = card.disabled === true;
        appItems.push({
          id: `data-raw-card:${card.id}`,
          label: disabled
            ? `数据卡 ${card.id} · mock disabled`
            : `选择或拖动数据卡 ${card.id}`,
          hitArea: {
            type: "rect",
            rect: expandHitRect(
              MONITOR_APP_LAYOUT.dataProcessing.rawCardRects[index],
              COMPACT_HIT_PADDING,
              COMPACT_HIT_PADDING,
              MOBILE_MIN_HIT_SIZE,
              MOBILE_MIN_HIT_SIZE,
            ),
          },
          clickable: !disabled,
          draggable: !disabled,
          cardId: card.id,
          zIndex: 40,
        });
      });
      MONITOR_APP_LAYOUT.dataProcessing.slotRects.forEach((rect, index) => {
        const cardId = this.visibleState.workbench.slotCardIds[index] ?? null;
        appItems.push({
          id: `data-slot:${index}`,
          label: cardId
            ? `处理槽位 ${index + 1} · 点击移除 ${cardId}`
            : `处理槽位 ${index + 1} · 可接收数据卡`,
          hitArea: {
            type: "rect",
            rect: expandHitRect(rect, SLOT_HIT_PADDING, SLOT_HIT_PADDING),
          },
          clickable: cardId !== null,
          draggable: false,
          acceptsDrop: true,
          ...(cardId ? { cardId } : {}),
          zIndex: 30,
        });
      });
      appItems.push({
        id: "data-create-package",
        label: "调用 createPackage(preferredRecipeId?)",
        hitArea: {
          type: "rect",
          rect: expandHitRect(
            MONITOR_APP_LAYOUT.dataProcessing.createButton,
            ACTION_HIT_PADDING_X,
            ACTION_HIT_PADDING_Y,
            MOBILE_MIN_HIT_SIZE,
            MOBILE_MIN_HIT_SIZE,
          ),
        },
        clickable: !this.isCreatePackageDisabled(),
        draggable: false,
        zIndex: 35,
      });
    }

    if (this.currentApp === "buyer-trade") {
      this.visibleState.processedPackages.slice(0, 4).forEach((item, index) => {
        appItems.push({
          id: `trade-package:${item.id}`,
          label: `选择数据包 ${item.id}`,
          hitArea: {
            type: "rect",
            rect: expandHitRect(
              MONITOR_APP_LAYOUT.buyerTrade.packageRects[index],
              COMPACT_HIT_PADDING,
              COMPACT_HIT_PADDING,
            ),
          },
          clickable: true,
          draggable: false,
          zIndex: 40,
        });
      });
      this.visibleState.buyers.slice(0, 3).forEach((buyer, index) => {
        appItems.push({
          id: `trade-buyer:${buyer.id}`,
          label: `选择买家 ${buyer.id}`,
          hitArea: {
            type: "rect",
            rect: expandHitRect(
              MONITOR_APP_LAYOUT.buyerTrade.buyerRects[index],
              SLOT_HIT_PADDING,
              COMPACT_HIT_PADDING,
            ),
          },
          clickable: true,
          draggable: false,
          zIndex: 40,
        });
      });
      appItems.push({
        id: "trade-submit",
        label: "调用 submitTransaction(packageId, buyerId)",
        hitArea: {
          type: "rect",
          rect: expandHitRect(
            MONITOR_APP_LAYOUT.buyerTrade.submitButton,
            ACTION_HIT_PADDING_X,
            ACTION_HIT_PADDING_Y,
            MOBILE_MIN_HIT_SIZE,
            MOBILE_MIN_HIT_SIZE,
          ),
        },
        clickable: !this.isSubmitTransactionDisabled(),
        draggable: false,
        zIndex: 35,
      });
    }

    return [...appItems, closeItem, returnItem];
  }
}

function expandHitRect(
  rect: Rect,
  paddingX: number,
  paddingY: number,
  minWidth = 0,
  minHeight = 0,
): Rect {
  const width = Math.max(rect.width + paddingX * 2, minWidth);
  const height = Math.max(rect.height + paddingY * 2, minHeight);

  return {
    x: rect.x - (width - rect.width) / 2,
    y: rect.y - (height - rect.height) / 2,
    width,
    height,
  };
}
