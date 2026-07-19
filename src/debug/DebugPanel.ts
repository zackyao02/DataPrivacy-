import {
  DAY1_PLACEHOLDER_SCENE_IDS,
  RENDER_LAYERS,
  SCENE_IDS,
  SCENE_LABELS,
  type AppLifecycleState,
  type InputSnapshot,
  type RenderLayer,
  type SceneId,
  type ViewportSnapshot,
} from "../core/types";

export interface DebugMetrics {
  readonly lifecycle: AppLifecycleState;
  readonly scene: SceneId;
  readonly deltaTime: number;
  readonly frameNumber: number;
  readonly viewport: ViewportSnapshot;
  readonly input: InputSnapshot;
  readonly interaction: {
    readonly view: string;
    readonly currentApp?: string | null;
    readonly hitAreasVisible: boolean;
    readonly hoveredItemId: string | null;
    readonly pressedItemId?: string | null;
    readonly draggingItemId?: string | null;
    readonly draggingCardId?: string | null;
    readonly highlightedSlotIndex?: number | null;
    readonly disabledRawCardIds?: readonly string[];
    readonly selectedRawCardId?: string | null;
    readonly selectedPackageId?: string | null;
    readonly selectedBuyerId?: string | null;
    readonly slotCardIds?: readonly (string | null)[];
    readonly newsOpen?: boolean;
    readonly cardDetailOpen?: boolean;
    readonly cameraLightOn?: boolean;
    readonly assets?: {
      readonly loaded: number;
      readonly failed: number;
      readonly total: number;
    };
  };
}

interface DebugPanelCallbacks {
  onSceneChange(sceneId: SceneId): void;
  onLayerChange(layer: RenderLayer, visible: boolean): void;
  onDeskHitAreasChange(visible: boolean): void;
  onPause(): void;
  onResume(): void;
  onDestroy(): void;
}

export class DebugPanel {
  private readonly sceneSelect: HTMLSelectElement;
  private readonly lifecycleButton: HTMLButtonElement;
  private readonly hitAreasCheckbox: HTMLInputElement;
  private readonly metricsElement: HTMLElement;
  private readonly inputElement: HTMLElement;
  private lifecycle: AppLifecycleState = "running";
  private lastMetricsUpdate = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: DebugPanelCallbacks,
  ) {
    root.innerHTML = `
      <details class="debug-panel" open>
        <summary>Program A Debug</summary>
        <div class="debug-content">
          <label class="debug-field">
            <span>Scene</span>
            <select data-debug="scene"></select>
          </label>
          <fieldset class="debug-layers">
            <legend>Render layers</legend>
            <div data-debug="layers"></div>
            <label class="debug-check debug-hit-areas">
              <input type="checkbox" data-debug="hit-areas" />
              <span>desk hit areas</span>
            </label>
          </fieldset>
          <div class="debug-actions">
            <button type="button" data-debug="lifecycle">Pause</button>
            <button type="button" data-debug="destroy">Destroy</button>
          </div>
          <pre data-debug="metrics"></pre>
          <pre data-debug="input"></pre>
          <p class="debug-hint">快捷键：1–2 主线场景，3–8 Day1 占位调试，H 热区，Esc 返回，空格暂停/恢复。</p>
        </div>
      </details>
    `;

    this.sceneSelect = this.requireElement<HTMLSelectElement>(
      '[data-debug="scene"]',
    );
    this.lifecycleButton = this.requireElement<HTMLButtonElement>(
      '[data-debug="lifecycle"]',
    );
    this.hitAreasCheckbox = this.requireElement<HTMLInputElement>(
      '[data-debug="hit-areas"]',
    );
    this.metricsElement = this.requireElement<HTMLElement>(
      '[data-debug="metrics"]',
    );
    this.inputElement = this.requireElement<HTMLElement>(
      '[data-debug="input"]',
    );

    this.populateScenes();
    this.populateLayers();

    this.sceneSelect.addEventListener("change", this.handleSceneChange);
    this.lifecycleButton.addEventListener("click", this.handleLifecycleClick);
    this.hitAreasCheckbox.addEventListener(
      "change",
      this.handleHitAreasChange,
    );
    this.requireElement<HTMLButtonElement>('[data-debug="destroy"]').addEventListener(
      "click",
      this.callbacks.onDestroy,
    );
  }

  setScene(sceneId: SceneId): void {
    this.sceneSelect.value = sceneId;
  }

  setLifecycle(lifecycle: AppLifecycleState): void {
    this.lifecycle = lifecycle;
    this.lifecycleButton.disabled = lifecycle === "destroyed";
    this.lifecycleButton.textContent =
      lifecycle === "running" ? "Pause" : "Resume";
  }

  setHitAreasVisible(visible: boolean): void {
    this.hitAreasCheckbox.checked = visible;
  }

  update(metrics: DebugMetrics): void {
    const now = performance.now();

    if (now - this.lastMetricsUpdate < 120 && metrics.deltaTime > 0) {
      return;
    }

    this.lastMetricsUpdate = now;
    this.setLifecycle(metrics.lifecycle);
    this.setScene(metrics.scene);

    const fps =
      metrics.deltaTime > 0 ? Math.round(1 / metrics.deltaTime) : "—";
    const viewport = metrics.viewport;

    this.metricsElement.textContent = [
      `state: ${metrics.lifecycle}`,
      `frame: ${metrics.frameNumber}`,
      `fps: ${fps}`,
      `css: ${Math.round(viewport.cssWidth)}×${Math.round(viewport.cssHeight)}`,
      `pixels: ${viewport.pixelWidth}×${viewport.pixelHeight}`,
      `dpr: ${viewport.devicePixelRatio.toFixed(2)}`,
      `logical: ${Math.round(viewport.logicalWidth)}×${Math.round(
        viewport.logicalHeight,
      )}`,
      `orientation: ${viewport.orientation}`,
    ].join("\n");

    const input = metrics.input.lastEvent;
    const inputLines = input
      ? [
          `lastEvent: ${input.phase}`,
          `pointerId: ${input.pointerId}`,
          `type: ${input.pointerType}`,
          `position: ${input.position.x.toFixed(1)}, ${input.position.y.toFixed(
            1,
          )}`,
          `drag: ${input.totalDelta.x.toFixed(1)}, ${input.totalDelta.y.toFixed(
            1,
          )}`,
        ]
      : ["lastEvent: waiting"];
    const interaction = metrics.interaction;

    this.setHitAreasVisible(interaction.hitAreasVisible);
    this.inputElement.textContent = [
      ...inputLines,
      "",
      `currentView: ${interaction.view}`,
      `currentApp: ${interaction.currentApp ?? "—"}`,
      `hover: ${interaction.hoveredItemId ?? "—"}`,
      `pressed: ${interaction.pressedItemId ?? "—"}`,
      `dragging: ${interaction.draggingItemId ?? interaction.draggingCardId ?? "—"}`,
      `highlight slot: ${interaction.highlightedSlotIndex ?? "—"}`,
      `disabled raw: ${interaction.disabledRawCardIds?.join(" | ") || "—"}`,
      `selected raw: ${interaction.selectedRawCardId ?? "—"}`,
      `selected package: ${interaction.selectedPackageId ?? "—"}`,
      `selected buyer: ${interaction.selectedBuyerId ?? "—"}`,
      `slots: ${interaction.slotCardIds?.map((cardId) => cardId ?? "—").join(" | ") ?? "—"}`,
      `card detail: ${interaction.cardDetailOpen ? "open" : "closed"}`,
      `news: ${interaction.newsOpen ? "open" : "closed"}`,
      `camera: ${
        interaction.cameraLightOn === undefined
          ? "—"
          : interaction.cameraLightOn
            ? "on"
            : "off"
      }`,
      `assets: ${
        interaction.assets
          ? `${interaction.assets.loaded}/${interaction.assets.total} · failed ${interaction.assets.failed}`
          : "—"
      }`,
    ].join("\n");
  }

  destroy(): void {
    this.sceneSelect.removeEventListener("change", this.handleSceneChange);
    this.lifecycleButton.removeEventListener(
      "click",
      this.handleLifecycleClick,
    );
    this.hitAreasCheckbox.removeEventListener(
      "change",
      this.handleHitAreasChange,
    );
    this.root.replaceChildren();
  }

  private populateScenes(): void {
    const day1PlaceholderScenes = new Set<SceneId>(
      DAY1_PLACEHOLDER_SCENE_IDS,
    );

    SCENE_IDS.forEach((sceneId) => {
      const option = document.createElement("option");
      option.value = sceneId;
      option.textContent = `${SCENE_IDS.indexOf(sceneId) + 1}. ${
        SCENE_LABELS[sceneId]
      } · ${
        day1PlaceholderScenes.has(sceneId)
          ? "Day1 debug only"
          : "player flow"
      }`;
      this.sceneSelect.append(option);
    });
  }

  private populateLayers(): void {
    const layersRoot = this.requireElement<HTMLElement>('[data-debug="layers"]');

    RENDER_LAYERS.forEach((layer) => {
      const label = document.createElement("label");
      label.className = "debug-check";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.addEventListener("change", () => {
        this.callbacks.onLayerChange(layer, checkbox.checked);
      });

      const text = document.createElement("span");
      text.textContent = layer;
      label.append(checkbox, text);
      layersRoot.append(label);
    });
  }

  private readonly handleSceneChange = (): void => {
    this.callbacks.onSceneChange(this.sceneSelect.value as SceneId);
  };

  private readonly handleLifecycleClick = (): void => {
    if (this.lifecycle === "running") {
      this.callbacks.onPause();
    } else if (this.lifecycle === "paused") {
      this.callbacks.onResume();
    }
  };

  private readonly handleHitAreasChange = (): void => {
    this.callbacks.onDeskHitAreasChange(this.hitAreasCheckbox.checked);
  };

  private requireElement<ElementType extends Element>(
    selector: string,
  ): ElementType {
    const element = this.root.querySelector<ElementType>(selector);

    if (!element) {
      throw new Error(`Debug panel 缺少元素：${selector}`);
    }

    return element;
  }
}
