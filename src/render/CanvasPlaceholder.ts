import type { Rect } from "../scenes/desk/InteractiveItem";

export interface CanvasPlaceholderOptions {
  readonly background?: string;
  readonly border?: string;
  readonly foreground?: string;
}

export function drawCanvasPlaceholder(
  context: CanvasRenderingContext2D,
  rect: Rect,
  label: string,
  options: CanvasPlaceholderOptions = {},
): void {
  const background = options.background ?? "#29343a";
  const border = options.border ?? "#87949a";
  const foreground = options.foreground ?? "#d6ded8";

  context.save();
  context.fillStyle = background;
  context.strokeStyle = border;
  context.lineWidth = 1;
  context.setLineDash([4, 3]);
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeRect(
    rect.x + 0.5,
    rect.y + 0.5,
    Math.max(0, rect.width - 1),
    Math.max(0, rect.height - 1),
  );
  context.setLineDash([]);
  context.fillStyle = foreground;
  context.font = "600 7px ui-monospace, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    Math.max(0, rect.width - 8),
  );
  context.restore();
}
