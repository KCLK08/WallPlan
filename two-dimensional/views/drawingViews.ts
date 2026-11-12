import type { SavedOpening, SavedWall } from '@/construction/wallModel';
import type { LayerToggles, SceneBox, WallGeometry } from '@/three-dimensional/geometry/types';
import { togglesFor } from '@/three-dimensional/geometry/view';

import { boxHitsCut, projectBox, type DrawingView, type ProjectedPart } from '../geometry/project';

export type DrawingLayers = {
  material: LayerToggles;
  dimensions: boolean;
  dimensionText: boolean;
  markers: boolean;
};

export type SectionCut = {
  x: number;
  studBoxId: string | null;
  throughOpeningId: string | null;
};

export function layersFor(view: DrawingView, geometry: WallGeometry): DrawingLayers {
  const base = togglesFor('complete', geometry);
  const material: LayerToggles = { ...base, boards: { ...base.boards } };
  if (view === 'back') {
    material.sideA = false;
  } else if (view === 'construction') {
    material.sideA = false;
    material.sideB = false;
  } else if (view === 'front') {
    material.sideB = false;
  }
  if (view === 'front' || view === 'back') {
    material.insulation = false;
  }
  return { material, dimensions: true, dimensionText: true, markers: view !== 'side' };
}

export function sectionCut(wall: SavedWall, geometry: WallGeometry): SectionCut {
  const webs = geometry.boxes
    .filter((box) => box.layer === 'cw' && box.id.endsWith('-web'))
    .sort((left, right) => left.centerMm[0] - right.centerMm[0]);
  for (let index = 0; index < webs.length - 1; index += 1) {
    const x = (webs[index].centerMm[0] + webs[index + 1].centerMm[0]) / 2;
    if (!openingAt(wall.openings, x)) {
      return { x, studBoxId: webs[index].id, throughOpeningId: null };
    }
  }
  const clear = webs.find((box) => !openingAt(wall.openings, box.centerMm[0]));
  if (clear) {
    return { x: clear.centerMm[0], studBoxId: clear.id, throughOpeningId: null };
  }
  const fallback = webs[0]?.centerMm[0] ?? wall.dimensions.lengthMm / 2;
  return { x: fallback, studBoxId: webs[0]?.id ?? null, throughOpeningId: openingAt(wall.openings, fallback)?.id ?? null };
}

export function projectView(geometry: WallGeometry, view: DrawingView, layers: DrawingLayers, cut: SectionCut): ProjectedPart[] {
  const visible = geometry.boxes.filter((box) => box.layer !== 'opening' && partVisible(box, layers.material));
  const source = view === 'side' ? visible.filter((box) => boxHitsCut(box, cut.x)) : visible;
  const parts = source.map((box) => projectBox(box, view));
  if (view === 'side' && layers.material.cw && cut.studBoxId) {
    const studId = cut.studBoxId.replace(/-web$/, '');
    const already = new Set(parts.map((part) => part.boxId));
    for (const box of visible) {
      if (!box.id.startsWith(`${studId}-`) || already.has(box.id)) {
        continue;
      }
      parts.push({ ...projectBox(box, 'side'), reference: true });
    }
  }
  return markHidden(parts, nearSide(view, layers));
}

export function openingAt(openings: readonly SavedOpening[], x: number): SavedOpening | null {
  return openings.find((opening) => x > opening.offsetFromLeftMm + 0.01 && x < opening.offsetFromLeftMm + opening.widthMm - 0.01) ?? null;
}

function partVisible(box: SceneBox, toggles: LayerToggles): boolean {
  if (box.layer === 'uw') return toggles.uw;
  if (box.layer === 'cw') return toggles.cw;
  if (box.layer === 'insulation') return toggles.insulation;
  if (box.layer === 'board-a' && !toggles.sideA) return false;
  if (box.layer === 'board-b' && !toggles.sideB) return false;
  if (box.boardLayerId && toggles.boards[box.boardLayerId] === false) return false;
  return true;
}

function nearSide(view: DrawingView, layers: DrawingLayers): 'A' | 'B' | null {
  if ((view === 'front' || view === 'construction') && layers.material.sideA) return 'A';
  if (view === 'back' && layers.material.sideB) return 'B';
  return null;
}

function markHidden(parts: ProjectedPart[], near: 'A' | 'B' | null): ProjectedPart[] {
  if (!near) {
    return parts;
  }
  const covers = parts.filter((part) => part.side === near && (part.layer === 'board-a' || part.layer === 'board-b'));
  return parts.map((part) => {
    if (part.side === near && (part.layer === 'board-a' || part.layer === 'board-b')) {
      return part;
    }
    const centerX = part.x + part.width / 2;
    const centerY = part.y + part.height / 2;
    const covered = covers.some(
      (cover) => centerX >= cover.x && centerX <= cover.x + cover.width && centerY >= cover.y && centerY <= cover.y + cover.height,
    );
    return covered ? { ...part, hidden: true } : part;
  });
}
