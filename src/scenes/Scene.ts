import type {
  InputSnapshot,
  NormalizedPointerEvent,
  RenderLayer,
  SceneId,
  ViewportSnapshot,
} from "../core/types";
import type { ProgramBGameState } from "../game/ProgramBBridge";

export interface SceneFrame {
  readonly deltaTime: number;
  readonly elapsedTime: number;
  readonly frameNumber: number;
  readonly viewport: ViewportSnapshot;
  readonly input: InputSnapshot;
  readonly gameState: Readonly<ProgramBGameState>;
}

export interface Scene {
  readonly id: SceneId;
  readonly title: string;
  enter(frame: SceneFrame): void;
  exit(frame: SceneFrame): void;
  update(frame: SceneFrame): void;
  handleInput?(event: NormalizedPointerEvent, frame: SceneFrame): void;
  renderLayer(
    context: CanvasRenderingContext2D,
    layer: RenderLayer,
    frame: SceneFrame,
  ): void;
  destroy?(): void;
}
