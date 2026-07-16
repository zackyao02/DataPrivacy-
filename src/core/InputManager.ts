import { CanvasSurface } from "./CanvasSurface";
import type {
  InputPhase,
  InputSnapshot,
  NormalizedPointerEvent,
  Point,
} from "./types";

interface PointerTrack {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;
  readonly start: Point;
  last: Point;
  dragging: boolean;
}

const DRAG_THRESHOLD = 5;
const MAX_TRAIL_POINTS = 24;

export class InputManager {
  private readonly activePointers = new Map<number, PointerTrack>();
  private lastEvent: NormalizedPointerEvent | null = null;
  private dragTrail: Point[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly surface: CanvasSurface,
    private readonly onInput: (event: NormalizedPointerEvent) => void,
  ) {
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerCancel);
    canvas.addEventListener("lostpointercapture", this.handleLostPointerCapture);
    canvas.addEventListener("contextmenu", this.handleContextMenu);
  }

  getSnapshot(): InputSnapshot {
    const primaryPointer =
      [...this.activePointers.values()].find((pointer) => pointer.isPrimary) ??
      null;

    return {
      activePointerCount: this.activePointers.size,
      primaryPointerId: primaryPointer?.pointerId ?? null,
      lastEvent: this.lastEvent,
      dragTrail: this.dragTrail.map((point) => ({ ...point })),
    };
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerCancel);
    this.canvas.removeEventListener(
      "lostpointercapture",
      this.handleLostPointerCapture,
    );
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    this.activePointers.clear();
    this.dragTrail = [];
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    event.preventDefault();

    const position = this.surface.toLogicalPoint(event.clientX, event.clientY);
    const track: PointerTrack = {
      pointerId: event.pointerId,
      pointerType: event.pointerType || "mouse",
      isPrimary: event.isPrimary,
      start: position,
      last: position,
      dragging: false,
    };

    this.activePointers.set(event.pointerId, track);

    if (event.isPrimary) {
      this.dragTrail = [position];
    }

    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be unavailable for synthetic events.
    }

    this.emit("pointer-down", event, track, position);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    event.preventDefault();

    const position = this.surface.toLogicalPoint(event.clientX, event.clientY);
    const track = this.activePointers.get(event.pointerId);

    if (!track) {
      this.emitWithoutTrack("pointer-move", event, position);
      return;
    }

    const totalDelta = {
      x: position.x - track.start.x,
      y: position.y - track.start.y,
    };
    const distance = Math.hypot(totalDelta.x, totalDelta.y);

    if (!track.dragging && distance >= DRAG_THRESHOLD) {
      track.dragging = true;
      this.emit("drag-start", event, track, position);
    }

    this.emit(track.dragging ? "drag-move" : "pointer-move", event, track, position);

    if (track.isPrimary) {
      this.dragTrail.push(position);

      if (this.dragTrail.length > MAX_TRAIL_POINTS) {
        this.dragTrail.shift();
      }
    }

    track.last = position;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.finishPointer(event, false);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.finishPointer(event, true);
  };

  private readonly handleLostPointerCapture = (event: PointerEvent): void => {
    if (this.activePointers.has(event.pointerId)) {
      this.finishPointer(event, true);
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private finishPointer(event: PointerEvent, cancelled: boolean): void {
    event.preventDefault();

    const track = this.activePointers.get(event.pointerId);

    if (!track) {
      return;
    }

    const position = this.surface.toLogicalPoint(event.clientX, event.clientY);
    this.emit(cancelled ? "pointer-cancel" : "pointer-up", event, track, position);

    if (track.dragging) {
      this.emit("drag-end", event, track, position);
    } else if (!cancelled) {
      this.emit("click", event, track, position);
    }

    this.activePointers.delete(event.pointerId);

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  }

  private emit(
    phase: InputPhase,
    event: PointerEvent,
    track: PointerTrack,
    position: Point,
  ): void {
    const normalizedEvent: NormalizedPointerEvent = {
      phase,
      pointerId: event.pointerId,
      pointerType: track.pointerType,
      isPrimary: track.isPrimary,
      button: event.button,
      buttons: event.buttons,
      pressure: event.pressure,
      position,
      delta: {
        x: position.x - track.last.x,
        y: position.y - track.last.y,
      },
      totalDelta: {
        x: position.x - track.start.x,
        y: position.y - track.start.y,
      },
      timestamp: performance.now(),
    };

    this.lastEvent = normalizedEvent;
    this.onInput(normalizedEvent);
  }

  private emitWithoutTrack(
    phase: InputPhase,
    event: PointerEvent,
    position: Point,
  ): void {
    const previousPosition =
      this.lastEvent?.pointerId === event.pointerId
        ? this.lastEvent.position
        : position;
    const normalizedEvent: NormalizedPointerEvent = {
      phase,
      pointerId: event.pointerId,
      pointerType: event.pointerType || "mouse",
      isPrimary: event.isPrimary,
      button: event.button,
      buttons: event.buttons,
      pressure: event.pressure,
      position,
      delta: {
        x: position.x - previousPosition.x,
        y: position.y - previousPosition.y,
      },
      totalDelta: { x: 0, y: 0 },
      timestamp: performance.now(),
    };

    this.lastEvent = normalizedEvent;
    this.onInput(normalizedEvent);
  }
}

