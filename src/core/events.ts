import type {
  AppLifecycleState,
  NormalizedPointerEvent,
  SceneId,
  ViewportSnapshot,
} from "./types";

export interface ProgramAEventMap {
  "scene:changed": {
    readonly previousScene: SceneId | null;
    readonly currentScene: SceneId;
  };
  "viewport:changed": ViewportSnapshot;
  "input:event": NormalizedPointerEvent;
  "lifecycle:changed": {
    readonly state: AppLifecycleState;
  };
}

