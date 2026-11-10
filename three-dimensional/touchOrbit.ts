import { panOrbit, rotateOrbit, zoomOrbit, type OrbitCamera } from './orbit';

export type TouchPoint = {
  x: number;
  y: number;
};

export type TouchMemory = {
  points: TouchPoint[];
  distance: number | null;
};

export function createTouchMemory(): TouchMemory {
  return { points: [], distance: null };
}

export function resetTouchMemory(memory: TouchMemory): void {
  memory.points = [];
  memory.distance = null;
}

export function applyTouchSample(
  camera: OrbitCamera,
  memory: TouchMemory,
  points: readonly TouchPoint[],
  shift: boolean,
): void {
  const active = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).slice(0, 2);
  if (active.length === 0) {
    resetTouchMemory(memory);
    return;
  }

  if (active.length === 1) {
    const previous = memory.points.length === 1 ? memory.points[0] : null;
    if (previous) {
      const deltaX = active[0].x - previous.x;
      const deltaY = active[0].y - previous.y;
      if (shift) {
        panOrbit(camera, deltaX, deltaY);
      } else {
        rotateOrbit(camera, deltaX, deltaY);
      }
    }
    memory.points = [active[0]];
    memory.distance = null;
    return;
  }

  const nextDistance = Math.hypot(active[0].x - active[1].x, active[0].y - active[1].y);
  const nextMid = { x: (active[0].x + active[1].x) / 2, y: (active[0].y + active[1].y) / 2 };
  if (memory.points.length >= 2 && memory.distance && memory.distance > 0 && nextDistance > 0) {
    const previousMid = {
      x: (memory.points[0].x + memory.points[1].x) / 2,
      y: (memory.points[0].y + memory.points[1].y) / 2,
    };
    zoomOrbit(camera, memory.distance / nextDistance);
    panOrbit(camera, nextMid.x - previousMid.x, nextMid.y - previousMid.y);
  }
  memory.points = [active[0], active[1]];
  memory.distance = nextDistance;
}
