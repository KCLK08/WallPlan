import { findMaterial } from '@/catalog/materials';
import type { SavedLayer, SavedWall, WallSideId } from '@/construction/wallModel';

import { subtractOpenings, type FaceRect } from './openingGeometry';
import { DISPLAY_GAP_MM } from './units';
import { GEOMETRY_COLORS, type GeometryNote, type SceneBox } from './types';

export function boardBoxes(wall: SavedWall): { boxes: SceneBox[]; notes: GeometryNote[]; outerAMm: number; outerBMm: number } {
  const cut = subtractOpenings(wall.dimensions.lengthMm, wall.dimensions.heightMm, wall.openings);
  if (!cut.ok) {
    return {
      boxes: [],
      outerAMm: 0,
      outerBMm: 0,
      notes: [
        {
          id: 'board-overlap',
          kind: 'missing',
          textDe: 'Die Öffnungen überschneiden sich. Die Beplankung wird nicht gezeichnet, damit keine Fläche doppelt ausgespart wird.',
          textEn: 'The openings overlap. The boards are not drawn, so the same area is not cut out twice.',
        },
      ],
    };
  }
  const sideA = sideBoxes(wall, 'A', cut.rects);
  const sideB = sideBoxes(wall, 'B', cut.rects);
  const notes: GeometryNote[] = [...sideA.notes, ...sideB.notes];
  if (wall.sides.A.variant === 'double-gypsum' || wall.sides.B.variant === 'double-gypsum') {
    notes.push({
      id: 'no-joint-layout',
      kind: 'assumption',
      textDe: 'Mehrere Lagen sind durchgehend gezeichnet. Eine Fugenversetzung ist nicht geplant und steckt nicht in der Geometrie.',
      textEn: 'Several layers are drawn as continuous sheets. A joint offset is not planned and is not part of the geometry.',
    });
  }
  if (wall.openings.length > 0) {
    notes.push({
      id: 'opening-from-floor',
      kind: 'assumption',
      textDe: 'Türöffnungen beginnen an der Unterkante. Eine Brüstungshöhe ist nicht gespeichert.',
      textEn: 'Door openings start at the bottom edge. A sill height is not stored.',
    });
  }
  return {
    boxes: [...sideA.boxes, ...sideB.boxes],
    notes,
    outerAMm: sideA.outerMm,
    outerBMm: sideB.outerMm,
  };
}

function sideBoxes(
  wall: SavedWall,
  side: WallSideId,
  rects: readonly FaceRect[],
): { boxes: SceneBox[]; notes: GeometryNote[]; outerMm: number } {
  const layers = wall.sides[side].layers;
  const boxes: SceneBox[] = [];
  const notes: GeometryNote[] = [];
  let cursor = wall.framing.nominalDepthMm / 2 + DISPLAY_GAP_MM;
  layers.forEach((layer, index) => {
    const thickness = layerThickness(layer);
    if (thickness === null) {
      notes.push({
        id: `thickness-${side}-${layer.id}`,
        kind: 'missing',
        textDe: `Für ${layer.catalogItemId} ist keine Plattenstärke hinterlegt. Die Lage wird nicht gezeichnet.`,
        textEn: `No board thickness is recorded for ${layer.catalogItemId}. The layer is not drawn.`,
      });
      return;
    }
    const sign = side === 'A' ? 1 : -1;
    const z = sign * (cursor + thickness / 2);
    rects.forEach((rect, piece) => {
      boxes.push({
        id: `board-${side}-${layer.id}-${piece}`,
        layer: side === 'A' ? 'board-a' : 'board-b',
        side,
        boardLayerId: layer.id,
        catalogItemId: layer.catalogItemId,
        stackIndex: layer.orderFromFraming,
        sizeMm: [rect.widthMm, rect.heightMm, thickness],
        centerMm: [rect.xMm + rect.widthMm / 2, rect.yMm + rect.heightMm / 2, z],
        color: boardColor(layer.catalogItemId, side, index),
      });
    });
    cursor += thickness + DISPLAY_GAP_MM;
  });
  return { boxes, notes, outerMm: Math.max(0, cursor - wall.framing.nominalDepthMm / 2 - DISPLAY_GAP_MM) };
}

function layerThickness(layer: SavedLayer): number | null {
  const item = findMaterial(layer.catalogItemId);
  const thickness = item?.board?.thicknessMm ?? item?.thicknessMm ?? null;
  return thickness !== null && thickness > 0 ? thickness : null;
}

function boardColor(catalogItemId: string, side: WallSideId, index: number): string {
  const family = findMaterial(catalogItemId)?.board?.family;
  if (family === 'osb') {
    return GEOMETRY_COLORS.osb;
  }
  const scale = side === 'A' ? GEOMETRY_COLORS.gypsumA : GEOMETRY_COLORS.gypsumB;
  return scale[Math.min(index, scale.length - 1)];
}
