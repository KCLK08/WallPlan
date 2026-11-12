import type { SavedWall } from '@/construction/wallModel';
import { formatMillimetres } from '@/three-dimensional/inspection/inspectionData';
import { measureLines, uniqueStoredOffsets } from '@/three-dimensional/inspection/measurementGeometry';
import type { WallGeometry } from '@/three-dimensional/geometry/types';

import type { ProjectedPart } from '../geometry/project';
import type { DrawingView } from '../geometry/project';
import type { DrawingLayers } from '../views/drawingViews';

export type SheetDimension = {
  id: string;
  textDe: string;
  textEn: string;
  valueDe: string;
  valueEn: string;
  lengthMm: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  axis: 'h' | 'v';
  side: 'above' | 'below' | 'left' | 'right';
  lane: number;
  drawLine: boolean;
};

export function sheetDimensions(
  wall: SavedWall,
  geometry: WallGeometry,
  view: DrawingView,
  layers: DrawingLayers,
  parts: readonly ProjectedPart[],
): SheetDimension[] {
  if (!layers.dimensions) {
    return [];
  }
  const measures = measureLines(wall, geometry, layers.material);
  const byId = new Map(measures.map((measure) => [measure.id, measure]));
  const dims: SheetDimension[] = [];
  const length = byId.get('wall-length');
  const height = byId.get('wall-height');
  const thickness = byId.get('wall-thickness');
  if (view === 'side') {
    if (height) dims.push(span(`side-${height.id}`, height.labelDe, height.labelEn, height.lengthMm, 0, 0, 0, wall.dimensions.heightMm, 'v', 'left'));
    if (thickness) {
      const z = thicknessExtent(parts, thickness.lengthMm);
      dims.push(span(`side-${thickness.id}`, thickness.labelDe, thickness.labelEn, thickness.lengthMm, z.start, 0, z.end, 0, 'h', 'below'));
    }
    dims.push(...layerThicknesses(parts));
    return assignLanes(dims);
  }
  if (view === 'plan') {
    if (length) dims.push(span(length.id, length.labelDe, length.labelEn, length.lengthMm, 0, 0, wall.dimensions.lengthMm, 0, 'h', 'below'));
    if (thickness) {
      const z = thicknessExtent(parts, thickness.lengthMm);
      dims.push(span(thickness.id, thickness.labelDe, thickness.labelEn, thickness.lengthMm, wall.dimensions.lengthMm, z.start, wall.dimensions.lengthMm, z.end, 'v', 'right'));
    }
    dims.push(...spacingDimensions(wall, layers, view));
    dims.push(...doorDimensions(wall, layers, view));
    return assignLanes(dims);
  }
  if (length) dims.push(span(length.id, length.labelDe, length.labelEn, length.lengthMm, 0, 0, wall.dimensions.lengthMm, 0, 'h', 'below'));
  if (height) dims.push(span(height.id, height.labelDe, height.labelEn, height.lengthMm, 0, 0, 0, wall.dimensions.heightMm, 'v', 'left'));
  dims.push(...spacingDimensions(wall, layers, view));
  dims.push(...doorDimensions(wall, layers, view));
  return assignLanes(dims);
}

export function studMarkers(wall: SavedWall, enabled: boolean): { id: string; x: number; textDe: string; textEn: string }[] {
  if (!enabled) {
    return [];
  }
  return uniqueStoredOffsets(wall.framing.studOffsetsMm).map((offset, index) => ({
    id: `stud-position-${index}`,
    x: offset,
    textDe: formatMillimetres(offset, 'de'),
    textEn: formatMillimetres(offset, 'en'),
  }));
}

function spacingDimensions(wall: SavedWall, layers: DrawingLayers, view: DrawingView): SheetDimension[] {
  if (view === 'side' || !layers.material.cw) {
    return [];
  }
  const offsets = uniqueStoredOffsets(wall.framing.studOffsetsMm);
  const y = view === 'plan' ? 0 : wall.dimensions.heightMm;
  const dims: SheetDimension[] = [];
  for (let index = 0; index < offsets.length - 1; index += 1) {
    const gap = offsets[index + 1] - offsets[index];
    if (gap < 1) continue;
    dims.push(
      span(
        `spacing-${index}`,
        'Profilabstand',
        'Stud spacing',
        gap,
        offsets[index],
        y,
        offsets[index + 1],
        y,
        'h',
        'above',
      ),
    );
  }
  return dims;
}

function doorDimensions(wall: SavedWall, layers: DrawingLayers, view: DrawingView): SheetDimension[] {
  const visible = layers.material.openings || layers.material.sideA || layers.material.sideB;
  if (!visible) {
    return [];
  }
  const dims: SheetDimension[] = [];
  for (const opening of wall.openings) {
    const name = opening.name || 'Tür';
    dims.push(
      span(
        `door-${opening.id}-width`,
        `${name}, Breite`,
        `${opening.name || 'Door'}, width`,
        opening.widthMm,
        opening.offsetFromLeftMm,
        view === 'plan' ? 0 : opening.heightMm,
        opening.offsetFromLeftMm + opening.widthMm,
        view === 'plan' ? 0 : opening.heightMm,
        'h',
        'above',
      ),
    );
    if (view !== 'plan') {
      dims.push(
        span(
          `door-${opening.id}-height`,
          `${name}, Höhe`,
          `${opening.name || 'Door'}, height`,
          opening.heightMm,
          opening.offsetFromLeftMm + opening.widthMm,
          0,
          opening.offsetFromLeftMm + opening.widthMm,
          opening.heightMm,
          'v',
          'right',
        ),
      );
    }
    dims.push({
      ...span(
        `door-${opening.id}-offset`,
        `${name}, Abstand von links`,
        `${opening.name || 'Door'}, distance from the left`,
        opening.offsetFromLeftMm,
        0,
        0,
        opening.offsetFromLeftMm,
        0,
        'h',
        'below',
      ),
      drawLine: opening.offsetFromLeftMm >= 1,
    });
  }
  return dims;
}

function layerThicknesses(parts: readonly ProjectedPart[]): SheetDimension[] {
  const seen = new Set<string>();
  const dims: SheetDimension[] = [];
  for (const part of parts) {
    if (part.reference || (part.layer !== 'board-a' && part.layer !== 'board-b') || seen.has(part.selectionId)) {
      continue;
    }
    seen.add(part.selectionId);
    const side = part.side === 'B' ? 'B' : 'A';
    dims.push(
      span(
        `${part.selectionId}-thickness`,
        `Schichtdicke ${side}`,
        `Layer thickness ${side}`,
        part.width,
        part.x,
        part.y + part.height,
        part.x + part.width,
        part.y + part.height,
        'h',
        'above',
      ),
    );
  }
  return dims;
}

function thicknessExtent(parts: readonly ProjectedPart[], fallback: number): { start: number; end: number } {
  const boards = parts.filter((part) => !part.reference && (part.layer === 'board-a' || part.layer === 'board-b' || part.layer === 'uw'));
  if (boards.length === 0) {
    return { start: -fallback / 2, end: fallback / 2 };
  }
  const start = Math.min(...boards.map((part) => part.x));
  const end = Math.max(...boards.map((part) => part.x + part.width));
  return { start, end };
}

function span(
  id: string,
  labelDe: string,
  labelEn: string,
  lengthMm: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  axis: 'h' | 'v',
  side: SheetDimension['side'],
): SheetDimension {
  return {
    id,
    textDe: `${labelDe}: ${formatMillimetres(lengthMm, 'de')}`,
    textEn: `${labelEn}: ${formatMillimetres(lengthMm, 'en')}`,
    valueDe: formatMillimetres(lengthMm, 'de'),
    valueEn: formatMillimetres(lengthMm, 'en'),
    lengthMm,
    x1,
    y1,
    x2,
    y2,
    axis,
    side,
    lane: 0,
    drawLine: lengthMm >= 1,
  };
}

function assignLanes(dimensions: SheetDimension[]): SheetDimension[] {
  const groups = new Map<string, { start: number; end: number }[][]>();
  return dimensions.map((dimension) => {
    const key = `${dimension.side}:${dimension.axis}`;
    const lanes = groups.get(key) ?? [];
    const start = Math.min(dimension.axis === 'h' ? dimension.x1 : dimension.y1, dimension.axis === 'h' ? dimension.x2 : dimension.y2) - 40;
    const end = Math.max(dimension.axis === 'h' ? dimension.x1 : dimension.y1, dimension.axis === 'h' ? dimension.x2 : dimension.y2) + 40;
    let lane = lanes.findIndex((entries) => entries.every((entry) => entry.end <= start || entry.start >= end));
    if (lane < 0) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push({ start, end });
    groups.set(key, lanes);
    return { ...dimension, lane };
  });
}
