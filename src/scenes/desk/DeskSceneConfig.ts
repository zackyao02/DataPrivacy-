import type { Point, ViewportSnapshot } from "../../core/types";
import type { Rect } from "./InteractiveItem";

export const DESK_DESIGN_SIZE = Object.freeze({
  width: 390,
  height: 844,
});

// These are the only player-facing monitor routes. Legacy Day1 SceneIds stay
// in the scene registry and must not be added as desktop shortcuts.
export const MONITOR_APP_IDS = [
  "data-processing",
  "buyer-trade",
  "risk-record",
] as const;

export type MonitorAppId = (typeof MONITOR_APP_IDS)[number];

export interface DesignTransform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export const DESK_LAYOUT = Object.freeze({
  camera: {
    imageRect: { x: 166, y: -2, width: 58, height: 77 } satisfies Rect,
    indicator: {
      sourceRatioX: 718 / 1086,
      sourceRatioY: 562 / 1448,
      radius: 2.1,
      glowBlur: 9,
      glowStrength: 0.9,
      toggleSeconds: 2,
      color: "#ff3b30",
      coreColor: "#ffd0ca",
    },
  },
  monitor: {
    imageRect: { x: 40, y: 122, width: 310, height: 551 } satisfies Rect,
    screenRect: { x: 95, y: 306, width: 200, height: 153 } satisfies Rect,
  },
  pendingStack: {
    imageRect: { x: -21, y: 535, width: 140, height: 116 } satisfies Rect,
    hitRect: { x: 0, y: 539, width: 106, height: 108 } satisfies Rect,
  },
  cards: {
    origin: { x: 18, y: 531 },
    size: { width: 72, height: 102 },
    stackOffset: { x: 2.5, y: 3 },
  },
  operationTray: {
    imageRect: { x: 284, y: 518, width: 120, height: 108 } satisfies Rect,
    hitRect: { x: 298, y: 522, width: 88, height: 100 } satisfies Rect,
  },
  newspaper: {
    imageRect: { x: 10, y: 657, width: 183, height: 137.25 } satisfies Rect,
    hitRect: { x: 22, y: 662, width: 159, height: 125 } satisfies Rect,
  },
  newsOverlay: {
    panelRect: { x: 27, y: 54, width: 336, height: 736 } satisfies Rect,
    closeRect: { x: 332, y: 64, width: 20, height: 20 } satisfies Rect,
    closeHitRect: { x: 320, y: 52, width: 44, height: 44 } satisfies Rect,
  },
  cardDetailOverlay: {
    panelRect: { x: 28, y: 138, width: 334, height: 520 } satisfies Rect,
    closeRect: { x: 328, y: 150, width: 22, height: 22 } satisfies Rect,
    closeHitRect: { x: 317, y: 139, width: 44, height: 44 } satisfies Rect,
  },
  feedback: {
    rect: { x: 215, y: 632, width: 158, height: 42 } satisfies Rect,
    durationSeconds: 2.6,
  },
});

export const MONITOR_DESKTOP_LAYOUT = Object.freeze({
  taskbar: { x: 0, y: 800, width: 390, height: 44 } satisfies Rect,
  returnButton: { x: 278, y: 800, width: 102, height: 44 } satisfies Rect,
  returnButtonVisual: { x: 286, y: 808, width: 86, height: 28 } satisfies Rect,
  appCloseButton: { x: 323, y: 59, width: 44, height: 44 } satisfies Rect,
  appCloseButtonVisual: { x: 330, y: 66, width: 30, height: 30 } satisfies Rect,
  appWindow: { x: 16, y: 54, width: 358, height: 722 } satisfies Rect,
  shortcuts: [
    {
      id: "data-processing",
      label: "数据处理",
      iconRect: { x: 34, y: 42, width: 64, height: 64 } satisfies Rect,
      hitRect: { x: 20, y: 26, width: 112, height: 112 } satisfies Rect,
      accent: "#7ba4a6",
    },
    {
      id: "buyer-trade",
      label: "买家交易",
      iconRect: { x: 34, y: 172, width: 64, height: 64 } satisfies Rect,
      hitRect: { x: 20, y: 156, width: 112, height: 112 } satisfies Rect,
      accent: "#c6a56f",
    },
    {
      id: "risk-record",
      label: "风险记录",
      iconRect: { x: 34, y: 302, width: 64, height: 64 } satisfies Rect,
      hitRect: { x: 20, y: 286, width: 112, height: 112 } satisfies Rect,
      accent: "#a16d6b",
    },
  ] as const,
});

export const MONITOR_APP_LAYOUT = Object.freeze({
  dataProcessing: {
    rawCardRects: Array.from({ length: 6 }, (_, index) => ({
      x: 34 + (index % 2) * 165,
      y: 148 + Math.floor(index / 2) * 46,
      width: 157,
      height: 38,
    })) as readonly Rect[],
    slotRects: Array.from({ length: 3 }, (_, index) => ({
      x: 34 + index * 109,
      y: 340,
      width: 104,
      height: 76,
    })) as readonly Rect[],
    createButton: { x: 115, y: 450, width: 160, height: 30 } satisfies Rect,
    recipeChoicePanel: { x: 42, y: 330, width: 306, height: 232 } satisfies Rect,
    recipeChoiceRects: Array.from({ length: 3 }, (_, index) => ({
      x: 58,
      y: 392 + index * 50,
      width: 274,
      height: 42,
    })) as readonly Rect[],
  },
  buyerTrade: {
    packageRects: Array.from({ length: 4 }, (_, index) => ({
      x: 34 + (index % 2) * 165,
      y: 148 + Math.floor(index / 2) * 78,
      width: 157,
      height: 68,
    })) as readonly Rect[],
    buyerRects: Array.from({ length: 3 }, (_, index) => ({
      x: 34 + index * 109,
      y: 358,
      width: 104,
      height: 94,
    })) as readonly Rect[],
    submitButton: { x: 115, y: 582, width: 160, height: 38 } satisfies Rect,
  },
});

export function getDeskTransform(
  viewport: ViewportSnapshot,
): DesignTransform {
  const scale = Math.min(
    viewport.logicalWidth / DESK_DESIGN_SIZE.width,
    viewport.logicalHeight / DESK_DESIGN_SIZE.height,
  );

  return {
    scale,
    offsetX: (viewport.logicalWidth - DESK_DESIGN_SIZE.width * scale) / 2,
    offsetY: (viewport.logicalHeight - DESK_DESIGN_SIZE.height * scale) / 2,
  };
}

export function toDeskPoint(
  logicalPoint: Point,
  transform: DesignTransform,
): Point {
  return {
    x: (logicalPoint.x - transform.offsetX) / transform.scale,
    y: (logicalPoint.y - transform.offsetY) / transform.scale,
  };
}

export function getCardOrigin(index: number): Point {
  return {
    x: DESK_LAYOUT.cards.origin.x + DESK_LAYOUT.cards.stackOffset.x * index,
    y: DESK_LAYOUT.cards.origin.y + DESK_LAYOUT.cards.stackOffset.y * index,
  };
}
