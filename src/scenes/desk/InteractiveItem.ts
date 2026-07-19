import type { Point } from "../../core/types";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export type HitArea =
  | { readonly type: "rect"; readonly rect: Rect }
  | { readonly type: "circle"; readonly circle: Circle };

export interface InteractiveItem<ItemId extends string = string> {
  readonly id: ItemId;
  readonly label: string;
  readonly hitArea: HitArea;
  readonly clickable: boolean;
  readonly draggable: boolean;
  readonly acceptsDrop?: boolean;
  readonly zIndex: number;
  readonly cardId?: string;
}

export function containsPoint(hitArea: HitArea, point: Point): boolean {
  if (hitArea.type === "circle") {
    return (
      Math.hypot(
        point.x - hitArea.circle.x,
        point.y - hitArea.circle.y,
      ) <= hitArea.circle.radius
    );
  }

  const { rect } = hitArea;
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function hitTestInteractiveItems<ItemId extends string>(
  items: readonly InteractiveItem<ItemId>[],
  point: Point,
): InteractiveItem<ItemId> | null {
  return (
    [...items]
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((item) => containsPoint(item.hitArea, point)) ?? null
  );
}

export function rectsIntersect(left: Rect, right: Rect): boolean {
  return !(
    left.x + left.width < right.x ||
    left.x > right.x + right.width ||
    left.y + left.height < right.y ||
    left.y > right.y + right.height
  );
}

export function drawHitAreaDebug(
  context: CanvasRenderingContext2D,
  item: InteractiveItem,
  highlighted: boolean,
): void {
  const color = item.draggable
    ? "#f4b860"
    : item.acceptsDrop
      ? "#76d48f"
      : "#63c7e6";

  context.save();
  context.strokeStyle = color;
  context.fillStyle = highlighted ? `${color}33` : `${color}14`;
  context.lineWidth = highlighted ? 2 : 1;
  context.setLineDash(item.draggable ? [4, 3] : [2, 2]);

  if (item.hitArea.type === "rect") {
    const { rect } = item.hitArea;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.setLineDash([]);
    context.fillStyle = color;
    context.font = "600 6px ui-monospace, Consolas, monospace";
    context.textBaseline = "top";
    context.fillText(item.label, rect.x + 2, rect.y + 2);
  } else {
    const { circle } = item.hitArea;
    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  context.restore();
}

