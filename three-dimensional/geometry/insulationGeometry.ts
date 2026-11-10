import type { SavedWall } from '@/construction/wallModel';

import { subtractOpenings } from './openingGeometry';
import { drawnStudCenters, profileSection } from './profileGeometry';
import { DISPLAY_GAP_MM } from './units';
import { GEOMETRY_COLORS, type GeometryNote, type SceneBox } from './types';

export function insulationBoxes(wall: SavedWall): { boxes: SceneBox[]; notes: GeometryNote[] } {
  if (!wall.insulation.enabled || wall.insulation.thicknessMm === null || !wall.insulation.catalogItemId) {
    return { boxes: [], notes: [] };
  }
  if (wall.insulation.geometricStatus === 'incompatible' || wall.insulation.thicknessMm > wall.framing.nominalDepthMm) {
    return {
      boxes: [],
      notes: [
        {
          id: 'insulation-fit',
          kind: 'missing',
          textDe: 'Die Dämmstoffdicke passt nicht in die Profilnenntiefe. Es wird kein Körper gezeichnet.',
          textEn: 'The insulation thickness does not fit the nominal profile depth. No solid is drawn.',
        },
      ],
    };
  }
  const cut = subtractOpenings(wall.dimensions.lengthMm, wall.dimensions.heightMm, wall.openings);
  if (!cut.ok) {
    return {
      boxes: [],
      notes: [
        {
          id: 'insulation-overlap',
          kind: 'missing',
          textDe: 'Die Öffnungen überschneiden sich. Die Dämmung wird nicht gezeichnet.',
          textEn: 'The openings overlap. The insulation is not drawn.',
        },
      ],
    };
  }
  const stud = profileSection(wall.framing.cwCatalogId, wall.framing.nominalDepthMm);
  const uw = profileSection(wall.framing.uwCatalogId, wall.framing.nominalDepthMm);
  const y0 = (uw.flangeMm ?? uw.drawnSteelMm) + DISPLAY_GAP_MM;
  const y1 = wall.dimensions.heightMm - y0;
  const boxes: SceneBox[] = [];
  bays(drawnStudCenters(wall), stud.drawnSteelMm).forEach((bay, bayIndex) => {
    const localOpenings = wall.openings.flatMap((opening) => {
      const start = Math.max(opening.offsetFromLeftMm, bay.xMm);
      const end = Math.min(opening.offsetFromLeftMm + opening.widthMm, bay.xMm + bay.widthMm);
      const holeTop = Math.min(Math.max(opening.heightMm - y0, 0), y1 - y0);
      if (end - start <= 0.5 || holeTop <= 0.5) {
        return [];
      }
      return [{ ...opening, offsetFromLeftMm: start - bay.xMm, widthMm: end - start, heightMm: holeTop }];
    });
    const pieces = subtractOpenings(bay.widthMm, y1 - y0, localOpenings);
    if (!pieces.ok) {
      return;
    }
    pieces.rects.forEach((rect, piece) => {
      boxes.push({
        id: `insulation-${bayIndex}-${piece}`,
        layer: 'insulation',
        side: null,
        boardLayerId: null,
        catalogItemId: wall.insulation.catalogItemId,
        stackIndex: 0,
        sizeMm: [rect.widthMm, rect.heightMm, wall.insulation.thicknessMm ?? 0],
        centerMm: [bay.xMm + rect.xMm + rect.widthMm / 2, y0 + rect.yMm + rect.heightMm / 2, 0],
        color: GEOMETRY_COLORS.insulation,
      });
    });
  });
  return {
    boxes,
    notes: [
      {
        id: 'insulation-bays',
        kind: 'assumption',
        textDe: 'Die Dämmung füllt die Felder zwischen den gespeicherten Ständern bis zur gewählten Dicke. Das ist keine Aussage zu Schall, Brand oder Wärmedämmung.',
        textEn: 'The insulation fills the bays between the stored studs up to the chosen thickness. This says nothing about acoustics, fire or thermal performance.',
      },
    ],
  };
}

function bays(centers: readonly number[], studMm: number): { xMm: number; widthMm: number }[] {
  const edges = [...centers].sort((left, right) => left - right);
  const half = studMm / 2 + DISPLAY_GAP_MM;
  const result: { xMm: number; widthMm: number }[] = [];
  for (let index = 0; index < edges.length - 1; index += 1) {
    const left = edges[index] + half;
    const right = edges[index + 1] - half;
    if (right - left > 1) {
      result.push({ xMm: left, widthMm: right - left });
    }
  }
  return result;
}
