import { panOrbit, rotateOrbit, zoomOrbit, type OrbitCamera } from './orbit';

export type TouchPoint = {
  x: number;
  y: number;
};

const TAP_SLOP_PX = 12;

export type TouchMemory = {
  points: TouchPoint[];
  distance: number | null;
  origin: TouchPoint | null;
  moved: boolean;
};

export function createTouchMemory(): TouchMemory {
  return { points: [], distance: null, origin: null, moved: false };
}

export function resetTouchMemory(memory: TouchMemory): void {
  memory.points = [];
  memory.distance = null;
  memory.origin = null;
  memory.moved = false;
}

/** A press that never left the slop is a tap. A drag or a second finger is not. */
export function consumeTap(memory: TouchMemory): TouchPoint | null {
  const tap = !memory.moved && memory.origin && memory.points.length === 1 ? memory.origin : null;
  resetTouchMemory(memory);
  return tap;
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
    if (!memory.origin) {
      memory.origin = active[0];
    }
    const previous = memory.points.length === 1 ? memory.points[0] : null;
    const travel = Math.hypot(active[0].x - memory.origin.x, active[0].y - memory.origin.y);
    if (previous && travel >= TAP_SLOP_PX) {
      memory.moved = true;
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

  memory.moved = true;

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
