import {
  SCENE_IDS,
  SCENE_LABELS,
  type Point,
  type RenderLayer,
  type SceneId,
} from "../core/types";
import type { Scene, SceneFrame } from "./Scene";

interface ScenePalette {
  readonly background: string;
  readonly grid: string;
  readonly panel: string;
  readonly screen: string;
  readonly accent: string;
  readonly warning: string;
  readonly text: string;
}

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface SceneLayout {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
  readonly device: Rect;
  readonly screen: Rect;
}

const PALETTES: Record<SceneId, ScenePalette> = {
  "monitor-room": {
    background: "#0b1118",
    grid: "#17232c",
    panel: "#29353c",
    screen: "#122a2d",
    accent: "#77b8ad",
    warning: "#dca75e",
    text: "#d7e2dc",
  },
  workbench: {
    background: "#15120e",
    grid: "#292219",
    panel: "#514536",
    screen: "#27291e",
    accent: "#bcc07b",
    warning: "#d98d58",
    text: "#e3dcc8",
  },
  "buyer-exchange": {
    background: "#101018",
    grid: "#222136",
    panel: "#37354d",
    screen: "#1c1b32",
    accent: "#9694d8",
    warning: "#d4a15b",
    text: "#deddf0",
  },
  "risk-panel": {
    background: "#170d0e",
    grid: "#32191c",
    panel: "#4b292d",
    screen: "#291315",
    accent: "#d4756e",
    warning: "#f0b15e",
    text: "#ead8d5",
  },
  news: {
    background: "#111313",
    grid: "#272b29",
    panel: "#4a4b44",
    screen: "#252721",
    accent: "#b8ba9a",
    warning: "#d59b60",
    text: "#e3e1d4",
  },
  "mini-game": {
    background: "#0d1513",
    grid: "#18302a",
    panel: "#284a40",
    screen: "#102f2a",
    accent: "#62c7a6",
    warning: "#e0bd62",
    text: "#d8eee6",
  },
  ending: {
    background: "#121114",
    grid: "#27232b",
    panel: "#403946",
    screen: "#211d25",
    accent: "#b0a0bc",
    warning: "#d3a066",
    text: "#e7dfea",
  },
};

export class PlaceholderScene implements Scene {
  readonly title: string;

  private readonly palette: ScenePalette;

  constructor(readonly id: SceneId) {
    this.title = SCENE_LABELS[id];
    this.palette = PALETTES[id];
  }

  enter(_frame: SceneFrame): void {}

  exit(_frame: SceneFrame): void {}

  update(_frame: SceneFrame): void {}

  renderLayer(
    context: CanvasRenderingContext2D,
    layer: RenderLayer,
    frame: SceneFrame,
  ): void {
    const layout = this.createLayout(frame);

    switch (layer) {
      case "background":
        this.renderBackground(context, layout);
        break;
      case "devices":
        this.renderDevices(context, layout);
        break;
      case "cards":
        this.renderCards(context, layout);
        break;
      case "ui":
        this.renderUi(context, layout, frame);
        break;
      case "effects":
        this.renderEffects(context, layout, frame);
        break;
    }
  }

  private createLayout(frame: SceneFrame): SceneLayout {
    const width = frame.viewport.logicalWidth;
    const height = frame.viewport.logicalHeight;
    const margin = Math.max(14, Math.min(width, height) * 0.045);
    const headerHeight = 58;
    const footerHeight = 54;

    let device: Rect;

    if (frame.viewport.orientation === "portrait") {
      const deviceHeight = Math.min(360, height * 0.46);
      device = {
        x: margin,
        y: headerHeight + margin,
        width: width - margin * 2,
        height: deviceHeight,
      };
    } else {
      const deviceHeight = Math.max(
        190,
        height - headerHeight - footerHeight - margin * 2,
      );
      const deviceWidth = Math.min(width * 0.66, deviceHeight * 1.75);
      device = {
        x: (width - deviceWidth) / 2,
        y: headerHeight + margin,
        width: deviceWidth,
        height: deviceHeight,
      };
    }

    const bezel = Math.max(12, Math.min(device.width, device.height) * 0.05);
    const screen: Rect = {
      x: device.x + bezel,
      y: device.y + bezel,
      width: device.width - bezel * 2,
      height: device.height - bezel * 2.4,
    };

    return { width, height, margin, device, screen };
  }

  private renderBackground(
    context: CanvasRenderingContext2D,
    layout: SceneLayout,
  ): void {
    context.fillStyle = this.palette.background;
    context.fillRect(0, 0, layout.width, layout.height);

    context.strokeStyle = this.palette.grid;
    context.lineWidth = 1;
    context.globalAlpha = 0.7;

    const gridSize = 24;

    for (let x = 0; x <= layout.width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, layout.height);
      context.stroke();
    }

    for (let y = 0; y <= layout.height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(layout.width, y);
      context.stroke();
    }

    context.globalAlpha = 1;
  }

  private renderDevices(
    context: CanvasRenderingContext2D,
    layout: SceneLayout,
  ): void {
    const { device, screen } = layout;

    context.fillStyle = "#050708";
    this.fillRoundedRect(context, device.x + 5, device.y + 7, device.width, device.height, 12);

    context.fillStyle = this.palette.panel;
    this.fillRoundedRect(context, device.x, device.y, device.width, device.height, 12);

    context.fillStyle = this.palette.screen;
    this.fillRoundedRect(context, screen.x, screen.y, screen.width, screen.height, 5);

    const controlY = device.y + device.height - 12;
    context.fillStyle = this.palette.accent;
    context.fillRect(device.x + 18, controlY, 24, 4);
    context.fillStyle = this.palette.warning;
    context.beginPath();
    context.arc(device.x + device.width - 22, controlY + 1, 4, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = this.palette.panel;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(device.x + device.width * 0.46, device.y + device.height);
    context.lineTo(device.x + device.width * 0.44, device.y + device.height + 22);
    context.moveTo(device.x + device.width * 0.54, device.y + device.height);
    context.lineTo(device.x + device.width * 0.56, device.y + device.height + 22);
    context.stroke();

    context.fillStyle = this.palette.panel;
    context.fillRect(
      device.x + device.width * 0.34,
      device.y + device.height + 20,
      device.width * 0.32,
      7,
    );
  }

  private renderCards(
    context: CanvasRenderingContext2D,
    layout: SceneLayout,
  ): void {
    const { screen } = layout;
    const gap = 8;
    const cardWidth = (screen.width - gap * 4) / 3;
    const cardHeight = Math.max(72, screen.height * 0.55);
    const cardY = screen.y + (screen.height - cardHeight) / 2;

    context.font = "600 10px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.textBaseline = "top";

    for (let index = 0; index < 3; index += 1) {
      const cardX = screen.x + gap + index * (cardWidth + gap);

      context.fillStyle = "rgba(230, 238, 232, 0.09)";
      this.fillRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 4);

      context.fillStyle = index === 1
        ? this.palette.warning
        : this.palette.accent;
      context.fillRect(cardX + 8, cardY + 9, Math.max(18, cardWidth - 16), 5);

      context.fillStyle = this.palette.text;
      context.fillText(`CARD ${index + 1}`, cardX + 8, cardY + 23);

      context.globalAlpha = 0.35;
      context.fillRect(cardX + 8, cardY + 40, cardWidth * 0.58, 3);
      context.fillRect(cardX + 8, cardY + 49, cardWidth * 0.72, 3);
      context.fillRect(cardX + 8, cardY + 58, cardWidth * 0.44, 3);
      context.globalAlpha = 1;
    }
  }

  private renderUi(
    context: CanvasRenderingContext2D,
    layout: SceneLayout,
    frame: SceneFrame,
  ): void {
    const sceneIndex = SCENE_IDS.indexOf(this.id) + 1;

    context.fillStyle = "rgba(4, 7, 9, 0.82)";
    context.fillRect(0, 0, layout.width, 58);
    context.fillRect(0, layout.height - 52, layout.width, 52);

    context.fillStyle = this.palette.text;
    context.textBaseline = "middle";
    context.font = "700 16px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.fillText(this.title.toUpperCase(), layout.margin, 24);

    context.fillStyle = this.palette.accent;
    context.font = "600 10px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.fillText(
      `SCENE ${sceneIndex}/${SCENE_IDS.length} · ${this.id}`,
      layout.margin,
      43,
    );

    context.fillStyle = this.palette.text;
    context.globalAlpha = 0.72;
    context.font = "500 10px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.fillText(
      `VIEW ${frame.viewport.orientation.toUpperCase()} · ${Math.round(
        frame.viewport.logicalWidth,
      )}×${Math.round(frame.viewport.logicalHeight)}`,
      layout.margin,
      layout.height - 33,
    );
    context.fillText(
      "POINTER: 点击或拖拽画布进行输入测试",
      layout.margin,
      layout.height - 17,
    );
    context.globalAlpha = 1;
  }

  private renderEffects(
    context: CanvasRenderingContext2D,
    layout: SceneLayout,
    frame: SceneFrame,
  ): void {
    const { screen } = layout;

    context.strokeStyle = "rgba(220, 240, 230, 0.055)";
    context.lineWidth = 1;

    for (let y = screen.y + 2; y < screen.y + screen.height; y += 5) {
      context.beginPath();
      context.moveTo(screen.x, y);
      context.lineTo(screen.x + screen.width, y);
      context.stroke();
    }

    const pulse = 0.45 + Math.sin(frame.elapsedTime * 3) * 0.2;
    context.fillStyle = this.palette.accent;
    context.globalAlpha = pulse;
    context.beginPath();
    context.arc(
      screen.x + screen.width - 14,
      screen.y + 14,
      4,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.globalAlpha = 1;

    const trail = frame.input.dragTrail;

    if (trail.length > 1) {
      context.strokeStyle = this.palette.warning;
      context.lineWidth = 2;
      context.globalAlpha = 0.75;
      context.beginPath();
      context.moveTo(trail[0].x, trail[0].y);

      for (const point of trail.slice(1)) {
        context.lineTo(point.x, point.y);
      }

      context.stroke();
      context.globalAlpha = 1;
    }

    const pointer = frame.input.lastEvent?.position;

    if (pointer) {
      this.renderPointerMarker(context, pointer);
    }
  }

  private renderPointerMarker(
    context: CanvasRenderingContext2D,
    pointer: Point,
  ): void {
    context.strokeStyle = this.palette.warning;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(pointer.x, pointer.y, 8, 0, Math.PI * 2);
    context.moveTo(pointer.x - 12, pointer.y);
    context.lineTo(pointer.x + 12, pointer.y);
    context.moveTo(pointer.x, pointer.y - 12);
    context.lineTo(pointer.x, pointer.y + 12);
    context.stroke();
  }

  private fillRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }
}

