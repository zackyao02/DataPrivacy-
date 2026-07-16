import type { ProgramAEventMap } from "../core/events";
import { TypedEventBus } from "../core/TypedEventBus";
import type { RenderLayer, SceneId } from "../core/types";
import { ProgramBBridge } from "../game/ProgramBBridge";
import type { Scene, SceneFrame } from "./Scene";

export class SceneManager {
  private readonly scenes = new Map<SceneId, Scene>();
  private currentScene: Scene;
  private started = false;

  constructor(
    scenes: readonly Scene[],
    initialScene: SceneId,
    private readonly events: TypedEventBus<ProgramAEventMap>,
    private readonly programB: ProgramBBridge,
  ) {
    scenes.forEach((scene) => this.scenes.set(scene.id, scene));

    const initial = this.scenes.get(initialScene);

    if (!initial) {
      throw new Error(`未注册初始场景：${initialScene}`);
    }

    this.currentScene = initial;
  }

  get currentId(): SceneId {
    return this.currentScene.id;
  }

  start(frame: SceneFrame): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.currentScene.enter(frame);
  }

  switchTo(sceneId: SceneId, frame: SceneFrame): boolean {
    if (sceneId === this.currentScene.id) {
      return false;
    }

    const nextScene = this.scenes.get(sceneId);

    if (!nextScene) {
      throw new Error(`未注册场景：${sceneId}`);
    }

    const previousScene = this.currentScene;
    previousScene.exit(frame);
    this.currentScene = nextScene;
    this.currentScene.enter(frame);

    this.programB.patchState({
      previousScene: previousScene.id,
      currentScene: nextScene.id,
    });
    this.events.emit("scene:changed", {
      previousScene: previousScene.id,
      currentScene: nextScene.id,
    });

    return true;
  }

  update(frame: SceneFrame): void {
    this.currentScene.update(frame);
  }

  renderLayer(
    context: CanvasRenderingContext2D,
    layer: RenderLayer,
    frame: SceneFrame,
  ): void {
    this.currentScene.renderLayer(context, layer, frame);
  }

  destroy(frame: SceneFrame): void {
    if (this.started) {
      this.currentScene.exit(frame);
      this.started = false;
    }

    this.scenes.clear();
  }
}

