import { CanvasSurface } from "../core/CanvasSurface";
import {
  RENDER_LAYERS,
  type RenderLayer,
} from "../core/types";
import { SceneManager } from "../scenes/SceneManager";
import type { SceneFrame } from "../scenes/Scene";

export class LayerRenderer {
  private readonly visibility = Object.fromEntries(
    RENDER_LAYERS.map((layer) => [layer, true]),
  ) as Record<RenderLayer, boolean>;

  constructor(
    private readonly surface: CanvasSurface,
    private readonly sceneManager: SceneManager,
  ) {}

  render(frame: SceneFrame): void {
    this.surface.beginFrame();

    for (const layer of RENDER_LAYERS) {
      if (!this.visibility[layer]) {
        continue;
      }

      this.surface.context.save();
      this.sceneManager.renderLayer(this.surface.context, layer, frame);
      this.surface.context.restore();
    }
  }

  setVisible(layer: RenderLayer, visible: boolean): void {
    this.visibility[layer] = visible;
  }

  isVisible(layer: RenderLayer): boolean {
    return this.visibility[layer];
  }

  getVisibility(): Readonly<Record<RenderLayer, boolean>> {
    return { ...this.visibility };
  }
}

