export const PLAYER_SCENE_IDS = [
  "monitor-room",
  "monitor-desktop",
] as const;

export type PlayerSceneId = (typeof PLAYER_SCENE_IDS)[number];

export const DAY1_PLACEHOLDER_SCENE_IDS = [
  "workbench",
  "buyer-exchange",
  "risk-panel",
  "news",
  "mini-game",
  "ending",
] as const;

export type Day1PlaceholderSceneId =
  (typeof DAY1_PLACEHOLDER_SCENE_IDS)[number];

// Keep every Day1 placeholder registered for state-machine/debug coverage.
// Player-facing navigation must use PLAYER_SCENE_IDS instead.
export const SCENE_IDS = [
  ...PLAYER_SCENE_IDS,
  ...DAY1_PLACEHOLDER_SCENE_IDS,
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export const SCENE_LABELS: Record<SceneId, string> = {
  "monitor-room": "Monitor Room",
  "monitor-desktop": "Monitor Desktop",
  workbench: "Workbench",
  "buyer-exchange": "Buyer Exchange",
  "risk-panel": "Risk Panel",
  news: "News",
  "mini-game": "Mini Game",
  ending: "Ending",
};

export const RENDER_LAYERS = [
  "background",
  "devices",
  "cards",
  "ui",
  "effects",
] as const;

export type RenderLayer = (typeof RENDER_LAYERS)[number];

export type AppLifecycleState = "running" | "paused" | "destroyed";
export type ViewportOrientation = "portrait" | "landscape";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ViewportSnapshot {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly scale: number;
  readonly devicePixelRatio: number;
  readonly orientation: ViewportOrientation;
}

export type InputPhase =
  | "pointer-down"
  | "pointer-move"
  | "pointer-up"
  | "pointer-cancel"
  | "click"
  | "drag-start"
  | "drag-move"
  | "drag-end";

export interface NormalizedPointerEvent {
  readonly phase: InputPhase;
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;
  readonly button: number;
  readonly buttons: number;
  readonly pressure: number;
  readonly position: Point;
  readonly delta: Point;
  readonly totalDelta: Point;
  readonly timestamp: number;
}

export interface InputSnapshot {
  readonly activePointerCount: number;
  readonly primaryPointerId: number | null;
  readonly lastEvent: NormalizedPointerEvent | null;
  readonly dragTrail: readonly Point[];
}
