import type { SceneBox } from '@/three-dimensional/geometry/types';
import { selectionIdForBox } from '@/three-dimensional/inspection/selection';

export type DrawingView = 'front' | 'back' | 'side' | 'plan' | 'construction';

export type ProjectedPart = {
  boxId: string;
  selectionId: string;
  layer: SceneBox['layer'];
  side: SceneBox['side'];
  boardLayerId: string | null;
  catalogItemId: string | null;
  /** Left edge in sheet millimetres. */
  x: number;
  /** Bottom edge in sheet millimetres. Sheet Y grows upward. */
  y: number;
  width: number;
  height: number;
  depth: number;
  fill: string;
  /** A neighboring stud section drawn in the side view. It is not steel at the cut. */
  reference: boolean;
  hidden: boolean;
};

export function projectBox(box: SceneBox, view: DrawingView): ProjectedPart {
  const [u, v, depthAxis] = axes(view);
  return {
    boxId: box.id,
    selectionId: selectionIdForBox(box),
    layer: box.layer,
    side: box.side,
    boardLayerId: box.boardLayerId,
    catalogItemId: box.catalogItemId,
    x: box.centerMm[u] - box.sizeMm[u] / 2,
    y: box.centerMm[v] - box.sizeMm[v] / 2,
    width: box.sizeMm[u],
    height: box.sizeMm[v],
    depth: box.centerMm[depthAxis],
    fill: box.color,
    reference: false,
    hidden: false,
  };
}

export function boxHitsCut(box: SceneBox, cutX: number): boolean {
  const min = box.centerMm[0] - box.sizeMm[0] / 2;
  const max = box.centerMm[0] + box.sizeMm[0] / 2;
  return cutX >= min - 0.01 && cutX <= max + 0.01;
}

export function paintOrder(parts: readonly ProjectedPart[], view: DrawingView): ProjectedPart[] {
  const depthSign = view === 'back' ? -1 : 1;
  return [...parts].sort((left, right) => {
    if (left.hidden !== right.hidden) {
      return left.hidden ? -1 : 1;
    }
    if (left.reference !== right.reference) {
      return left.reference ? 1 : -1;
    }
    return depthSign * (left.depth - right.depth);
  });
}

export function hitPart(parts: readonly ProjectedPart[], x: number, y: number): string | null {
  const ordered = [...parts].reverse();
  for (const part of ordered) {
    if (contains(part, x, y)) {
      return part.selectionId;
    }
  }
  return null;
}

function contains(part: ProjectedPart, x: number, y: number): boolean {
  const inside = x >= part.x && x <= part.x + part.width && y >= part.y && y <= part.y + part.height;
  if (!inside) {
    return false;
  }
  if (!part.reference) {
    return true;
  }
  const edge = 6;
  return x - part.x <= edge || part.x + part.width - x <= edge || y - part.y <= edge || part.y + part.height - y <= edge;
}

function axes(view: DrawingView): [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] {
  if (view === 'side') {
    return [2, 1, 0];
  }
  if (view === 'plan') {
    return [0, 2, 1];
  }
  return [0, 1, 2];
}
