import type { Point } from "../core/types";
import type { Rect } from "../scenes/desk/InteractiveItem";

export interface CRTEffectConfig {
  readonly crtEnabled: boolean;
  readonly scanlineOpacity: number;
  readonly dotMatrixOpacity: number;
  readonly chromaticOffset: number;
  readonly glowStrength: number;
  readonly jitterStrength: number;
  readonly flickerStrength: number;
  readonly vignetteStrength: number;
}

export const CRT_EFFECT_CONFIG: Readonly<CRTEffectConfig> = Object.freeze({
  crtEnabled: true,
  scanlineOpacity: 0.11,
  dotMatrixOpacity: 0.032,
  chromaticOffset: 0.56,
  glowStrength: 0.13,
  jitterStrength: 0.5,
  flickerStrength: 0.006,
  vignetteStrength: 0.38,
});

export const REALITY_DESK_CRT_CONFIG: Readonly<CRTEffectConfig> =
  Object.freeze({
    ...CRT_EFFECT_CONFIG,
    scanlineOpacity: 0.09,
    dotMatrixOpacity: 0.024,
    chromaticOffset: 0.34,
    glowStrength: 0.1,
    jitterStrength: 0.36,
    flickerStrength: 0.0025,
    vignetteStrength: 0.3,
  });

export const MONITOR_DESKTOP_CRT_CONFIG: Readonly<CRTEffectConfig> =
  Object.freeze({
    ...CRT_EFFECT_CONFIG,
    scanlineOpacity: 0.115,
    dotMatrixOpacity: 0.036,
    chromaticOffset: 0.62,
    glowStrength: 0.15,
    jitterStrength: 0.52,
    flickerStrength: 0.0045,
    vignetteStrength: 0.38,
  });

interface DrawCRTEffectOptions {
  readonly config?: Readonly<CRTEffectConfig>;
  readonly cornerRadius?: number;
  readonly intensity?: number;
  readonly signalDrift?: boolean;
}

const SCANLINE_SPACING = 4;
const DOT_MATRIX_SPACING = 4;
const NOISE_TILE_SIZE = 48;
const scanlineTile = createScanlineTile();
const dotMatrixTile = createDotMatrixTile();
const noiseTile = createNoiseTile();
let chromaticScratch: HTMLCanvasElement | null = null;

export function getCRTJitter(
  elapsedTime: number,
  config: Readonly<CRTEffectConfig> = CRT_EFFECT_CONFIG,
  multiplier = 1,
): Point {
  if (!config.crtEnabled) {
    return { x: 0, y: 0 };
  }

  const strength = config.jitterStrength * multiplier;
  const horizontalFlutter =
    Math.sin(elapsedTime * 31.7) * 0.34 +
    Math.sin(elapsedTime * 13.1) * 0.2;
  const signalKick =
    Math.pow(Math.max(0, Math.sin(elapsedTime * 1.73)), 18) *
    Math.sin(elapsedTime * 67.3) *
    0.42;

  return {
    x: (horizontalFlutter + signalKick) * strength,
    y: Math.sin(elapsedTime * 7.9) * strength * 0.11,
  };
}

export function drawCRTEffect(
  context: CanvasRenderingContext2D,
  rect: Rect,
  elapsedTime: number,
  options: DrawCRTEffectOptions = {},
): void {
  const config = options.config ?? CRT_EFFECT_CONFIG;

  if (!config.crtEnabled) {
    return;
  }

  const intensity = Math.max(0, options.intensity ?? 1);
  const cornerRadius = Math.max(0, options.cornerRadius ?? 12);

  context.save();
  context.beginPath();
  context.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
  context.clip();

  drawChromaticGhost(context, rect, intensity, config);
  drawScanlines(context, rect, elapsedTime, intensity, config);
  drawDotMatrix(context, rect, intensity, config);
  drawFlickerNoise(context, rect, elapsedTime, intensity, config);

  if (options.signalDrift !== false) {
    drawSignalDrift(context, rect, elapsedTime, intensity, config);
  }

  drawGlassGlow(context, rect, intensity, config);
  drawVignette(context, rect, intensity, config);
  context.restore();

  drawCurvedScreenEdge(context, rect, cornerRadius, intensity, config);
}

function createScanlineTile(): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = 2;
  tile.height = SCANLINE_SPACING;
  const tileContext = tile.getContext("2d");

  if (tileContext) {
    tileContext.fillStyle = "#030707";
    tileContext.fillRect(0, SCANLINE_SPACING - 1, tile.width, 1);
  }

  return tile;
}

function createDotMatrixTile(): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = DOT_MATRIX_SPACING;
  tile.height = DOT_MATRIX_SPACING;
  const tileContext = tile.getContext("2d");

  if (tileContext) {
    tileContext.fillStyle = "#020506";
    tileContext.fillRect(0, 0, 1, 1);
  }

  return tile;
}

function createNoiseTile(): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = NOISE_TILE_SIZE;
  tile.height = NOISE_TILE_SIZE;
  const tileContext = tile.getContext("2d");

  if (!tileContext) {
    return tile;
  }

  let seed = 0x4d595df4;
  for (let index = 0; index < 120; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = seed % NOISE_TILE_SIZE;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const y = seed % NOISE_TILE_SIZE;
    tileContext.fillStyle =
      index % 3 === 0 ? "#d8eeeb" : "#020707";
    tileContext.fillRect(x, y, index % 5 === 0 ? 3 : 1, 1);
  }

  return tile;
}

function drawScanlines(
  context: CanvasRenderingContext2D,
  rect: Rect,
  elapsedTime: number,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  const pattern = context.createPattern(scanlineTile, "repeat");

  if (!pattern) {
    return;
  }

  const phase = (elapsedTime * 6) % SCANLINE_SPACING;
  context.save();
  context.translate(0, phase);
  context.globalAlpha = Math.min(0.24, config.scanlineOpacity * intensity);
  context.fillStyle = pattern;
  context.fillRect(
    rect.x,
    rect.y - phase,
    rect.width,
    rect.height + SCANLINE_SPACING,
  );
  context.restore();
}

function drawDotMatrix(
  context: CanvasRenderingContext2D,
  rect: Rect,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  const pattern = context.createPattern(dotMatrixTile, "repeat");

  if (!pattern) {
    return;
  }

  context.save();
  context.globalAlpha = Math.min(0.12, config.dotMatrixOpacity * intensity);
  context.fillStyle = pattern;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

function drawFlickerNoise(
  context: CanvasRenderingContext2D,
  rect: Rect,
  elapsedTime: number,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  if (config.flickerStrength <= 0) {
    return;
  }

  const pattern = context.createPattern(noiseTile, "repeat");

  if (!pattern) {
    return;
  }

  const offsetX = (elapsedTime * 17) % NOISE_TILE_SIZE;
  const offsetY = (elapsedTime * 23) % NOISE_TILE_SIZE;
  context.save();
  context.translate(offsetX, offsetY);
  context.globalAlpha = Math.min(
    0.018,
    config.flickerStrength * intensity,
  );
  context.fillStyle = pattern;
  context.fillRect(
    rect.x - offsetX,
    rect.y - offsetY,
    rect.width + NOISE_TILE_SIZE,
    rect.height + NOISE_TILE_SIZE,
  );
  context.restore();
}

function drawChromaticGhost(
  context: CanvasRenderingContext2D,
  rect: Rect,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  const scratch = captureCanvasRegion(context, rect);

  if (!scratch) {
    return;
  }

  const offset = config.chromaticOffset;
  const opacity = Math.min(
    0.038,
    (0.012 + config.chromaticOffset * 0.024) * intensity,
  );

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = opacity;
  context.filter = "grayscale(1) sepia(1) saturate(7) hue-rotate(315deg)";
  context.drawImage(
    scratch,
    rect.x - offset,
    rect.y,
    rect.width,
    rect.height,
  );
  context.filter = "grayscale(1) sepia(1) saturate(7) hue-rotate(135deg)";
  context.drawImage(
    scratch,
    rect.x + offset,
    rect.y,
    rect.width,
    rect.height,
  );
  context.restore();
}

function captureCanvasRegion(
  context: CanvasRenderingContext2D,
  rect: Rect,
): HTMLCanvasElement | null {
  const transform = context.getTransform();
  const left = rect.x * transform.a + rect.y * transform.c + transform.e;
  const top = rect.x * transform.b + rect.y * transform.d + transform.f;
  const right =
    (rect.x + rect.width) * transform.a +
    (rect.y + rect.height) * transform.c +
    transform.e;
  const bottom =
    (rect.x + rect.width) * transform.b +
    (rect.y + rect.height) * transform.d +
    transform.f;
  const sourceX = Math.max(0, Math.floor(Math.min(left, right)));
  const sourceY = Math.max(0, Math.floor(Math.min(top, bottom)));
  const sourceWidth = Math.min(
    context.canvas.width - sourceX,
    Math.max(1, Math.ceil(Math.abs(right - left))),
  );
  const sourceHeight = Math.min(
    context.canvas.height - sourceY,
    Math.max(1, Math.ceil(Math.abs(bottom - top))),
  );

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return null;
  }

  const targetWidth = Math.max(1, Math.round(rect.width));
  const targetHeight = Math.max(1, Math.round(rect.height));

  if (!chromaticScratch) {
    chromaticScratch = document.createElement("canvas");
  }

  if (
    chromaticScratch.width !== targetWidth ||
    chromaticScratch.height !== targetHeight
  ) {
    chromaticScratch.width = targetWidth;
    chromaticScratch.height = targetHeight;
  }

  const scratchContext = chromaticScratch.getContext("2d");

  if (!scratchContext) {
    return null;
  }

  scratchContext.setTransform(1, 0, 0, 1, 0, 0);
  scratchContext.clearRect(0, 0, targetWidth, targetHeight);
  scratchContext.imageSmoothingEnabled = false;
  scratchContext.drawImage(
    context.canvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return chromaticScratch;
}

function drawSignalDrift(
  context: CanvasRenderingContext2D,
  rect: Rect,
  elapsedTime: number,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  if (config.flickerStrength <= 0) {
    return;
  }

  const bandHeight = Math.max(6, rect.height * 0.025);
  const travel = rect.height + bandHeight * 2;
  const y = rect.y - bandHeight + ((elapsedTime * 14) % travel);
  const gradient = context.createLinearGradient(0, y, 0, y + bandHeight);
  const opacity = Math.min(
    0.018,
    config.flickerStrength * intensity * 1.6,
  );
  gradient.addColorStop(0, "rgba(178, 229, 230, 0)");
  gradient.addColorStop(0.42, `rgba(178, 229, 230, ${opacity})`);
  gradient.addColorStop(0.58, `rgba(10, 24, 30, ${opacity * 0.55})`);
  gradient.addColorStop(1, "rgba(10, 24, 30, 0)");
  context.fillStyle = gradient;
  context.fillRect(rect.x, y, rect.width, bandHeight);
}

function drawGlassGlow(
  context: CanvasRenderingContext2D,
  rect: Rect,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  const glow = config.glowStrength * intensity;
  const gradient = context.createRadialGradient(
    rect.x + rect.width * 0.46,
    rect.y + rect.height * 0.42,
    0,
    rect.x + rect.width * 0.5,
    rect.y + rect.height * 0.5,
    Math.max(rect.width, rect.height) * 0.68,
  );
  gradient.addColorStop(0, `rgba(175, 226, 222, ${glow * 0.22})`);
  gradient.addColorStop(0.58, `rgba(102, 174, 183, ${glow * 0.08})`);
  gradient.addColorStop(1, "rgba(24, 48, 54, 0)");
  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = gradient;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

function drawVignette(
  context: CanvasRenderingContext2D,
  rect: Rect,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  const strength = Math.min(0.68, config.vignetteStrength * intensity);
  const radius = Math.hypot(rect.width, rect.height) * 0.56;
  const gradient = context.createRadialGradient(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    Math.min(rect.width, rect.height) * 0.16,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    radius,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.56, "rgba(0, 0, 0, 0.015)");
  gradient.addColorStop(0.82, `rgba(0, 0, 0, ${strength * 0.32})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  context.fillStyle = gradient;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function drawCurvedScreenEdge(
  context: CanvasRenderingContext2D,
  rect: Rect,
  cornerRadius: number,
  intensity: number,
  config: Readonly<CRTEffectConfig>,
): void {
  context.save();
  context.shadowColor = `rgba(105, 202, 205, ${
    config.glowStrength * intensity
  })`;
  context.shadowBlur = 8 * intensity;
  context.strokeStyle = `rgba(160, 218, 213, ${0.1 * intensity})`;
  context.lineWidth = 1.25;
  context.beginPath();
  context.roundRect(
    rect.x + 1.25,
    rect.y + 1.25,
    Math.max(0, rect.width - 2.5),
    Math.max(0, rect.height - 2.5),
    Math.max(0, cornerRadius - 1),
  );
  context.stroke();
  context.shadowColor = "transparent";
  context.strokeStyle = `rgba(0, 0, 0, ${0.36 * intensity})`;
  context.lineWidth = 2.5;
  context.beginPath();
  context.roundRect(
    rect.x + 0.75,
    rect.y + 0.75,
    Math.max(0, rect.width - 1.5),
    Math.max(0, rect.height - 1.5),
    Math.max(0, cornerRadius - 0.5),
  );
  context.stroke();
  context.restore();
}
