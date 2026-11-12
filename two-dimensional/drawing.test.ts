import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SavedWall, WallDraft } from '@/construction/wallModel';
import { compileWall, createWallDraft } from '@/construction/wallRules';
import { buildWallGeometry } from '@/three-dimensional/geometry/wallGeometry';
import { displayBoxes } from '@/three-dimensional/geometry/view';
import { nextSelection, selectionIdForBox } from '@/three-dimensional/inspection/selection';

import { buildSheet, hitSheet } from './sheet';
import { applyDrawingGesture, consumeTap, createGestureMemory } from './rendering/gesture';
import { effectiveScale, fitPxPerMm, frameCamera, panBy, pxPerMmForScale, scaleFits, sheetMillimetres, sheetPoint, zoomAt } from './rendering/scale';
import { layersFor } from './views/drawingViews';

const format1250 = { widthMm: 1250, lengthMm: 2500 };

function wallFrom(draft: WallDraft): SavedWall {
  const compiled = compileWall(draft);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) {
    throw new Error('draft did not compile');
  }
  return compiled.wall;
}

function base(): SavedWall {
  const draft = createWallDraft('project', '2026-11-12T12:00:00.000Z');
  draft.name = 'Wand';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
  draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
  return wallFrom(draft);
}

function doorWall(): SavedWall {
  const draft = createWallDraft('project', '2026-11-12T12:00:00.000Z');
  draft.name = 'Wand';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
  draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
  draft.openings = [
    { id: 'door-1', name: 'Wohnzimmer', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 400 },
    { id: 'door-2', name: 'Küche', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 1800 },
  ];
  draft.insulationCatalogId = 'insulation-stone-board';
  draft.insulationThicknessMm = 40;
  return wallFrom(draft);
}

describe('sheet coordinates and scale', () => {
  it('converts millimetres to sheet pixels and back', () => {
    const bounds = { minX: 0, minY: 0, maxX: 3000, maxY: 2500 };
    const camera = { pxPerMm: 0.2, panX: 10, panY: 20 };
    const point = sheetPoint(1500, 2500, bounds, camera);
    assert.equal(point.x, 310);
    assert.equal(point.y, 20);
    assert.deepEqual(sheetMillimetres(point.x, point.y, bounds, camera), { x: 1500, y: 2500 });
  });

  it('fits a wall and keeps a named scale honest', () => {
    assert.equal(fitPxPerMm(3000, 2500, 400, 300, 20), 260 / 2500);
    const atFifty = pxPerMmForScale(50, 96);
    assert.ok(Math.abs(effectiveScale(atFifty, 96) - 50) < 1e-9);
    const bounds = { minX: 0, minY: 0, maxX: 3000, maxY: 2500 };
    const named = frameCamera(bounds, 360, 280, 20, 96, 16);
    assert.equal(scaleFits(bounds, 360, 280, 20, 96, 16), false);
    assert.equal(named.pxPerMm, pxPerMmForScale(20, 96));
    const smallBounds = { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    const small = frameCamera(smallBounds, 800, 600, 10, 96, 16);
    assert.equal(scaleFits(smallBounds, 800, 600, 10, 96, 16), true);
    assert.ok(Math.abs(effectiveScale(small.pxPerMm, 96) - 10) < 1e-9);
    const anchor = zoomAt({ pxPerMm: 0.1, panX: 20, panY: 30 }, 2, 50, 40, 0.01, 5);
    assert.equal(anchor.pxPerMm, 0.2);
    assert.equal(anchor.panX, 50 - 300 * 0.2);
    assert.equal(anchor.panY, 40 - 100 * 0.2);
    assert.deepEqual(panBy(anchor, 4, -2), { ...anchor, panX: anchor.panX + 4, panY: anchor.panY - 2 });
  });

  it('pans only after the finger leaves the tap slop', () => {
    const camera = { pxPerMm: 0.1, panX: 0, panY: 0 };
    const limits = { minPxPerMm: 0.01, maxPxPerMm: 5 };
    const tapMemory = createGestureMemory();
    const still = applyDrawingGesture(camera, tapMemory, [{ x: 10, y: 10 }], limits);
    const nudged = applyDrawingGesture(still, tapMemory, [{ x: 14, y: 12 }], limits);
    assert.deepEqual(nudged, camera);
    assert.deepEqual(consumeTap(tapMemory), { x: 10, y: 10 });

    const dragMemory = createGestureMemory();
    applyDrawingGesture(camera, dragMemory, [{ x: 10, y: 10 }], limits);
    const dragged = applyDrawingGesture(camera, dragMemory, [{ x: 40, y: 16 }], limits);
    assert.equal(dragged.panX, 30);
    assert.equal(dragged.panY, 6);
    assert.equal(consumeTap(dragMemory), null);

    const pinchMemory = createGestureMemory();
    applyDrawingGesture(camera, pinchMemory, [{ x: 0, y: 0 }, { x: 40, y: 0 }], limits);
    const pinched = applyDrawingGesture(camera, pinchMemory, [{ x: 0, y: 0 }, { x: 80, y: 0 }], limits);
    assert.ok(pinched.pxPerMm > camera.pxPerMm);
  });
});

describe('drawing views', () => {
  it('matches the 3D footprints in the front view', () => {
    const wall = base();
    const before = JSON.stringify(wall);
    const geometry = buildWallGeometry(wall);
    const layers = layersFor('front', geometry);
    const sheet = buildSheet(wall, 'front', layers);
    const three = displayBoxes(geometry, 'complete', layers.material).filter((box) => box.layer !== 'opening');
    assert.deepEqual(sheet.parts.map((part) => part.boxId).sort(), three.map((box) => box.id).sort());
    for (const part of sheet.parts) {
      const box = geometry.boxes.find((entry) => entry.id === part.boxId);
      assert.ok(box);
      assert.equal(part.width, box.sizeMm[0]);
      assert.equal(part.height, box.sizeMm[1]);
      assert.equal(part.x, box.centerMm[0] - box.sizeMm[0] / 2);
      assert.equal(part.y, box.centerMm[1] - box.sizeMm[1] / 2);
      assert.equal(part.selectionId, selectionIdForBox(box));
    }
    assert.equal(sheet.parts.some((part) => part.layer === 'board-b'), false);
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm, 3000);
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'wall-height')?.lengthMm, 2500);
    assert.equal(JSON.stringify(wall), before);
    assert.equal(sheet.parts.some((part) => part.boxId.includes('ua') || part.boxId.includes('lintel')), false);
  });

  it('shows side B from the back and keeps the stored left edge', () => {
    const wall = base();
    const sheet = buildSheet(wall, 'back');
    assert.equal(sheet.parts.some((part) => part.layer === 'board-b'), true);
    assert.equal(sheet.parts.some((part) => part.layer === 'board-a'), false);
    assert.equal(sheet.notes.some((note) => note.id === 'same-left'), true);
    const board = sheet.parts.find((part) => part.layer === 'board-b');
    assert.ok(board);
    assert.ok(board.x < 100);
  });

  it('cuts a section through a bay and reads the real layer thicknesses', () => {
    const wall = doorWall();
    const sheet = buildSheet(wall, 'side');
    assert.ok(sheet.cut);
    assert.equal(sheet.cut.throughOpeningId, null);
    assert.equal(sheet.parts.some((part) => part.layer === 'board-a' && !part.reference), true);
    assert.equal(sheet.parts.some((part) => part.layer === 'board-b' && !part.reference), true);
    const insulation = sheet.parts.find((part) => part.layer === 'insulation' && !part.reference);
    assert.equal(insulation?.width, 40);
    const stud = sheet.parts.find((part) => part.reference && part.boxId.endsWith('-web'));
    assert.equal(stud?.width, 73.8);
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'side-wall-thickness')?.lengthMm, 75 + 12.5 + 12.5);
    assert.equal(sheet.notes.some((note) => note.textDe.includes('kein zusätzliches Profil')), true);
  });

  it('draws the plan from the same length and thickness', () => {
    const wall = base();
    const narrow = base();
    narrow.dimensions.lengthMm = 1000;
    narrow.framing.nominalDepthMm = 50;
    const wide = buildSheet(wall, 'plan');
    const small = buildSheet(narrow, 'plan');
    assert.equal(wide.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm, 3000);
    assert.equal(small.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm, 1000);
    assert.ok((wide.dimensions.find((entry) => entry.id === 'wall-thickness')?.lengthMm ?? 0) > (small.dimensions.find((entry) => entry.id === 'wall-thickness')?.lengthMm ?? 0));
    assert.equal(wide.parts.some((part) => part.layer === 'board-a'), true);
    assert.equal(wide.parts.some((part) => part.layer === 'board-b'), true);
  });

  it('leaves door openings empty and dimensions every opening', () => {
    const wall = doorWall();
    const sheet = buildSheet(wall, 'front');
    assert.equal(hitSheet(sheet, 400 + 442, 1000), 'opening-door-1');
    assert.equal(hitSheet(sheet, 1800 + 100, 1000), 'opening-door-2');
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'door-door-1-width')?.lengthMm, 885);
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'door-door-2-offset')?.lengthMm, 1800);
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'door-door-1-height')?.textDe.includes('2.010 mm'), true);
    const covered = sheet.parts.find((part) => part.selectionId === 'cw-0');
    const exposed = sheet.parts.find((part) => part.selectionId === 'cw-1');
    assert.equal(covered?.hidden, true);
    assert.equal(exposed?.hidden, false);
  });

  it('keeps OSB and a second gypsum layer distinct', () => {
    const draft = createWallDraft('project', '2026-11-12T12:00:00.000Z');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 50;
    draft.spacingMm = 625;
    draft.sideA = {
      side: 'A',
      variant: 'osb-gypsum',
      staggerJoints: false,
      layers: [
        { id: 'osb', catalogItemId: 'board-osb3-15', format: null },
        { id: 'gk', catalogItemId: 'gk-12-5', format: format1250 },
      ],
    };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    const wall = wallFrom(draft);
    const front = buildSheet(wall, 'front');
    const gk = front.parts.find((part) => part.selectionId === 'board-A-gk');
    const osb = front.parts.find((part) => part.selectionId === 'board-A-osb');
    assert.equal(gk?.height, 2500);
    assert.equal(osb?.width, 3000);
    const side = buildSheet(wall, 'side');
    assert.equal(side.parts.find((part) => part.selectionId === 'board-A-osb' && !part.reference)?.width, 15);
    assert.equal(side.parts.find((part) => part.selectionId === 'board-A-gk' && !part.reference)?.width, 12.5);
    assert.equal(side.dimensions.find((entry) => entry.id === 'board-A-osb-thickness')?.lengthMm, 15);
  });

  it('follows edited stud positions and a changed wall', () => {
    const wall = base();
    wall.framing.studOffsetsMm = [0, 1000, 3000];
    const sheet = buildSheet(wall, 'construction');
    assert.equal(sheet.parts.some((part) => part.layer === 'board-a' || part.layer === 'board-b'), false);
    assert.deepEqual(
      sheet.markers.map((marker) => marker.x),
      [0, 1000, 3000],
    );
    assert.equal(sheet.dimensions.find((entry) => entry.id === 'spacing-0')?.lengthMm, 1000);
    const longer = base();
    longer.dimensions.lengthMm = 4000;
    longer.dimensions.heightMm = 2600;
    const next = buildSheet(longer, 'front');
    assert.equal(next.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm, 4000);
    assert.equal(next.dimensions.find((entry) => entry.id === 'wall-height')?.lengthMm, 2600);
    assert.notEqual(next.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm, sheet.dimensions.find((entry) => entry.id === 'wall-length')?.lengthMm);
  });

  it('hides a layer and selects one stud without changing the wall', () => {
    const wall = base();
    const before = JSON.stringify(wall);
    const geometry = buildWallGeometry(wall);
    const layers = layersFor('construction', geometry);
    layers.material.uw = false;
    const sheet = buildSheet(wall, 'construction', layers);
    assert.equal(sheet.parts.some((part) => part.layer === 'uw'), false);
    assert.equal(sheet.dimensions.some((entry) => entry.id.startsWith('spacing-')), true);
    layers.material.cw = false;
    const withoutStuds = buildSheet(wall, 'construction', layers);
    assert.equal(withoutStuds.dimensions.some((entry) => entry.id.startsWith('spacing-')), false);
    const stud = sheet.parts.find((part) => part.selectionId === 'cw-1' && part.boxId.endsWith('-web'));
    assert.ok(stud);
    assert.equal(hitSheet(sheet, stud.x + stud.width / 2, stud.y + stud.height / 2), 'cw-1');
    assert.equal(nextSelection('cw-1', 'cw-1'), null);
    assert.equal(nextSelection(null, 'cw-1'), 'cw-1');
    assert.equal(JSON.stringify(wall), before);
  });
});
