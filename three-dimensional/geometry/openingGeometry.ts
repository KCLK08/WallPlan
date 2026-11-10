import { openingsOverlap } from '@/calculations/material/calculationRules';
import type { SavedOpening } from '@/construction/wallModel';

import { DISPLAY_GAP_MM } from './units';
import { GEOMETRY_COLORS, type SceneBox } from './types';

export type FaceRect = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
};

export function subtractOpenings(
  lengthMm: number,
  heightMm: number,
  openings: readonly SavedOpening[],
): { ok: true; rects: FaceRect[] } | { ok: false } {
  if (openingsOverlap(openings)) {
    return { ok: false };
  }
  const sorted = [...openings].sort((left, right) => left.offsetFromLeftMm - right.offsetFromLeftMm);
  const rects: FaceRect[] = [];
  let cursor = 0;
  for (const opening of sorted) {
    if (opening.offsetFromLeftMm > cursor + 0.001) {
      rects.push({
        xMm: cursor,
        yMm: 0,
        widthMm: opening.offsetFromLeftMm - cursor,
        heightMm,
      });
    }
    const above = heightMm - opening.heightMm;
    if (above > 0.001) {
      rects.push({
        xMm: opening.offsetFromLeftMm,
        yMm: opening.heightMm,
        widthMm: opening.widthMm,
        heightMm: above,
      });
    }
    cursor = opening.offsetFromLeftMm + opening.widthMm;
  }
  if (lengthMm - cursor > 0.001) {
    rects.push({ xMm: cursor, yMm: 0, widthMm: lengthMm - cursor, heightMm });
  }
  return { ok: true, rects };
}

export function openingMarkers(
  openings: readonly SavedOpening[],
  nominalDepthMm: number,
  outerAMm: number,
  outerBMm: number,
): SceneBox[] {
  return openings.flatMap((opening) => [
    ...frame(opening, 'A', nominalDepthMm / 2 + outerAMm + DISPLAY_GAP_MM + 3),
    ...frame(opening, 'B', -(nominalDepthMm / 2 + outerBMm + DISPLAY_GAP_MM + 3)),
  ]);
}

function frame(opening: SavedOpening, side: 'A' | 'B', zMm: number): SceneBox[] {
  const bar = 6;
  const x = opening.offsetFromLeftMm;
  const width = opening.widthMm;
  const height = opening.heightMm;
  const sign = side === 'A' ? 1 : -1;
  const parts: Array<[string, [number, number, number], [number, number, number]]> = [
    ['left', [bar, height, bar], [x, height / 2, zMm]],
    ['right', [bar, height, bar], [x + width, height / 2, zMm]],
    ['top', [width, bar, bar], [x + width / 2, height, zMm]],
    ['bottom', [width, bar, bar], [x + width / 2, 0, zMm]],
  ];
  return parts.map(([edge, sizeMm, centerMm]) => ({
    id: `opening-${opening.id}-${side}-${edge}`,
    layer: 'opening',
    side,
    boardLayerId: null,
    catalogItemId: null,
    stackIndex: 4 * sign,
    sizeMm,
    centerMm,
    color: GEOMETRY_COLORS.opening,
  }));
}
