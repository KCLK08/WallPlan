import { panBy, zoomAt, type Camera2D } from './scale';

const TAP_SLOP_PX = 12;

export type GesturePoint = { x: number; y: number };

export type GestureMemory = {
  origin: GesturePoint | null;
  points: GesturePoint[];
  distance: number | null;
  moved: boolean;
};

export function createGestureMemory(): GestureMemory {
  return { origin: null, points: [], distance: null, moved: false };
}

export function resetGestureMemory(memory: GestureMemory): void {
  memory.origin = null;
  memory.points = [];
  memory.distance = null;
  memory.moved = false;
}

export function consumeTap(memory: GestureMemory): GesturePoint | null {
  const tap = !memory.moved && memory.origin && memory.points.length === 1 ? memory.origin : null;
  resetGestureMemory(memory);
  return tap;
}

export function applyDrawingGesture(
  camera: Camera2D,
  memory: GestureMemory,
  points: readonly GesturePoint[],
  limits: { minPxPerMm: number; maxPxPerMm: number },
): Camera2D {
  const active = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).slice(0, 2);
  if (active.length === 0) {
    resetGestureMemory(memory);
    return camera;
  }
  if (active.length === 1) {
    if (!memory.origin) {
      memory.origin = active[0];
    }
    const previous = memory.points.length === 1 ? memory.points[0] : null;
    const travel = Math.hypot(active[0].x - memory.origin.x, active[0].y - memory.origin.y);
    let next = camera;
    if (previous && travel >= TAP_SLOP_PX) {
      memory.moved = true;
      next = panBy(camera, active[0].x - previous.x, active[0].y - previous.y);
    }
    memory.points = [active[0]];
    memory.distance = null;
    return next;
  }
  memory.moved = true;
  const nextDistance = Math.hypot(active[0].x - active[1].x, active[0].y - active[1].y);
  const nextMid = { x: (active[0].x + active[1].x) / 2, y: (active[0].y + active[1].y) / 2 };
  let next = camera;
  if (memory.points.length >= 2 && memory.distance && memory.distance > 0 && nextDistance > 0) {
    const previousMid = {
      x: (memory.points[0].x + memory.points[1].x) / 2,
      y: (memory.points[0].y + memory.points[1].y) / 2,
    };
    next = zoomAt(camera, nextDistance / memory.distance, nextMid.x, nextMid.y, limits.minPxPerMm, limits.maxPxPerMm);
    next = panBy(next, nextMid.x - previousMid.x, nextMid.y - previousMid.y);
  }
  memory.points = [active[0], active[1]];
  memory.distance = nextDistance;
  return next;
}
