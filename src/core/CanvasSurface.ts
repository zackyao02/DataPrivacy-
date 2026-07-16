import type { Point, ViewportSnapshot } from "./types";

const REFERENCE_SHORT_SIDE = 390;

export class CanvasSurface {
  readonly context: CanvasRenderingContext2D;

  private viewport: ViewportSnapshot = {
    cssWidth: 1,
    cssHeight: 1,
    pixelWidth: 1,
    pixelHeight: 1,
    logicalWidth: REFERENCE_SHORT_SIDE,
    logicalHeight: REFERENCE_SHORT_SIDE,
    scale: 1 / REFERENCE_SHORT_SIDE,
    devicePixelRatio: 1,
    orientation: "portrait",
  };

  private resizeObserver: ResizeObserver | null = null;
  private resizeListener: (() => void) | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!context) {
      throw new Error("无法创建 CanvasRenderingContext2D。");
    }

    this.context = context;
    this.context.imageSmoothingEnabled = false;
  }

  get snapshot(): ViewportSnapshot {
    return this.viewport;
  }

  resize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio));
    const pixelHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio));
    const orientation = cssHeight >= cssWidth ? "portrait" : "landscape";
    const scale =
      orientation === "portrait"
        ? cssWidth / REFERENCE_SHORT_SIDE
        : cssHeight / REFERENCE_SHORT_SIDE;
    const logicalWidth = cssWidth / scale;
    const logicalHeight = cssHeight / scale;

    const nextViewport: ViewportSnapshot = {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      logicalWidth,
      logicalHeight,
      scale,
      devicePixelRatio,
      orientation,
    };

    const changed =
      pixelWidth !== this.viewport.pixelWidth ||
      pixelHeight !== this.viewport.pixelHeight ||
      Math.abs(cssWidth - this.viewport.cssWidth) > 0.01 ||
      Math.abs(cssHeight - this.viewport.cssHeight) > 0.01 ||
      devicePixelRatio !== this.viewport.devicePixelRatio;

    this.viewport = nextViewport;

    if (this.canvas.width !== pixelWidth) {
      this.canvas.width = pixelWidth;
    }

    if (this.canvas.height !== pixelHeight) {
      this.canvas.height = pixelHeight;
    }

    this.context.imageSmoothingEnabled = false;
    return changed;
  }

  observe(onResize: (viewport: ViewportSnapshot) => void): void {
    this.stopObserving();

    const handleResize = () => {
      if (this.resize()) {
        onResize(this.viewport);
      }
    };

    this.resizeListener = handleResize;
    this.resizeObserver = new ResizeObserver(handleResize);
    this.resizeObserver.observe(this.canvas);
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
  }

  beginFrame(): void {
    const {
      pixelWidth,
      pixelHeight,
      devicePixelRatio,
      scale,
    } = this.viewport;

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, pixelWidth, pixelHeight);
    this.context.setTransform(
      devicePixelRatio * scale,
      0,
      0,
      devicePixelRatio * scale,
      0,
      0,
    );
    this.context.imageSmoothingEnabled = false;
  }

  toLogicalPoint(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = ((clientX - rect.left) / Math.max(1, rect.width)) *
      this.viewport.cssWidth;
    const cssY = ((clientY - rect.top) / Math.max(1, rect.height)) *
      this.viewport.cssHeight;

    return {
      x: cssX / this.viewport.scale,
      y: cssY / this.viewport.scale,
    };
  }

  destroy(): void {
    this.stopObserving();
  }

  private stopObserving(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
      window.visualViewport?.removeEventListener(
        "resize",
        this.resizeListener,
      );
      this.resizeListener = null;
    }
  }
}

