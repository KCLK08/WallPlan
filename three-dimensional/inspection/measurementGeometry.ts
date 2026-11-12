import type { SavedWall } from '@/construction/wallModel';
import type { LayerToggles, WallGeometry } from '@/three-dimensional/geometry/types';

import type { MeasureLine } from './inspectionTypes';
import { selectionIdForBox } from './selection';

const outside = 90;

export function measureLines(wall: SavedWall, geometry: WallGeometry, toggles: LayerToggles): MeasureLine[] {
  const lines: MeasureLine[] = [
    line('wall-length', 'Wandlänge', 'Wall length', wall.dimensions.lengthMm, [0, -outside, 0], [wall.dimensions.lengthMm, -outside, 0]),
    line('wall-height', 'Wandhöhe', 'Wall height', wall.dimensions.heightMm, [-outside, 0, 0], [-outside, wall.dimensions.heightMm, 0]),
    thicknessLine(wall, geometry),
  ];
  if (toggles.cw) {
    const offsets = uniqueStoredOffsets(wall.framing.studOffsetsMm);
    for (let index = 0; index < offsets.length - 1; index += 1) {
      const gap = offsets[index + 1] - offsets[index];
      if (gap < 1) continue;
      lines.push(
        line(
          `spacing-${index}`,
          'Profilabstand',
          'Stud spacing',
          gap,
          [offsets[index], wall.dimensions.heightMm + outside, 0],
          [offsets[index + 1], wall.dimensions.heightMm + outside, 0],
        ),
      );
    }
  }
  const showDoors = toggles.openings || toggles.sideA || toggles.sideB;
  if (showDoors) {
    for (const opening of wall.openings) {
      lines.push(
        line(
          `door-${opening.id}-width`,
          'Türbreite',
          'Door width',
          opening.widthMm,
          [opening.offsetFromLeftMm, opening.heightMm + 50, 0],
          [opening.offsetFromLeftMm + opening.widthMm, opening.heightMm + 50, 0],
        ),
        line(
          `door-${opening.id}-height`,
          'Türhöhe',
          'Door height',
          opening.heightMm,
          [opening.offsetFromLeftMm + opening.widthMm + 50, 0, 0],
          [opening.offsetFromLeftMm + opening.widthMm + 50, opening.heightMm, 0],
        ),
        line(
          `door-${opening.id}-offset`,
          'Abstand der Tür von links',
          'Door distance from the left',
          opening.offsetFromLeftMm,
          [0, -outside / 2, 0],
          [opening.offsetFromLeftMm, -outside / 2, 0],
        ),
      );
    }
  }
  const seen = new Set<string>();
  for (const box of geometry.boxes) {
    if (box.layer !== 'board-a' && box.layer !== 'board-b') continue;
    const id = selectionIdForBox(box);
    if (seen.has(id) || !boardVisible(box.boardLayerId, box.side, toggles)) continue;
    seen.add(id);
    const sign = box.side === 'B' ? -1 : 1;
    const z = box.centerMm[2];
    lines.push(
      line(
        `${id}-thickness`,
        `Schichtdicke ${box.side ?? ''}`,
        `Layer thickness ${box.side ?? ''}`,
        box.sizeMm[2],
        [wall.dimensions.lengthMm + outside, wall.dimensions.heightMm * 0.72, z - sign * (box.sizeMm[2] / 2)],
        [wall.dimensions.lengthMm + outside, wall.dimensions.heightMm * 0.72, z + sign * (box.sizeMm[2] / 2)],
      ),
    );
  }
  return lines;
}

export function isolateBoard(toggles: LayerToggles, layerId: string, side: 'A' | 'B'): LayerToggles {
  const boards: Record<string, boolean> = {};
  for (const id of Object.keys(toggles.boards)) {
    boards[id] = id === layerId;
  }
  boards[layerId] = true;
  return {
    ...toggles,
    sideA: side === 'A',
    sideB: side === 'B',
    boards,
  };
}

export function revealBoards(toggles: LayerToggles, geometry: WallGeometry): LayerToggles {
  const boards: Record<string, boolean> = {};
  for (const box of geometry.boxes) {
    if (box.boardLayerId) boards[box.boardLayerId] = true;
  }
  return { ...toggles, sideA: true, sideB: true, boards };
}

function thicknessLine(wall: SavedWall, geometry: WallGeometry): MeasureLine {
  let thickness = wall.framing.nominalDepthMm;
  const seen = new Set<string>();
  for (const box of geometry.boxes) {
    if ((box.layer !== 'board-a' && box.layer !== 'board-b') || !box.boardLayerId || seen.has(box.boardLayerId)) continue;
    seen.add(box.boardLayerId);
    thickness += box.sizeMm[2];
  }
  const y = wall.dimensions.heightMm * 0.35;
  const x = wall.dimensions.lengthMm + outside;
  return line('wall-thickness', 'Wandstärke', 'Wall thickness', thickness, [x, y, -thickness / 2], [x, y, thickness / 2]);
}

function boardVisible(layerId: string | null, side: SceneSide, toggles: LayerToggles): boolean {
  if (side === 'A' && !toggles.sideA) return false;
  if (side === 'B' && !toggles.sideB) return false;
  if (layerId && toggles.boards[layerId] === false) return false;
  return true;
}

type SceneSide = 'A' | 'B' | null;

export function uniqueStoredOffsets(values: readonly number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const value of values) {
    const key = Math.round(value * 10);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function line(
  id: string,
  labelDe: string,
  labelEn: string,
  lengthMm: number,
  startMm: [number, number, number],
  endMm: [number, number, number],
): MeasureLine {
  return { id, labelDe, labelEn, lengthMm, startMm, endMm };
}
