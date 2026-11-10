import { EXPLOSION_STEP_MM, LAYER_SEPARATION_MM } from './units';
import type { LayerToggles, SceneBox, ViewMode, WallGeometry } from './types';

export function togglesFor(mode: ViewMode, geometry: WallGeometry): LayerToggles {
  const boards: Record<string, boolean> = {};
  for (const box of geometry.boxes) {
    if (box.boardLayerId) {
      boards[box.boardLayerId] = true;
    }
  }
  return {
    uw: true,
    cw: true,
    insulation: mode !== 'side-a' && mode !== 'side-b',
    openings: true,
    sideA: mode !== 'construction' && mode !== 'side-b',
    sideB: mode !== 'construction' && mode !== 'side-a',
    boards,
  };
}

export function displayBoxes(geometry: WallGeometry, mode: ViewMode, toggles: LayerToggles): SceneBox[] {
  const step = mode === 'exploded' ? EXPLOSION_STEP_MM : mode === 'layers' ? LAYER_SEPARATION_MM : 0;
  return geometry.boxes.filter((box) => visible(box, toggles)).map((box) => shift(box, step));
}

export function cameraAngles(mode: ViewMode): { theta: number; phi: number } {
  if (mode === 'side-a') {
    return { theta: 0.02, phi: 1.45 };
  }
  if (mode === 'side-b') {
    return { theta: Math.PI, phi: 1.45 };
  }
  return { theta: 0.62, phi: 1.18 };
}

function visible(box: SceneBox, toggles: LayerToggles): boolean {
  if (box.layer === 'uw') {
    return toggles.uw;
  }
  if (box.layer === 'cw') {
    return toggles.cw;
  }
  if (box.layer === 'insulation') {
    return toggles.insulation;
  }
  if (box.layer === 'opening') {
    return toggles.openings;
  }
  if (box.layer === 'board-a' && !toggles.sideA) {
    return false;
  }
  if (box.layer === 'board-b' && !toggles.sideB) {
    return false;
  }
  if (box.boardLayerId && toggles.boards[box.boardLayerId] === false) {
    return false;
  }
  return true;
}

function shift(box: SceneBox, step: number): SceneBox {
  if (step === 0 || box.stackIndex === 0) {
    return box;
  }
  const direction = box.side === 'B' ? -1 : 1;
  const next: SceneBox = {
    ...box,
    centerMm: [box.centerMm[0], box.centerMm[1], box.centerMm[2] + direction * step * box.stackIndex],
  };
  return next;
}
