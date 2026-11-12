import type { SavedWall } from '@/construction/wallModel';
import type { GeometryNote } from '@/three-dimensional/geometry/types';
import { buildWallGeometry } from '@/three-dimensional/geometry/wallGeometry';

import { sheetDimensions, studMarkers, type SheetDimension } from './dimensions/dimensions';
import { hitPart, paintOrder, type DrawingView, type ProjectedPart } from './geometry/project';
import { layersFor, projectView, sectionCut, type DrawingLayers, type SectionCut } from './views/drawingViews';

export type OpeningMark = {
  selectionId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type DrawingSheet = {
  view: DrawingView;
  parts: ProjectedPart[];
  openings: OpeningMark[];
  dimensions: SheetDimension[];
  markers: { id: string; x: number; textDe: string; textEn: string }[];
  notes: GeometryNote[];
  cut: SectionCut | null;
  bounds: Bounds;
};

export function hitSheet(sheet: DrawingSheet, x: number, y: number): string | null {
  const part = hitPart(sheet.parts, x, y);
  if (part) {
    return part;
  }
  for (const opening of [...sheet.openings].reverse()) {
    if (x >= opening.x && x <= opening.x + opening.width && y >= opening.y && y <= opening.y + opening.height) {
      return opening.selectionId;
    }
  }
  return null;
}

export function buildSheet(wall: SavedWall, view: DrawingView, layers: DrawingLayers = layersFor(view, buildWallGeometry(wall))): DrawingSheet {
  const geometry = buildWallGeometry(wall);
  const cut = view === 'side' || view === 'plan' ? sectionCut(wall, geometry) : null;
  const parts = paintOrder(projectView(geometry, view, layers, cut ?? sectionCut(wall, geometry)), view);
  const openings = layers.material.openings ? openingMarks(wall, view, parts, cut) : [];
  const dimensions = sheetDimensions(wall, geometry, view, layers, parts);
  const markers = view === 'side' ? [] : studMarkers(wall, layers.markers);
  return {
    view,
    parts,
    openings,
    dimensions,
    markers,
    notes: [...drawingNotes(wall, view, cut, parts), ...geometry.notes],
    cut: view === 'side' ? cut : null,
    bounds: boundsOf(wall, view, parts),
  };
}

function openingMarks(
  wall: SavedWall,
  view: DrawingView,
  parts: readonly ProjectedPart[],
  cut: SectionCut | null,
): OpeningMark[] {
  return wall.openings.flatMap((opening) => {
    if (view === 'side') {
      if (!cut || cut.throughOpeningId !== opening.id) {
        return [];
      }
      const minX = parts.length ? Math.min(...parts.map((part) => part.x)) : -wall.framing.nominalDepthMm / 2;
      const maxX = parts.length ? Math.max(...parts.map((part) => part.x + part.width)) : wall.framing.nominalDepthMm / 2;
      return [
        {
          selectionId: `opening-${opening.id}`,
          name: opening.name,
          x: minX,
          y: 0,
          width: Math.max(maxX - minX, 1),
          height: opening.heightMm,
        },
      ];
    }
    if (view === 'plan') {
      const boards = parts.filter((part) => part.layer === 'board-a' || part.layer === 'board-b' || part.layer === 'uw');
      const minY = boards.length ? Math.min(...boards.map((part) => part.y)) : -wall.framing.nominalDepthMm / 2;
      const maxY = boards.length ? Math.max(...boards.map((part) => part.y + part.height)) : wall.framing.nominalDepthMm / 2;
      return [
        {
          selectionId: `opening-${opening.id}`,
          name: opening.name,
          x: opening.offsetFromLeftMm,
          y: minY,
          width: opening.widthMm,
          height: maxY - minY,
        },
      ];
    }
    return [
      {
        selectionId: `opening-${opening.id}`,
        name: opening.name,
        x: opening.offsetFromLeftMm,
        y: 0,
        width: opening.widthMm,
        height: opening.heightMm,
      },
    ];
  });
}

function drawingNotes(wall: SavedWall, view: DrawingView, cut: SectionCut | null, parts: readonly ProjectedPart[]): GeometryNote[] {
  const notes: GeometryNote[] = [
    {
      id: 'not-a-shop-drawing',
      kind: 'display',
      textDe: 'Geometrische Darstellung der gespeicherten Wand. Kein geprüfter Ausführungs- oder Montageplan.',
      textEn: 'A geometric drawing of the saved wall. Not a checked fabrication or installation drawing.',
    },
  ];
  if (view === 'back' || view === 'plan') {
    notes.push({
      id: 'same-left',
      kind: 'display',
      textDe: 'Links bleibt das gespeicherte Wandende. Die Rückansicht ist nicht gespiegelt, damit die Maße zur Vorderansicht passen.',
      textEn: 'The stored left end stays on the left. The back view is not mirrored, so the dimensions match the front.',
    });
  }
  if (view === 'side' && cut) {
    const throughStud = Boolean(cut.studBoxId && parts.some((part) => part.boxId === cut.studBoxId && !part.reference));
    notes.push({
      id: 'section-cut',
      kind: 'display',
      textDe: throughStud
        ? `Schnitt durch den Ständer bei ${Math.round(cut.x)} mm. Ein Türsturz wird nicht ergänzt.`
        : `Schnitt im Feld bei ${Math.round(cut.x)} mm. Der CW-Umriss gehört zum benachbarten Ständer und ist kein zusätzliches Profil im Feld.`,
      textEn: throughStud
        ? `Section through the stud at ${Math.round(cut.x)} mm. A lintel is not added.`
        : `Section in the bay at ${Math.round(cut.x)} mm. The CW outline belongs to the neighboring stud and is not extra steel in the bay.`,
    });
    if (cut.throughOpeningId) {
      notes.push({
        id: 'section-opening',
        kind: 'missing',
        textDe: 'Der Schnitt trifft eine Türöffnung. Ein Türsturz wird nicht ergänzt.',
        textEn: 'The section meets a door opening. A lintel is not added.',
      });
    }
  }
  if (view === 'plan' && wall.openings.length > 0) {
    notes.push({
      id: 'plan-opening',
      kind: 'display',
      textDe: 'Die gestrichelte Zone ist die gespeicherte Türlage. Liegt über der Tür noch Beplankung, bleibt sie in der Draufsicht liegen.',
      textEn: 'The dashed zone is the stored door position. Cladding that remains above the door stays in the plan.',
    });
  }
  if (!wall.insulation.catalogItemId) {
    notes.push({
      id: 'no-insulation',
      kind: 'missing',
      textDe: 'Keine Dämmung gespeichert.',
      textEn: 'No insulation is stored.',
    });
  }
  return notes;
}

function boundsOf(wall: SavedWall, view: DrawingView, parts: readonly ProjectedPart[]): Bounds {
  if (parts.length === 0) {
    if (view === 'side') {
      const half = wall.framing.nominalDepthMm / 2;
      return { minX: -half, minY: 0, maxX: half, maxY: wall.dimensions.heightMm };
    }
    if (view === 'plan') {
      const half = wall.framing.nominalDepthMm / 2;
      return { minX: 0, minY: -half, maxX: wall.dimensions.lengthMm, maxY: half };
    }
    return { minX: 0, minY: 0, maxX: wall.dimensions.lengthMm, maxY: wall.dimensions.heightMm };
  }
  return {
    minX: Math.min(...parts.map((part) => part.x)),
    minY: Math.min(...parts.map((part) => part.y)),
    maxX: Math.max(...parts.map((part) => part.x + part.width)),
    maxY: Math.max(...parts.map((part) => part.y + part.height)),
  };
}
