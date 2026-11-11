import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

import type { SceneBox } from '@/three-dimensional/geometry/types';
import { toScene } from '@/three-dimensional/geometry/units';
import type { OrbitCamera } from '@/three-dimensional/orbit';
import { orbitPosition } from '@/three-dimensional/orbit';

import {
  ORTHO_FAR,
  ORTHO_NEAR,
  PERSPECTIVE_FAR,
  PERSPECTIVE_FOV,
  PERSPECTIVE_NEAR,
  orthographicZoom,
} from './viewCamera';

export type Viewport = { width: number; height: number };
export type ScreenPoint = { x: number; y: number };

export function selectionIdForBox(box: SceneBox): string {
  if (box.layer === 'cw') {
    const index = box.id.split('-')[1] ?? '0';
    return `cw-${index}`;
  }
  if (box.layer === 'uw') {
    const [kind, place] = box.id.split('-');
    return `${kind}-${place}`;
  }
  const board = box.id.match(/^board-([AB])-(.+)-\d+$/);
  if (board) {
    return `board-${board[1]}-${board[2]}`;
  }
  const insulation = box.id.match(/^insulation-(\d+)-\d+$/);
  if (insulation) {
    return `insulation-${insulation[1]}`;
  }
  const opening = box.id.match(/^opening-(.+)-[AB]-(?:left|right|top|bottom)$/);
  if (opening) {
    return `opening-${opening[1]}`;
  }
  return box.id;
}

export function nextSelection(current: string | null, picked: string | null): string | null {
  if (picked === null || picked === current) {
    return null;
  }
  return picked;
}

export function pickSelection(
  boxes: readonly SceneBox[],
  camera: OrbitCamera,
  viewport: Viewport,
  point: ScreenPoint,
  options: { orthographic: boolean; lengthMm: number; heightMm: number },
): string | null {
  if (viewport.width < 2 || viewport.height < 2) {
    return null;
  }
  const ray = cameraRay(camera, viewport, point, options);
  let closest: { id: string; distance: number } | null = null;
  for (const box of boxes) {
    const distance = rayBox(ray.origin, ray.direction, box);
    if (distance === null) {
      continue;
    }
    const id = selectionIdForBox(box);
    if (!closest || distance < closest.distance) {
      closest = { id, distance };
    }
  }
  return closest?.id ?? null;
}

function cameraRay(
  camera: OrbitCamera,
  viewport: Viewport,
  point: ScreenPoint,
  options: { orthographic: boolean; lengthMm: number; heightMm: number },
): { origin: [number, number, number]; direction: [number, number, number] } {
  const view = options.orthographic
    ? new OrthographicCamera(viewport.width / -2, viewport.width / 2, viewport.height / 2, viewport.height / -2, ORTHO_NEAR, ORTHO_FAR)
    : new PerspectiveCamera(PERSPECTIVE_FOV, viewport.width / viewport.height, PERSPECTIVE_NEAR, PERSPECTIVE_FAR);
  if (view instanceof OrthographicCamera) {
    view.zoom = orthographicZoom(
      options.lengthMm,
      options.heightMm,
      viewport.width,
      viewport.height,
      camera.radius,
      camera.frameRadius ?? camera.radius,
    );
    view.updateProjectionMatrix();
  }
  const [x, y, z] = orbitPosition(camera);
  view.position.set(x, y, z);
  view.up.set(0, 1, 0);
  view.lookAt(camera.targetX, camera.targetY, camera.targetZ);
  view.updateMatrixWorld();
  const near = new Vector3((point.x / viewport.width) * 2 - 1, -(point.y / viewport.height) * 2 + 1, -1);
  const far = near.clone();
  far.z = 1;
  near.unproject(view);
  far.unproject(view);
  const direction = far.sub(near).normalize();
  return {
    origin: [near.x, near.y, near.z],
    direction: [direction.x, direction.y, direction.z],
  };
}

function rayBox(origin: [number, number, number], direction: [number, number, number], box: SceneBox): number | null {
  const min = box.centerMm.map((value, index) => toScene(value - box.sizeMm[index] / 2));
  const max = box.centerMm.map((value, index) => toScene(value + box.sizeMm[index] / 2));
  let tMin = 0;
  let tMax = Number.POSITIVE_INFINITY;
  for (let axis = 0; axis < 3; axis += 1) {
    if (Math.abs(direction[axis]) < 1e-8) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) {
        return null;
      }
      continue;
    }
    let enter = (min[axis] - origin[axis]) / direction[axis];
    let leave = (max[axis] - origin[axis]) / direction[axis];
    if (enter > leave) {
      const swap = enter;
      enter = leave;
      leave = swap;
    }
    tMin = Math.max(tMin, enter);
    tMax = Math.min(tMax, leave);
    if (tMin > tMax) {
      return null;
    }
  }
  return tMin;
}
