import { ImageAssetStore } from "../assets/ImageAssetStore";
import {
  DESK_ASSET_URLS,
  type DeskAssetKey,
} from "../assets/ProgramAAssetManifest";
import type {
  NormalizedPointerEvent,
  Point,
  RenderLayer,
} from "../core/types";
import type { GameCommandPort } from "../game/GamePorts";
import type {
  VisibleDataCard,
  VisibleYesterdayNews,
} from "../game/VisibleGameState";
import type { Scene, SceneFrame } from "./Scene";
import { drawCanvasPlaceholder } from "../render/CanvasPlaceholder";
import {
  drawCRTEffect,
  getCRTJitter,
  REALITY_DESK_CRT_CONFIG,
} from "../render/CRTEffect";
import {
  DESK_DESIGN_SIZE,
  DESK_LAYOUT,
  getCardOrigin,
  getDeskTransform,
  toDeskPoint,
  type DesignTransform,
} from "./desk/DeskSceneConfig";
import {
  containsPoint,
  drawHitAreaDebug,
  hitTestInteractiveItems,
  rectsIntersect,
  type InteractiveItem,
  type Rect,
} from "./desk/InteractiveItem";

type DeskItemId =
  | "monitor-screen"
  | "pending-file-stack"
  | "operation-tray"
  | "newspaper"
  | "news-close"
  | "card-detail-close"
  | `data-card:${string}`;

interface CardPosition {
  origin: Point;
  current: Point;
}

type DragTarget =
  | {
      readonly type: "card";
      readonly itemId: `data-card:${string}`;
      readonly cardId: string;
    }
  | {
      readonly type: "newspaper";
      readonly itemId: "newspaper";
    };

interface PendingDrag {
  readonly pointerId: number;
  readonly target: DragTarget;
  readonly grabOffset: Point;
  readonly dragOrigin: Point;
}

interface ActiveDrag extends PendingDrag {}

interface SubmissionFeedback {
  readonly cardId: string;
  readonly message: string;
  readonly expiresAt: number;
}

export interface CardDetailContent {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly sensitivity: string;
}

export interface DeskDebugState {
  readonly view: "reality-desk";
  readonly hitAreasVisible: boolean;
  readonly hoveredItemId: DeskItemId | null;
  readonly draggingItemId: DeskItemId | null;
  readonly draggingCardId: string | null;
  readonly newsOpen: boolean;
  readonly newsContent: VisibleYesterdayNews | null;
  readonly cardDetailOpen: boolean;
  readonly cardDetailContent: CardDetailContent | null;
  readonly newspaperPosition: Point;
  readonly lastSubmissionCardId: string | null;
  readonly submissionFeedback: string | null;
  readonly cameraLightOn: boolean;
  readonly assets: ReturnType<ImageAssetStore<DeskAssetKey>["getStatus"]>;
  readonly transform: DesignTransform;
  readonly interactiveItems: readonly InteractiveItem<DeskItemId>[];
}

interface MonitorRoomSceneOptions {
  readonly onEnterMonitorDesktop: () => void;
  readonly commandPort: GameCommandPort;
  readonly onCursorChange?: (cursor: string) => void;
}

const EMPTY_NEWS: VisibleYesterdayNews = Object.freeze({
  title: "昨日无新闻记录",
  summary: "新闻数据尚未接入，当前显示桌面占位内容。",
  dateLabel: "昨日晨报 · 暂无数据",
});

const CARD_COLORS: Record<VisibleDataCard["sensitivity"], string> = {
  low: "#78919a",
  medium: "#b18a55",
  high: "#9d5552",
};

const SENSITIVITY_LABELS: Record<VisibleDataCard["sensitivity"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const DESK_ASSET_PLACEHOLDER_LABELS: Record<DeskAssetKey, string> = {
  background: "DESK BACKGROUND",
  monitor: "CRT MONITOR",
  desktopWallpaper: "MONITOR WALLPAPER",
  pendingStack: "PENDING FILES",
  operationTray: "OPERATION TRAY",
  newspaper: "NEWSPAPER",
  cameraOff: "CAMERA",
};

export class MonitorRoomScene implements Scene {
  readonly id = "monitor-room" as const;
  readonly title = "Reality Desk";

  private readonly assets = new ImageAssetStore<DeskAssetKey>(
    DESK_ASSET_URLS,
  );
  private monitorScreenBuffer: HTMLCanvasElement | null = null;
  private monitorScreenContext: CanvasRenderingContext2D | null = null;
  private readonly cardPositions = new Map<string, CardPosition>();
  private newspaperPosition: Point = {
    x: DESK_LAYOUT.newspaper.imageRect.x,
    y: DESK_LAYOUT.newspaper.imageRect.y,
  };
  private hitAreasVisible = false;
  private hoveredItemId: DeskItemId | null = null;
  private pendingDrag: PendingDrag | null = null;
  private activeDrag: ActiveDrag | null = null;
  private newsOpen = false;
  private selectedCardId: string | null = null;
  private feedback: SubmissionFeedback | null = null;
  private lastSubmissionCardId: string | null = null;

  constructor(private readonly options: MonitorRoomSceneOptions) {}

  enter(frame: SceneFrame): void {
    this.syncCardPositions(frame);
  }

  exit(_frame: SceneFrame): void {
    this.cancelDrag();
    this.hoveredItemId = null;
    this.options.onCursorChange?.("crosshair");
  }

  update(frame: SceneFrame): void {
    this.syncCardPositions(frame);

    if (this.feedback && frame.elapsedTime >= this.feedback.expiresAt) {
      this.feedback = null;
    }
  }

  handleInput(event: NormalizedPointerEvent, frame: SceneFrame): void {
    const transform = getDeskTransform(frame.viewport);
    const point = toDeskPoint(event.position, transform);
    const insideDesign =
      point.x >= 0 &&
      point.x <= DESK_DESIGN_SIZE.width &&
      point.y >= 0 &&
      point.y <= DESK_DESIGN_SIZE.height;

    if (!insideDesign && event.phase === "pointer-move") {
      this.setHoveredItem(null);
      return;
    }

    if (this.newsOpen || this.selectedCardId) {
      this.handleOverlayInput(event, point);
      return;
    }

    const items = this.getInteractiveItems(frame);
    const hitItem = hitTestInteractiveItems(items, point);

    switch (event.phase) {
      case "pointer-move":
        if (!this.activeDrag) {
          this.setHoveredItem(hitItem);
        }
        break;
      case "pointer-down":
        this.setHoveredItem(hitItem);
        this.prepareDrag(event, point, hitItem);
        break;
      case "drag-start":
        this.startDrag(event, point);
        break;
      case "drag-move":
        this.moveDrag(event, point);
        break;
      case "drag-end":
        this.finishDrag(event, point, frame);
        break;
      case "pointer-cancel":
        this.cancelDrag();
        break;
      case "click":
        this.pendingDrag = null;
        this.activateItem(hitItem, frame);
        break;
      case "pointer-up":
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
      context.fillStyle = "#070806";
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
    context.imageSmoothingEnabled = true;

    switch (layer) {
      case "background":
        this.renderBackground(context);
        break;
      case "devices":
        this.renderDevices(context, frame);
        break;
      case "cards":
        this.renderDeskObjects(context, frame);
        break;
      case "ui":
        this.renderUi(context, frame);
        break;
      case "effects":
        this.renderEffects(context, frame);
        break;
    }

    context.restore();
  }

  setHitAreasVisible(visible: boolean): void {
    this.hitAreasVisible = visible;
  }

  toggleHitAreas(): boolean {
    this.hitAreasVisible = !this.hitAreasVisible;
    return this.hitAreasVisible;
  }

  closeNewsOverlay(): boolean {
    if (!this.newsOpen) {
      return false;
    }

    this.newsOpen = false;
    this.hoveredItemId = null;
    this.options.onCursorChange?.("crosshair");
    return true;
  }

  closeCardDetailOverlay(): boolean {
    if (!this.selectedCardId) {
      return false;
    }

    this.selectedCardId = null;
    this.hoveredItemId = null;
    this.options.onCursorChange?.("crosshair");
    return true;
  }

  closeOpenOverlay(): boolean {
    return this.closeCardDetailOverlay() || this.closeNewsOverlay();
  }

  getDebugState(frame: SceneFrame): DeskDebugState {
    const news = frame.visibleState.yesterdayNews ?? EMPTY_NEWS;

    return {
      view: "reality-desk",
      hitAreasVisible: this.hitAreasVisible,
      hoveredItemId: this.hoveredItemId,
      draggingItemId: this.activeDrag?.target.itemId ?? null,
      draggingCardId: this.getActiveCardId(),
      newsOpen: this.newsOpen,
      newsContent: this.newsOpen ? news : null,
      cardDetailOpen: Boolean(this.selectedCardId),
      cardDetailContent: this.getCardDetailContent(frame),
      newspaperPosition: { ...this.newspaperPosition },
      lastSubmissionCardId: this.lastSubmissionCardId,
      submissionFeedback: this.feedback?.message ?? null,
      cameraLightOn: this.isCameraLightOn(frame.elapsedTime),
      assets: this.assets.getStatus(),
      transform: getDeskTransform(frame.viewport),
      interactiveItems: this.getInteractiveItems(frame),
    };
  }

  destroy(): void {
    this.assets.destroy();
    if (this.monitorScreenBuffer) {
      this.monitorScreenBuffer.width = 1;
      this.monitorScreenBuffer.height = 1;
    }
    this.monitorScreenBuffer = null;
    this.monitorScreenContext = null;
    this.cardPositions.clear();
  }

  private renderBackground(context: CanvasRenderingContext2D): void {
    const background = this.assets.get("background");

    if (!background) {
      context.fillStyle = "#494a42";
      context.fillRect(0, 0, DESK_DESIGN_SIZE.width, 463);
      context.fillStyle = "#57402a";
      context.fillRect(0, 463, DESK_DESIGN_SIZE.width, 381);
      drawCanvasPlaceholder(
        context,
        { x: 8, y: 8, width: 374, height: 828 },
        DESK_ASSET_PLACEHOLDER_LABELS.background,
        {
          background: "rgba(0, 0, 0, 0.08)",
          border: "#8b806a",
          foreground: "#d0c4a7",
        },
      );
      return;
    }

    const sourceWidth =
      (DESK_DESIGN_SIZE.width / DESK_DESIGN_SIZE.height) * background.height;
    const sourceX = (background.width - sourceWidth) / 2;

    context.drawImage(
      background,
      sourceX,
      0,
      sourceWidth,
      background.height,
      0,
      0,
      DESK_DESIGN_SIZE.width,
      DESK_DESIGN_SIZE.height,
    );
  }

  private renderDevices(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    this.drawAsset(context, "cameraOff", DESK_LAYOUT.camera.imageRect);
    this.drawAsset(context, "monitor", DESK_LAYOUT.monitor.imageRect);
    this.drawMonitorScreen(context, frame.elapsedTime);
    this.drawAsset(
      context,
      "operationTray",
      DESK_LAYOUT.operationTray.imageRect,
    );
  }

  private renderDeskObjects(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    this.drawAsset(
      context,
      "pendingStack",
      DESK_LAYOUT.pendingStack.imageRect,
    );

    const cards = frame.visibleState.rawCards;

    const activeCardId = this.getActiveCardId();

    cards.forEach((card) => {
      if (card.id !== activeCardId) {
        this.drawDataFile(context, card);
      }
    });

    const draggedCard = cards.find(
      (card) => card.id === activeCardId,
    );

    if (draggedCard) {
      this.drawDataFile(context, draggedCard, true);
    }

    this.drawNewspaper(
      context,
      this.activeDrag?.target.type === "newspaper",
    );
  }

  private renderUi(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    if (this.feedback) {
      const { rect } = DESK_LAYOUT.feedback;
      context.save();
      context.fillStyle = "rgba(16, 19, 17, 0.88)";
      context.strokeStyle = "rgba(220, 185, 112, 0.8)";
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(rect.x, rect.y, rect.width, rect.height, 5);
      context.fill();
      context.stroke();
      context.fillStyle = "#e8d7aa";
      context.font = "600 8px ui-monospace, Consolas, monospace";
      context.textBaseline = "middle";
      context.fillText(this.feedback.message, rect.x + 9, rect.y + 15);
      context.fillStyle = "#9f9275";
      context.font = "500 6px ui-monospace, Consolas, monospace";
      context.fillText(
        "等待 Program B 返回状态",
        rect.x + 9,
        rect.y + 29,
      );
      context.restore();
    }

    if (!this.newsOpen && !this.selectedCardId && this.hoveredItemId) {
      context.save();
      const label = this.getInteractiveItems(frame).find(
        (item) => item.id === this.hoveredItemId,
      )?.label;

      if (label) {
        context.font = "600 7px ui-monospace, Consolas, monospace";
        const width = context.measureText(label).width + 14;
        const x = (DESK_DESIGN_SIZE.width - width) / 2;
        context.fillStyle = "rgba(5, 7, 6, 0.82)";
        context.fillRect(x, 810, width, 19);
        context.fillStyle = "#d5c8a4";
        context.textBaseline = "middle";
        context.fillText(label, x + 7, 819.5);
      }

      context.restore();
    }
  }

  private renderEffects(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    this.renderCameraIndicator(context, frame.elapsedTime);

    if (this.hitAreasVisible) {
      for (const item of this.getInteractiveItems(frame)) {
        if (item.id !== "news-close" && item.id !== "card-detail-close") {
          drawHitAreaDebug(
            context,
            item,
            item.id === this.hoveredItemId,
          );
        }
      }
    } else if (this.hoveredItemId) {
      const hovered = this.getInteractiveItems(frame).find(
        (item) => item.id === this.hoveredItemId,
      );

      if (hovered) {
        context.save();
        context.globalAlpha = 0.55;
        drawHitAreaDebug(context, hovered, true);
        context.restore();
      }
    }

    if (this.newsOpen) {
      this.renderNewsOverlay(context, frame);

      if (this.hitAreasVisible) {
        const closeItem = this.getInteractiveItems(frame).find(
          (item) => item.id === "news-close",
        );

        if (closeItem) {
          drawHitAreaDebug(context, closeItem, false);
        }
      }
    } else if (this.selectedCardId) {
      this.renderCardDetailOverlay(context, frame);

      if (this.hitAreasVisible) {
        const closeItem = this.getInteractiveItems(frame).find(
          (item) => item.id === "card-detail-close",
        );

        if (closeItem) {
          drawHitAreaDebug(context, closeItem, false);
        }
      }
    }
  }

  private drawMonitorScreen(
    context: CanvasRenderingContext2D,
    elapsedTime: number,
  ): void {
    const wallpaper = this.assets.get("desktopWallpaper");
    const screen = DESK_LAYOUT.monitor.screenRect;
    const surface = this.prepareMonitorScreenBuffer();

    if (!surface) {
      drawCanvasPlaceholder(
        context,
        screen,
        DESK_ASSET_PLACEHOLDER_LABELS.desktopWallpaper,
        {
          background: "#315b79",
          border: "#90a9b7",
          foreground: "#d6e6e7",
        },
      );
      return;
    }

    const { buffer, bufferContext } = surface;
    const localScreen: Rect = {
      x: 0,
      y: 0,
      width: screen.width,
      height: screen.height,
    };
    const jitter = getCRTJitter(
      elapsedTime,
      REALITY_DESK_CRT_CONFIG,
    );
    const bleed = 1;

    if (wallpaper) {
      const sourceRatio = wallpaper.width / wallpaper.height;
      const targetRatio = screen.width / screen.height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = wallpaper.width;
      let sourceHeight = wallpaper.height;

      if (sourceRatio > targetRatio) {
        sourceWidth = wallpaper.height * targetRatio;
        sourceX = (wallpaper.width - sourceWidth) / 2;
      } else {
        sourceHeight = wallpaper.width / targetRatio;
        sourceY = (wallpaper.height - sourceHeight) / 2;
      }

      bufferContext.drawImage(
        wallpaper,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -bleed + jitter.x,
        -bleed + jitter.y,
        screen.width + bleed * 2,
        screen.height + bleed * 2,
      );
    } else {
      drawCanvasPlaceholder(
        bufferContext,
        localScreen,
        DESK_ASSET_PLACEHOLDER_LABELS.desktopWallpaper,
        {
          background: "#315b79",
          border: "#90a9b7",
          foreground: "#d6e6e7",
        },
      );
    }

    bufferContext.fillStyle = "rgba(11, 17, 15, 0.1)";
    bufferContext.fillRect(0, 0, screen.width, screen.height);
    drawCRTEffect(bufferContext, localScreen, elapsedTime, {
      config: REALITY_DESK_CRT_CONFIG,
      cornerRadius: 8,
      intensity: 1,
      signalDrift: true,
    });

    context.save();
    context.beginPath();
    context.roundRect(screen.x, screen.y, screen.width, screen.height, 8);
    context.clip();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      buffer,
      0,
      0,
      buffer.width,
      buffer.height,
      screen.x,
      screen.y,
      screen.width,
      screen.height,
    );
    context.restore();
  }

  private prepareMonitorScreenBuffer(): {
    readonly buffer: HTMLCanvasElement;
    readonly bufferContext: CanvasRenderingContext2D;
  } | null {
    const screen = DESK_LAYOUT.monitor.screenRect;
    const bufferScale = 2;
    const pixelWidth = Math.max(1, Math.round(screen.width * bufferScale));
    const pixelHeight = Math.max(1, Math.round(screen.height * bufferScale));

    if (!this.monitorScreenBuffer) {
      this.monitorScreenBuffer = document.createElement("canvas");
      this.monitorScreenContext = this.monitorScreenBuffer.getContext("2d", {
        alpha: false,
      });
    }

    if (!this.monitorScreenContext) {
      return null;
    }

    if (
      this.monitorScreenBuffer.width !== pixelWidth ||
      this.monitorScreenBuffer.height !== pixelHeight
    ) {
      this.monitorScreenBuffer.width = pixelWidth;
      this.monitorScreenBuffer.height = pixelHeight;
    }

    this.monitorScreenContext.setTransform(1, 0, 0, 1, 0, 0);
    this.monitorScreenContext.clearRect(0, 0, pixelWidth, pixelHeight);
    this.monitorScreenContext.setTransform(
      bufferScale,
      0,
      0,
      bufferScale,
      0,
      0,
    );
    this.monitorScreenContext.imageSmoothingEnabled = false;

    return {
      buffer: this.monitorScreenBuffer,
      bufferContext: this.monitorScreenContext,
    };
  }

  private drawDataFile(
    context: CanvasRenderingContext2D,
    card: VisibleDataCard,
    dragging = false,
  ): void {
    const position = this.cardPositions.get(card.id)?.current;

    if (!position) {
      return;
    }

    const { width, height } = DESK_LAYOUT.cards.size;
    const foldSize = 8;
    const rotation = this.getDataFileRotation(card.id, dragging);
    const title = card.title.trim() || "未命名数据文件";
    const summary = card.summary.trim() || "暂无文件摘要";
    const accent = CARD_COLORS[card.sensitivity];
    context.save();
    context.translate(position.x + width / 2, position.y + height / 2);
    context.rotate(rotation);
    context.translate(-(position.x + width / 2), -(position.y + height / 2));
    context.shadowColor = "rgba(0, 0, 0, 0.42)";
    context.shadowBlur = dragging ? 10 : 3.5;
    context.shadowOffsetX = dragging ? 2 : 0.5;
    context.shadowOffsetY = dragging ? 7 : 2;
    const paperGradient = context.createLinearGradient(
      position.x,
      position.y,
      position.x + width,
      position.y + height,
    );
    paperGradient.addColorStop(0, "#e1dac7");
    paperGradient.addColorStop(0.62, "#d5ccb4");
    paperGradient.addColorStop(1, "#c5b99d");
    context.fillStyle = paperGradient;
    context.strokeStyle = "#756a52";
    context.lineWidth = 0.75;
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineTo(position.x + width - foldSize, position.y);
    context.lineTo(position.x + width, position.y + foldSize);
    context.lineTo(position.x + width, position.y + height);
    context.lineTo(position.x, position.y + height);
    context.closePath();
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();

    context.fillStyle = "rgba(91, 74, 48, 0.1)";
    for (let y = position.y + 6; y < position.y + height - 5; y += 9) {
      context.fillRect(position.x + 4, y, width - 8, 0.45);
    }

    context.strokeStyle = "rgba(128, 47, 48, 0.46)";
    context.lineWidth = 0.65;
    context.beginPath();
    context.moveTo(position.x + 10.5, position.y + 7);
    context.lineTo(position.x + 10.5, position.y + height - 7);
    context.stroke();

    context.fillStyle = accent;
    context.fillRect(position.x + 5, position.y + 6, 3, height - 12);
    context.fillRect(position.x + 14, position.y + 7, width - 24, 2.5);

    context.fillStyle = "#433b2d";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = "700 4.6px ui-monospace, Consolas, monospace";
    context.fillText("待处理文件", position.x + 14, position.y + 13);
    context.font = "700 6.2px ui-monospace, Consolas, monospace";
    context.fillText(card.id || "FILE-—", position.x + 14, position.y + 20);

    context.strokeStyle = "rgba(70, 61, 45, 0.45)";
    context.beginPath();
    context.moveTo(position.x + 14, position.y + 29.5);
    context.lineTo(position.x + width - 7, position.y + 29.5);
    context.stroke();

    context.fillStyle = "#3e372b";
    context.font = "700 7px serif";
    this.drawWrappedText(
      context,
      title,
      position.x + 14,
      position.y + 35,
      width - 22,
      9,
      2,
    );

    context.fillStyle = "rgba(62, 55, 43, 0.76)";
    context.font = "500 4.7px sans-serif";
    this.drawWrappedText(
      context,
      summary,
      position.x + 14,
      position.y + 57,
      width - 22,
      6.5,
      4,
    );

    context.fillStyle = accent;
    context.fillRect(position.x + 14, position.y + height - 12, 16, 1.5);
    context.fillStyle = "#625744";
    context.font = "600 4.5px ui-monospace, Consolas, monospace";
    context.fillText(
      `敏感度 ${SENSITIVITY_LABELS[card.sensitivity]}`,
      position.x + 34,
      position.y + height - 14,
    );

    context.fillStyle = "#eee7d4";
    context.strokeStyle = "rgba(91, 78, 57, 0.48)";
    context.beginPath();
    context.moveTo(position.x + width - foldSize, position.y);
    context.lineTo(position.x + width - foldSize, position.y + foldSize);
    context.lineTo(position.x + width, position.y + foldSize);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  private getDataFileRotation(cardId: string, dragging: boolean): number {
    const hash = Array.from(cardId).reduce(
      (value, character) => value + character.charCodeAt(0),
      0,
    );
    const settledRotation = ((hash % 7) - 3) * 0.0048;
    return dragging ? settledRotation * 0.35 - 0.012 : settledRotation;
  }

  private drawNewspaper(
    context: CanvasRenderingContext2D,
    dragging: boolean,
  ): void {
    context.save();

    if (dragging) {
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 10;
      context.shadowOffsetY = 6;
    }

    this.drawAsset(context, "newspaper", this.getNewspaperImageRect());
    context.restore();
  }

  private drawAsset(
    context: CanvasRenderingContext2D,
    assetKey: DeskAssetKey,
    rect: Rect,
  ): void {
    const image = this.assets.get(assetKey);

    if (image) {
      context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
      return;
    }

    drawCanvasPlaceholder(
      context,
      rect,
      DESK_ASSET_PLACEHOLDER_LABELS[assetKey],
      {
        background: "rgba(51, 48, 42, 0.9)",
        border: "#9b8e72",
        foreground: "#d7c9aa",
      },
    );
  }

  private renderCameraIndicator(
    context: CanvasRenderingContext2D,
    elapsedTime: number,
  ): void {
    if (!this.isCameraLightOn(elapsedTime)) {
      return;
    }

    const { imageRect, indicator } = DESK_LAYOUT.camera;
    const x = imageRect.x + imageRect.width * indicator.sourceRatioX;
    const y = imageRect.y + imageRect.height * indicator.sourceRatioY;

    context.save();
    context.globalAlpha = indicator.glowStrength;
    context.shadowColor = indicator.color;
    context.shadowBlur = indicator.glowBlur;
    context.fillStyle = indicator.color;
    context.beginPath();
    context.arc(x, y, indicator.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 2;
    context.fillStyle = indicator.coreColor;
    context.beginPath();
    context.arc(x, y, indicator.radius * 0.42, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private renderNewsOverlay(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    const news = frame.visibleState.yesterdayNews ?? EMPTY_NEWS;
    const paper = DESK_LAYOUT.newsOverlay.panelRect;
    const close = DESK_LAYOUT.newsOverlay.closeRect;
    const title = news.title.trim() || EMPTY_NEWS.title;
    const summary = news.summary.trim() || EMPTY_NEWS.summary;
    const dateLabel = news.dateLabel.trim() || EMPTY_NEWS.dateLabel;

    context.save();
    const backdrop = context.createRadialGradient(195, 400, 80, 195, 400, 430);
    backdrop.addColorStop(0, "rgba(13, 13, 10, 0.68)");
    backdrop.addColorStop(1, "rgba(2, 3, 2, 0.9)");
    context.fillStyle = backdrop;
    context.fillRect(0, 0, DESK_DESIGN_SIZE.width, DESK_DESIGN_SIZE.height);

    context.shadowColor = "rgba(0, 0, 0, 0.7)";
    context.shadowBlur = 22;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 10;
    const paperGradient = context.createLinearGradient(
      paper.x,
      paper.y,
      paper.x + paper.width,
      paper.y + paper.height,
    );
    paperGradient.addColorStop(0, "#d8cda9");
    paperGradient.addColorStop(0.48, "#cfc29d");
    paperGradient.addColorStop(1, "#bcae88");
    context.fillStyle = paperGradient;
    context.strokeStyle = "#62563c";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(paper.x + 2, paper.y);
    context.lineTo(paper.x + paper.width - 3, paper.y + 1);
    context.lineTo(paper.x + paper.width, paper.y + paper.height - 4);
    context.lineTo(paper.x + 1, paper.y + paper.height);
    context.closePath();
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();

    context.save();
    context.beginPath();
    context.rect(paper.x + 1, paper.y + 1, paper.width - 2, paper.height - 2);
    context.clip();
    context.strokeStyle = "rgba(79, 67, 45, 0.09)";
    context.lineWidth = 0.45;
    for (let y = paper.y + 8; y < paper.y + paper.height; y += 7) {
      context.beginPath();
      context.moveTo(paper.x + 6, y);
      context.lineTo(paper.x + paper.width - 6, y + 0.6);
      context.stroke();
    }
    for (let x = paper.x + 9; x < paper.x + paper.width; x += 13) {
      context.fillStyle = "rgba(78, 64, 42, 0.055)";
      context.fillRect(x, paper.y + 5 + (x % 5), 0.7, paper.height - 11);
    }
    context.restore();

    context.fillStyle = "#534833";
    context.font = "600 7px ui-monospace, Consolas, monospace";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(dateLabel, paper.x + 18, paper.y + 17);
    context.textAlign = "right";
    context.fillText(
      `第 ${frame.visibleState.day} 日`,
      paper.x + paper.width - 48,
      paper.y + 17,
    );

    context.textAlign = "center";
    context.fillStyle = "#342e25";
    context.font = "900 25px Georgia, 'Times New Roman', serif";
    context.fillText("昨日晨报", paper.x + paper.width / 2, paper.y + 38);
    context.fillStyle = "#756746";
    context.font = "600 6px ui-monospace, Consolas, monospace";
    context.fillText(
      "THE YESTERDAY RECORD · INTERNAL EDITION",
      paper.x + paper.width / 2,
      paper.y + 68,
    );

    context.fillStyle = "#702d33";
    context.fillRect(paper.x + 17, paper.y + 82, paper.width - 34, 3.5);
    context.fillStyle = "#4a3f2d";
    context.textAlign = "left";
    context.font = "700 7px ui-monospace, Consolas, monospace";
    context.fillText("昨日新闻 · 头版", paper.x + 18, paper.y + 94);

    context.fillStyle = "#2f2a22";
    context.font = "900 23px Georgia, 'Times New Roman', serif";
    this.drawWrappedText(
      context,
      title,
      paper.x + 18,
      paper.y + 112,
      paper.width - 36,
      29,
      3,
    );

    context.strokeStyle = "rgba(70, 58, 39, 0.66)";
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(paper.x + 18, paper.y + 204.5);
    context.lineTo(paper.x + paper.width - 18, paper.y + 204.5);
    context.stroke();

    context.fillStyle = "#4b402f";
    context.font = "600 11px Georgia, 'Times New Roman', serif";
    this.drawWrappedText(
      context,
      summary,
      paper.x + 18,
      paper.y + 219,
      paper.width - 36,
      18,
      4,
    );

    const photoRect = {
      x: paper.x + 18,
      y: paper.y + 310,
      width: 190,
      height: 142,
    } satisfies Rect;
    this.drawNewspaperPhoto(context, photoRect);
    this.drawNewspaperColumn(
      context,
      paper.x + 222,
      paper.y + 310,
      96,
      142,
      0,
    );

    context.strokeStyle = "rgba(72, 60, 40, 0.52)";
    context.beginPath();
    context.moveTo(paper.x + 18, paper.y + 468.5);
    context.lineTo(paper.x + paper.width - 18, paper.y + 468.5);
    context.stroke();

    const columnWidth = 92;
    for (let index = 0; index < 3; index += 1) {
      const x = paper.x + 18 + index * 105;
      this.drawNewspaperColumn(
        context,
        x,
        paper.y + 486,
        columnWidth,
        186,
        index + 1,
      );
    }

    context.strokeStyle = "rgba(79, 66, 44, 0.25)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(paper.x + paper.width / 2, paper.y + 5);
    context.lineTo(paper.x + paper.width / 2 + 1.5, paper.y + paper.height - 6);
    context.stroke();

    context.fillStyle = "#665940";
    context.font = "500 6px ui-monospace, Consolas, monospace";
    context.textAlign = "center";
    context.fillText(
      "昨日归档 · 仅供内部传阅",
      paper.x + paper.width / 2,
      paper.y + paper.height - 26,
    );

    context.fillStyle = "rgba(54, 46, 33, 0.22)";
    context.strokeStyle = "rgba(65, 54, 37, 0.5)";
    context.lineWidth = 0.75;
    context.beginPath();
    context.arc(
      close.x + close.width / 2,
      close.y + close.height / 2,
      close.width / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();
    context.fillStyle = "rgba(55, 47, 34, 0.8)";
    context.font = "600 12px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("×", close.x + close.width / 2, close.y + close.height / 2);
    context.restore();
  }

  private drawNewspaperPhoto(
    context: CanvasRenderingContext2D,
    rect: Rect,
  ): void {
    context.save();
    context.fillStyle = "#877d66";
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    const sky = context.createLinearGradient(0, rect.y, 0, rect.y + rect.height);
    sky.addColorStop(0, "rgba(216, 208, 180, 0.52)");
    sky.addColorStop(1, "rgba(75, 70, 59, 0.22)");
    context.fillStyle = sky;
    context.fillRect(rect.x + 3, rect.y + 3, rect.width - 6, rect.height - 6);

    context.fillStyle = "rgba(52, 50, 43, 0.62)";
    context.beginPath();
    context.moveTo(rect.x + 3, rect.y + rect.height - 24);
    context.lineTo(rect.x + 28, rect.y + rect.height - 58);
    context.lineTo(rect.x + 56, rect.y + rect.height - 42);
    context.lineTo(rect.x + 84, rect.y + rect.height - 76);
    context.lineTo(rect.x + 117, rect.y + rect.height - 50);
    context.lineTo(rect.x + 151, rect.y + rect.height - 83);
    context.lineTo(rect.x + rect.width - 3, rect.y + rect.height - 44);
    context.lineTo(rect.x + rect.width - 3, rect.y + rect.height - 3);
    context.lineTo(rect.x + 3, rect.y + rect.height - 3);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(42, 40, 35, 0.6)";
    context.lineWidth = 1.2;
    for (let index = 0; index < 4; index += 1) {
      const x = rect.x + 34 + index * 38;
      context.beginPath();
      context.moveTo(x, rect.y + 28 + index * 5);
      context.lineTo(x - 3, rect.y + rect.height - 18);
      context.stroke();
    }

    context.fillStyle = "rgba(240, 231, 198, 0.2)";
    for (let y = rect.y + 4; y < rect.y + rect.height - 4; y += 4) {
      for (let x = rect.x + 4 + ((y / 4) % 2) * 2; x < rect.x + rect.width - 4; x += 6) {
        context.fillRect(x, y, 1, 1);
      }
    }
    context.strokeStyle = "#5e533d";
    context.lineWidth = 1;
    context.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
    context.restore();
  }

  private drawNewspaperColumn(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    variant: number,
  ): void {
    context.save();
    context.fillStyle = "#4c4231";
    context.font = "700 7px Georgia, 'Times New Roman', serif";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(variant % 2 === 0 ? "现场记录" : "后续观察", x, y);
    context.fillStyle = "rgba(69, 59, 43, 0.66)";
    const lineHeight = 7;
    const lineCount = Math.max(1, Math.floor((height - 17) / lineHeight));
    for (let index = 0; index < lineCount; index += 1) {
      const reduction = ((index * 17 + variant * 13) % 5) * 7;
      context.fillRect(
        x,
        y + 16 + index * lineHeight,
        Math.max(width * 0.52, width - reduction),
        1.2,
      );
    }
    context.restore();
  }

  private renderCardDetailOverlay(
    context: CanvasRenderingContext2D,
    frame: SceneFrame,
  ): void {
    const detail = this.getCardDetailContent(frame);

    if (!detail) {
      return;
    }

    const panel = DESK_LAYOUT.cardDetailOverlay.panelRect;
    const close = DESK_LAYOUT.cardDetailOverlay.closeRect;
    const card = frame.visibleState.rawCards.find(
      (item) => item.id === this.selectedCardId,
    );
    const accent =
      (card ? CARD_COLORS[card.sensitivity] : undefined) ?? "#7d7460";

    context.save();
    context.fillStyle = "rgba(4, 5, 4, 0.78)";
    context.fillRect(0, 0, DESK_DESIGN_SIZE.width, DESK_DESIGN_SIZE.height);
    context.shadowColor = "rgba(0, 0, 0, 0.62)";
    context.shadowBlur = 16;
    context.shadowOffsetY = 8;
    context.fillStyle = "#d4c8aa";
    context.strokeStyle = "#5e5238";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(panel.x, panel.y, panel.width, panel.height, 6);
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();

    context.fillStyle = accent;
    context.fillRect(panel.x + 22, panel.y + 28, panel.width - 44, 6);
    context.fillStyle = "#3f3829";
    context.font = "700 9px ui-monospace, Consolas, monospace";
    context.textBaseline = "top";
    context.fillText("DATA FILE · 完整记录", panel.x + 22, panel.y + 50);

    context.fillStyle = "rgba(235, 225, 196, 0.72)";
    context.fillRect(panel.x + 22, panel.y + 82, panel.width - 44, 392);

    context.fillStyle = "#74674c";
    context.font = "600 8px ui-monospace, Consolas, monospace";
    context.fillText("数据编号", panel.x + 38, panel.y + 108);
    context.fillText("标题", panel.x + 38, panel.y + 168);
    context.fillText("敏感级别", panel.x + 38, panel.y + 246);
    context.fillText("完整摘要", panel.x + 38, panel.y + 306);

    context.fillStyle = "#3f3829";
    context.font = "700 13px ui-monospace, Consolas, monospace";
    context.fillText(detail.id, panel.x + 38, panel.y + 128);
    context.font = "700 16px serif";
    this.drawWrappedText(
      context,
      detail.title,
      panel.x + 38,
      panel.y + 190,
      panel.width - 76,
      22,
      2,
    );
    context.font = "700 12px sans-serif";
    context.fillText(detail.sensitivity, panel.x + 38, panel.y + 266);
    context.font = "500 11px sans-serif";
    this.drawWrappedText(
      context,
      detail.summary,
      panel.x + 38,
      panel.y + 330,
      panel.width - 76,
      19,
      6,
    );

    context.fillStyle = "#74674c";
    context.font = "500 7px ui-monospace, Consolas, monospace";
    context.fillText(
      "来源：mock visibleState.rawCards",
      panel.x + 38,
      panel.y + 448,
    );

    context.fillStyle = "#423827";
    context.beginPath();
    context.arc(
      close.x + close.width / 2,
      close.y + close.height / 2,
      close.width / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = "#dfd0aa";
    context.font = "700 15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("×", close.x + close.width / 2, close.y + close.height / 2);
    context.restore();
  }

  private drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number,
  ): void {
    const lines: string[] = [];
    let current = "";

    for (const character of Array.from(text)) {
      const candidate = current + character;

      if (context.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = character;

        if (lines.length === maxLines) {
          break;
        }
      } else {
        current = candidate;
      }
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
    }

    lines.slice(0, maxLines).forEach((line, index) => {
      const isLast = index === maxLines - 1 && lines.length >= maxLines;
      context.fillText(isLast ? `${line.slice(0, -1)}…` : line, x, y + index * lineHeight);
    });
  }

  private getInteractiveItems(
    frame: SceneFrame,
  ): readonly InteractiveItem<DeskItemId>[] {
    const fixedItems: InteractiveItem<DeskItemId>[] = [
      {
        id: "monitor-screen",
        label: "显示器入口 · monitor-desktop",
        hitArea: { type: "rect", rect: DESK_LAYOUT.monitor.screenRect },
        clickable: true,
        draggable: false,
        zIndex: 10,
      },
      {
        id: "pending-file-stack",
        label: "待处理文件堆",
        hitArea: { type: "rect", rect: DESK_LAYOUT.pendingStack.hitRect },
        clickable: true,
        draggable: false,
        zIndex: 20,
      },
      {
        id: "operation-tray",
        label: "数据递交 / 处理托盘",
        hitArea: { type: "rect", rect: DESK_LAYOUT.operationTray.hitRect },
        clickable: true,
        draggable: false,
        acceptsDrop: true,
        zIndex: 20,
      },
      {
        id: "newspaper",
        label: "昨日新闻 · 点击放大 / 拖动摆放",
        hitArea: { type: "rect", rect: this.getNewspaperHitRect() },
        clickable: true,
        draggable: true,
        zIndex: 20,
      },
    ];

    const cardItems = frame.visibleState.rawCards.map(
      (card, index): InteractiveItem<DeskItemId> => {
        const position = this.cardPositions.get(card.id)?.current ??
          getCardOrigin(index);

        return {
          id: `data-card:${card.id}`,
          label: `数据文件 ${card.id}`,
          hitArea: {
            type: "rect",
            rect: {
              x: position.x,
              y: position.y,
              width: DESK_LAYOUT.cards.size.width,
              height: DESK_LAYOUT.cards.size.height,
            },
          },
          clickable: true,
          draggable: true,
          cardId: card.id,
          zIndex: 40 + index,
        };
      },
    );

    const closeItem: InteractiveItem<DeskItemId> = {
      id: this.newsOpen ? "news-close" : "card-detail-close",
      label: this.newsOpen ? "关闭报纸查看层" : "关闭数据文件查看层",
      hitArea: {
        type: "rect",
        rect: this.newsOpen
          ? DESK_LAYOUT.newsOverlay.closeHitRect
          : DESK_LAYOUT.cardDetailOverlay.closeHitRect,
      },
      clickable: true,
      draggable: false,
      zIndex: 100,
    };

    return this.newsOpen || this.selectedCardId
      ? [...fixedItems, ...cardItems, closeItem]
      : [...fixedItems, ...cardItems];
  }

  private prepareDrag(
    event: NormalizedPointerEvent,
    point: Point,
    item: InteractiveItem<DeskItemId> | null,
  ): void {
    if (!item?.draggable || item.hitArea.type !== "rect") {
      this.pendingDrag = null;
      return;
    }

    let target: DragTarget;
    let dragOrigin: Point;

    if (item.id === "newspaper") {
      target = { type: "newspaper", itemId: "newspaper" };
      dragOrigin = { ...this.newspaperPosition };
    } else if (item.cardId) {
      target = {
        type: "card",
        itemId: `data-card:${item.cardId}`,
        cardId: item.cardId,
      };
      dragOrigin = {
        x: item.hitArea.rect.x,
        y: item.hitArea.rect.y,
      };
    } else {
      this.pendingDrag = null;
      return;
    }

    this.pendingDrag = {
      pointerId: event.pointerId,
      target,
      grabOffset: {
        x: point.x - item.hitArea.rect.x,
        y: point.y - item.hitArea.rect.y,
      },
      dragOrigin,
    };
  }

  private startDrag(event: NormalizedPointerEvent, point: Point): void {
    if (!this.pendingDrag || this.pendingDrag.pointerId !== event.pointerId) {
      return;
    }

    this.activeDrag = { ...this.pendingDrag };
    this.options.onCursorChange?.("grabbing");
    this.updateDraggedItem(point);
  }

  private moveDrag(event: NormalizedPointerEvent, point: Point): void {
    if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) {
      return;
    }

    this.updateDraggedItem(point);
  }

  private finishDrag(
    event: NormalizedPointerEvent,
    point: Point,
    frame: SceneFrame,
  ): void {
    if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) {
      this.pendingDrag = null;
      return;
    }

    this.updateDraggedItem(point);

    if (this.activeDrag.target.type === "card") {
      this.finishCardDrag(
        this.activeDrag.target.cardId,
        point,
        frame,
      );
    }

    this.activeDrag = null;
    this.pendingDrag = null;
    this.options.onCursorChange?.("crosshair");
  }

  private finishCardDrag(
    cardId: string,
    point: Point,
    frame: SceneFrame,
  ): void {
    const cardPosition = this.cardPositions.get(cardId);
    const cardRect: Rect | null = cardPosition
      ? {
          x: cardPosition.current.x,
          y: cardPosition.current.y,
          width: DESK_LAYOUT.cards.size.width,
          height: DESK_LAYOUT.cards.size.height,
        }
      : null;
    const operationPad = DESK_LAYOUT.operationTray.hitRect;
    const droppedOnPad =
      containsPoint({ type: "rect", rect: operationPad }, point) ||
      (cardRect ? rectsIntersect(cardRect, operationPad) : false);

    if (droppedOnPad) {
      this.options.commandPort.submitCardToOperationPad(cardId);
      this.lastSubmissionCardId = cardId;
      this.feedback = {
        cardId,
        message: `已递交 ${cardId}`,
        expiresAt:
          frame.elapsedTime + DESK_LAYOUT.feedback.durationSeconds,
      };
    }

    this.resetCardPosition(cardId);
  }

  private updateDraggedItem(point: Point): void {
    if (!this.activeDrag) {
      return;
    }

    if (this.activeDrag.target.type === "newspaper") {
      const imageRect = DESK_LAYOUT.newspaper.imageRect;
      this.newspaperPosition = {
        x: Math.min(
          Math.max(0, point.x - this.activeDrag.grabOffset.x),
          DESK_DESIGN_SIZE.width - imageRect.width,
        ),
        y: Math.min(
          Math.max(0, point.y - this.activeDrag.grabOffset.y),
          DESK_DESIGN_SIZE.height - imageRect.height,
        ),
      };
      return;
    }

    const position = this.cardPositions.get(this.activeDrag.target.cardId);

    if (position) {
      position.current = {
        x: point.x - this.activeDrag.grabOffset.x,
        y: point.y - this.activeDrag.grabOffset.y,
      };
    }
  }

  private cancelDrag(): void {
    if (this.activeDrag?.target.type === "card") {
      this.resetCardPosition(this.activeDrag.target.cardId);
    } else if (this.activeDrag?.target.type === "newspaper") {
      this.newspaperPosition = { ...this.activeDrag.dragOrigin };
    }

    this.activeDrag = null;
    this.pendingDrag = null;
    this.options.onCursorChange?.("crosshair");
  }

  private resetCardPosition(cardId: string): void {
    const position = this.cardPositions.get(cardId);

    if (position) {
      position.current = { ...position.origin };
    }
  }

  private getActiveCardId(): string | null {
    return this.activeDrag?.target.type === "card"
      ? this.activeDrag.target.cardId
      : null;
  }

  private getNewspaperImageRect(): Rect {
    return {
      x: this.newspaperPosition.x,
      y: this.newspaperPosition.y,
      width: DESK_LAYOUT.newspaper.imageRect.width,
      height: DESK_LAYOUT.newspaper.imageRect.height,
    };
  }

  private getNewspaperHitRect(): Rect {
    const imageRect = DESK_LAYOUT.newspaper.imageRect;
    const hitRect = DESK_LAYOUT.newspaper.hitRect;

    return {
      x: this.newspaperPosition.x + hitRect.x - imageRect.x,
      y: this.newspaperPosition.y + hitRect.y - imageRect.y,
      width: hitRect.width,
      height: hitRect.height,
    };
  }

  private getCardDetailContent(frame: SceneFrame): CardDetailContent | null {
    if (this.selectedCardId === null) {
      return null;
    }

    const card = frame.visibleState.rawCards.find(
      (item) => item.id === this.selectedCardId,
    );
    const textOrPlaceholder = (
      value: string | null | undefined,
      placeholder: string,
    ): string => value?.trim() || placeholder;
    const sensitivityLabel = card
      ? SENSITIVITY_LABELS[card.sensitivity]
      : undefined;

    return {
      id: textOrPlaceholder(card?.id ?? this.selectedCardId, "未提供编号"),
      title: textOrPlaceholder(card?.title, "未提供标题"),
      summary: textOrPlaceholder(card?.summary, "未提供摘要"),
      sensitivity: sensitivityLabel
        ? `${sensitivityLabel}（${card?.sensitivity}）`
        : "未提供",
    };
  }

  private activateItem(
    item: InteractiveItem<DeskItemId> | null,
    frame: SceneFrame,
  ): void {
    if (!item?.clickable) {
      return;
    }

    if (item.id === "monitor-screen") {
      this.options.onEnterMonitorDesktop();
      return;
    }

    if (item.id === "newspaper") {
      this.newsOpen = true;
      this.hoveredItemId = null;
      this.options.onCursorChange?.("default");
      if (frame.visibleState.dailyFlow.phase === "news") {
        this.options.commandPort.advanceDailyPhase();
      }
      return;
    }

    if (item.id === "pending-file-stack") {
      this.feedback = {
        cardId: "",
        message: `待处理文件 ${frame.visibleState.rawCards.length} 份`,
        expiresAt:
          frame.elapsedTime + DESK_LAYOUT.feedback.durationSeconds,
      };
      return;
    }

    if (item.id === "operation-tray") {
      this.feedback = {
        cardId: frame.visibleState.operationPadCardId ?? "",
        message: frame.visibleState.operationPadCardId
          ? `托盘中：${frame.visibleState.operationPadCardId}`
          : "操作托盘当前为空",
        expiresAt:
          frame.elapsedTime + DESK_LAYOUT.feedback.durationSeconds,
      };
      return;
    }

    if (item.cardId) {
      this.selectedCardId = item.cardId;
      this.hoveredItemId = null;
      this.options.onCursorChange?.("default");
    }
  }

  private handleOverlayInput(
    event: NormalizedPointerEvent,
    point: Point,
  ): void {
    const cardDetailOpen = Boolean(this.selectedCardId);
    const closeArea = {
      type: "rect" as const,
      rect: cardDetailOpen
        ? DESK_LAYOUT.cardDetailOverlay.closeHitRect
        : DESK_LAYOUT.newsOverlay.closeHitRect,
    };
    const panelArea = {
      type: "rect" as const,
      rect: cardDetailOpen
        ? DESK_LAYOUT.cardDetailOverlay.panelRect
        : DESK_LAYOUT.newsOverlay.panelRect,
    };

    if (event.phase === "pointer-move") {
      const overClose = containsPoint(closeArea, point);
      this.hoveredItemId = overClose
        ? cardDetailOpen
          ? "card-detail-close"
          : "news-close"
        : null;
      this.options.onCursorChange?.(overClose ? "pointer" : "default");
      return;
    }

    if (
      event.phase === "click" &&
      (containsPoint(closeArea, point) || !containsPoint(panelArea, point))
    ) {
      this.closeOpenOverlay();
    }
  }

  private setHoveredItem(
    item: InteractiveItem<DeskItemId> | null,
  ): void {
    this.hoveredItemId = item?.id ?? null;
    this.options.onCursorChange?.(
      item?.draggable ? "grab" : item?.clickable ? "pointer" : "crosshair",
    );
  }

  private syncCardPositions(frame: SceneFrame): void {
    const cards = frame.visibleState.rawCards;
    const ids = new Set(cards.map((card) => card.id));

    for (const cardId of this.cardPositions.keys()) {
      if (!ids.has(cardId)) {
        this.cardPositions.delete(cardId);
      }
    }

    cards.forEach((card, index) => {
      const origin = getCardOrigin(index);
      const current = this.cardPositions.get(card.id);

      if (!current) {
        this.cardPositions.set(card.id, {
          origin,
          current: { ...origin },
        });
      } else {
        current.origin = origin;

        if (this.getActiveCardId() !== card.id) {
          current.current = { ...origin };
        }
      }
    });
  }

  private isCameraLightOn(elapsedTime: number): boolean {
    return (
      Math.floor(
        elapsedTime / DESK_LAYOUT.camera.indicator.toggleSeconds,
      ) % 2 ===
      0
    );
  }
}
