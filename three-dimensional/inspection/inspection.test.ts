import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SavedWall, WallDraft } from '@/construction/wallModel';
import { compileWall, createWallDraft } from '@/construction/wallRules';

import type { SceneBox } from '../geometry/types';
import { displayBoxes, togglesFor } from '../geometry/view';
import { buildWallGeometry } from '../geometry/wallGeometry';
import type { OrbitCamera } from '../orbit';
import { formatMillimetres, inspectPart } from './inspectionData';
import { isolateBoard, measureLines, revealBoards } from './measurementGeometry';
import { buildOverlay } from './overlayGroup';
import { nextSelection, pickSelection, selectionIdForBox } from './selection';

const format1250 = { widthMm: 1250, lengthMm: 2500 };
const viewport = { width: 800, height: 600 };
const center = { x: 400, y: 300 };

function wallFrom(draft: WallDraft): SavedWall {
  const compiled = compileWall(draft);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) {
    throw new Error('draft did not compile');
  }
  return compiled.wall;
}

function base(): SavedWall {
  const draft = createWallDraft('project', '2026-11-10T12:00:00.000Z');
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
  const draft = createWallDraft('project', '2026-11-10T12:00:00.000Z');
  draft.name = 'Wand';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
  draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
  draft.openings = [{ id: 'door-1', name: 'Wohnzimmer', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 400 }];
  draft.insulationCatalogId = 'insulation-stone-board';
  draft.insulationThicknessMm = 40;
  return wallFrom(draft);
}

function osbWall(): SavedWall {
  const draft = createWallDraft('project', '2026-11-10T12:00:00.000Z');
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
  return wallFrom(draft);
}

function lookAt(box: SceneBox, theta: number): OrbitCamera {
  return {
    theta,
    phi: Math.PI / 2,
    radius: 4,
    targetX: box.centerMm[0] / 1000,
    targetY: box.centerMm[1] / 1000,
    targetZ: box.centerMm[2] / 1000,
    frameRadius: 4,
  };
}

function pick(boxes: readonly SceneBox[], box: SceneBox, theta: number, orthographic = false): string | null {
  return pickSelection(boxes, lookAt(box, theta), viewport, center, {
    orthographic,
    lengthMm: 3000,
    heightMm: 2500,
  });
}

function value(record: NonNullable<ReturnType<typeof inspectPart>>, label: string): string {
  const fact = record.facts.find((entry) => entry.labelDe === label);
  assert.ok(fact, label);
  return fact.valueDe;
}

describe('part selection', () => {
  it('selects one UW track, one CW stud and keeps the ids stable', () => {
    const geometry = buildWallGeometry(base());
    const floor = geometry.boxes.find((box) => box.id === 'uw-floor-web');
    const stud = geometry.boxes.find((box) => box.id === 'cw-1-web');
    const other = geometry.boxes.find((box) => box.id === 'cw-2-web');
    assert.ok(floor && stud && other);
    const profiles = geometry.boxes.filter((box) => box.layer === 'uw' || box.layer === 'cw');
    assert.equal(pick(profiles, floor, 0), 'uw-floor');
    assert.equal(pick(profiles, stud, 0), 'cw-1');
    assert.equal(pick(profiles, other, 0), 'cw-2');
    assert.equal(pick(profiles, floor, 0, true), 'uw-floor');
    const first = geometry.boxes.map(selectionIdForBox);
    const second = buildWallGeometry(base()).boxes.map(selectionIdForBox);
    assert.deepEqual(first, second);
    assert.equal(selectionIdForBox(geometry.boxes.find((box) => box.id === 'uw-floor-flange-a')!), 'uw-floor');
    assert.equal(selectionIdForBox(geometry.boxes.find((box) => box.id === 'cw-1-flange-a')!), 'cw-1');
    assert.notEqual(selectionIdForBox(stud), selectionIdForBox(other));
  });

  it('selects side A, side B, one gypsum layer and the OSB layer', () => {
    const plain = buildWallGeometry(base());
    const sideA = plain.boxes.find((box) => box.id.startsWith('board-A-layer-a'));
    const sideB = plain.boxes.find((box) => box.id.startsWith('board-B-layer-b'));
    assert.ok(sideA && sideB);
    assert.equal(pick(plain.boxes, sideA, 0), 'board-A-layer-a');
    assert.equal(pick(plain.boxes, sideB, Math.PI), 'board-B-layer-b');

    const mixed = buildWallGeometry(osbWall());
    const gypsum = mixed.boxes.find((box) => box.id.startsWith('board-A-gk'));
    const osb = mixed.boxes.find((box) => box.id.startsWith('board-A-osb'));
    assert.ok(gypsum && osb);
    assert.equal(pick(mixed.boxes, gypsum, 0), 'board-A-gk');
    assert.equal(pick(mixed.boxes, osb, Math.PI / 2), 'board-A-osb');
    assert.equal(selectionIdForBox({ ...osb, id: 'board-A-osb-3' }), 'board-A-osb');
  });

  it('selects an insulation bay and a door opening', () => {
    const geometry = buildWallGeometry(doorWall());
    const bay = geometry.boxes.find((box) => box.id === 'insulation-0-0');
    const jamb = geometry.boxes.find((box) => box.id === 'opening-door-1-A-left');
    assert.ok(bay && jamb);
    const cavity = geometry.boxes.filter((box) => box.layer === 'insulation');
    assert.equal(pick(cavity, bay, 0), 'insulation-0');
    const markers = geometry.boxes.filter((box) => box.layer === 'opening');
    assert.equal(pick(markers, jamb, 0), 'opening-door-1');
    assert.equal(selectionIdForBox(geometry.boxes.find((box) => box.id === 'opening-door-1-B-top')!), 'opening-door-1');
  });

  it('clears the selection on the same part or an empty tap and replaces it otherwise', () => {
    assert.equal(nextSelection(null, 'uw-floor'), 'uw-floor');
    assert.equal(nextSelection('uw-floor', 'uw-floor'), null);
    assert.equal(nextSelection('uw-floor', null), null);
    assert.equal(nextSelection('cw-1', 'board-A-layer-a'), 'board-A-layer-a');
  });

  it('keeps hyphenated layer and opening ids attached to every piece', () => {
    const layer: SceneBox = {
      id: 'board-A-inner-osb-4',
      layer: 'board-a',
      side: 'A',
      boardLayerId: 'inner-osb',
      catalogItemId: null,
      stackIndex: 1,
      sizeMm: [10, 10, 10],
      centerMm: [0, 0, 0],
      color: '#ffffff',
    };
    const marker: SceneBox = { ...layer, id: 'opening-door-west-1-B-bottom', layer: 'opening' };
    assert.equal(selectionIdForBox(layer), 'board-A-inner-osb');
    assert.equal(selectionIdForBox({ ...layer, id: 'board-A-inner-osb-12' }), 'board-A-inner-osb');
    assert.equal(selectionIdForBox(marker), 'opening-door-west-1');
  });
});

describe('inspection facts', () => {
  it('reads catalog data and does not present the drawn 2 mm steel as the material thickness', () => {
    const wall = base();
    const geometry = buildWallGeometry(wall);
    const floor = inspectPart(wall, geometry, 'uw-floor');
    const stud = inspectPart(wall, geometry, 'cw-1');
    assert.ok(floor && stud);
    assert.equal(floor.titleDe, 'UW-Bodenprofil');
    assert.equal(value(floor, 'Bezeichnung'), 'UW-Profil 75');
    assert.equal(value(floor, 'Material-ID'), 'uw-75');
    assert.equal(value(floor, 'Materialstärke'), '0,6 mm');
    assert.equal(value(floor, 'Flansch'), '40 mm');
    assert.equal(value(floor, 'Gezeichnete Höhe'), '40 mm');
    assert.equal(value(stud, 'Bezeichnung'), 'CW-Profil 75');
    assert.equal(value(stud, 'Materialstärke'), '0,6 mm');
    assert.equal(value(stud, 'Flansch'), '50 mm aus der Typbezeichnung');
    assert.equal(value(stud, 'Gespeicherte Position von links'), '625 mm');
    assert.equal(value(stud, 'Türöffnung'), 'Keine');
    assert.equal(JSON.stringify(floor.facts).includes('2 mm'), false);
    assert.equal(JSON.stringify(stud.facts).includes('A2'), false);
  });

  it('names each board side, the OSB layer and its order', () => {
    const mixed = osbWall();
    const geometry = buildWallGeometry(mixed);
    const osb = inspectPart(mixed, geometry, 'board-A-osb');
    const gypsum = inspectPart(mixed, geometry, 'board-A-gk');
    const other = inspectPart(mixed, geometry, 'board-B-layer-b');
    assert.ok(osb && gypsum && other);
    assert.equal(value(osb, 'Bezeichnung'), 'OSB/3, 15 mm');
    assert.equal(value(osb, 'Material-ID'), 'board-osb3-15');
    assert.equal(value(osb, 'Wandseite'), 'Seite A');
    assert.equal(value(osb, 'Schicht'), '1 von 2');
    assert.equal(value(osb, 'Plattenstärke'), '15 mm');
    assert.equal(value(osb, 'Hinterlegtes Format'), 'Nicht hinterlegt');
    assert.equal(value(gypsum, 'Schicht'), '2 von 2');
    assert.equal(value(gypsum, 'Plattenstärke'), '12,5 mm');
    assert.equal(value(gypsum, 'Wandseite'), 'Seite A');
    assert.equal(value(other, 'Wandseite'), 'Seite B');
    assert.equal(value(other, 'Schicht'), '1 von 1');
  });

  it('describes insulation and a door without inventing performance or a UA length', () => {
    const wall = doorWall();
    const geometry = buildWallGeometry(wall);
    const bay = inspectPart(wall, geometry, 'insulation-0');
    const opening = inspectPart(wall, geometry, 'opening-door-1');
    const stud = inspectPart(wall, geometry, 'cw-1');
    assert.ok(bay && opening && stud);
    assert.equal(value(bay, 'Bezeichnung'), 'Steinwolle-Trennwandplatte');
    assert.equal(value(bay, 'Material-ID'), 'insulation-stone-board');
    assert.equal(value(bay, 'Dicke'), '40 mm');
    assert.equal(JSON.stringify(bay.facts).includes('0,040'), false);
    assert.equal(JSON.stringify(bay.facts).includes('λ'), false);
    assert.equal(opening.titleDe, 'Wohnzimmer');
    assert.equal(value(opening, 'Breite'), '885 mm');
    assert.equal(value(opening, 'Höhe'), '2.010 mm');
    assert.equal(value(opening, 'Abstand von links'), '400 mm');
    assert.equal(value(opening, 'UA und Sturz'), 'Nicht als Einbau hinterlegt');
    assert.match(value(stud, 'Türöffnung'), /Wohnzimmer/);
    assert.equal(JSON.stringify(opening.facts).includes('UA-Profil'), false);
  });

  it('says when catalog data is missing and still shows the stored id', () => {
    const wall = base();
    wall.framing.uwCatalogId = 'uw-missing';
    wall.sides.A.layers[0].catalogItemId = 'board-missing';
    const geometry = buildWallGeometry(wall);
    const track = inspectPart(wall, geometry, 'uw-floor');
    const board = inspectPart(wall, geometry, 'board-A-layer-a');
    assert.ok(track);
    assert.equal(value(track, 'Bezeichnung'), 'Nicht hinterlegt');
    assert.equal(value(track, 'Material-ID'), 'uw-missing');
    assert.equal(value(track, 'Materialstärke'), 'Nicht hinterlegt');
    assert.equal(value(track, 'Flansch'), 'Nicht hinterlegt');
    assert.equal(board, null);
    wall.sides.A.layers[0].catalogItemId = 'gk-12-5';
    const drawn = buildWallGeometry(wall);
    wall.sides.A.layers[0].catalogItemId = 'board-missing';
    const missingBoard = inspectPart(wall, drawn, 'board-A-layer-a');
    assert.ok(missingBoard);
    assert.equal(value(missingBoard, 'Bezeichnung'), 'Nicht hinterlegt');
    assert.equal(value(missingBoard, 'Material-ID'), 'board-missing');
    assert.equal(value(missingBoard, 'Plattenstärke'), 'Nicht hinterlegt');
    assert.equal(value(missingBoard, 'Hinterlegtes Format'), '1.250 mm × 2.500 mm');
  });
});

describe('measurement lines', () => {
  it('uses the saved wall sizes and skips a zero door offset line in the overlay', () => {
    const small = base();
    small.dimensions.lengthMm = 1000;
    small.dimensions.heightMm = 2400;
    const largeDraft = createWallDraft('project', '2026-11-10T12:00:00.000Z');
    largeDraft.name = 'Wand';
    largeDraft.lengthMm = 4000;
    largeDraft.heightMm = 2600;
    largeDraft.nominalDepthMm = 100;
    largeDraft.spacingMm = 625;
    largeDraft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    largeDraft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    const large = wallFrom(largeDraft);
    const smallLines = measureLines(small, buildWallGeometry(small), togglesFor('complete', buildWallGeometry(small)));
    const largeGeometry = buildWallGeometry(large);
    const largeLines = measureLines(large, largeGeometry, togglesFor('complete', largeGeometry));
    assert.equal(smallLines.find((entry) => entry.id === 'wall-length')?.lengthMm, 1000);
    assert.equal(smallLines.find((entry) => entry.id === 'wall-height')?.lengthMm, 2400);
    assert.equal(largeLines.find((entry) => entry.id === 'wall-length')?.lengthMm, 4000);
    assert.equal(largeLines.find((entry) => entry.id === 'wall-height')?.lengthMm, 2600);
    assert.equal(largeLines.find((entry) => entry.id === 'wall-thickness')?.lengthMm, 125);
    assert.equal(measureLines(base(), buildWallGeometry(base()), togglesFor('complete', buildWallGeometry(base()))).find((entry) => entry.id === 'wall-thickness')?.lengthMm, 100);

    const flush = doorWall();
    flush.openings = [{ id: 'flush', name: 'Bündig', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 0 }];
    const geometry = buildWallGeometry(flush);
    const lines = measureLines(flush, geometry, togglesFor('complete', geometry));
    const offset = lines.find((entry) => entry.id === 'door-flush-offset');
    assert.equal(offset?.lengthMm, 0);
    const overlay = buildOverlay([], lines);
    assert.equal(overlay.children.some((child) => child.name === 'measure-door-flush-offset'), false);
    assert.equal(overlay.children.some((child) => child.name === 'measure-door-flush-width'), true);
  });

  it('keeps measures on the construction while the explosion view moves the boards', () => {
    const wall = osbWall();
    const geometry = buildWallGeometry(wall);
    const toggles = togglesFor('exploded', geometry);
    const lines = measureLines(wall, geometry, toggles);
    const board = geometry.boxes.find((box) => box.id.startsWith('board-A-gk'));
    assert.ok(board);
    const exploded = displayBoxes(geometry, 'exploded', toggles).find((box) => box.id === board.id);
    assert.notEqual(exploded?.centerMm[2], board.centerMm[2]);
    const thickness = lines.find((entry) => entry.id === 'board-A-gk-thickness');
    assert.equal(thickness?.lengthMm, 12.5);
    assert.equal((thickness!.startMm[2] + thickness!.endMm[2]) / 2, board.centerMm[2]);
    assert.deepEqual(
      lines.filter((entry) => entry.id.startsWith('spacing-')).map((entry) => entry.lengthMm),
      [625, 625, 625, 625, 500],
    );
  });

  it('drops lines for hidden studs, hidden layers and hidden doors', () => {
    const wall = doorWall();
    const geometry = buildWallGeometry(wall);
    const hiddenStuds = { ...togglesFor('complete', geometry), cw: false };
    assert.equal(measureLines(wall, geometry, hiddenStuds).some((entry) => entry.id.startsWith('spacing-')), false);
    const hiddenBoards = { ...togglesFor('complete', geometry), sideA: false, boards: { ...togglesFor('complete', geometry).boards, 'layer-a': false } };
    const withoutA = measureLines(wall, geometry, hiddenBoards);
    assert.equal(withoutA.some((entry) => entry.id.startsWith('board-A-')), false);
    assert.equal(withoutA.some((entry) => entry.id.startsWith('board-B-')), true);
    const hiddenDoor = { ...togglesFor('construction', geometry), openings: false };
    assert.equal(measureLines(wall, geometry, hiddenDoor).some((entry) => entry.id.startsWith('door-')), false);
    const visible = displayBoxes(geometry, 'complete', hiddenBoards);
    assert.equal(visible.some((box) => box.layer === 'board-a'), false);
    assert.equal(visible.some((box) => selectionIdForBox(box) === 'cw-1'), true);
  });

  it('follows view modes and can isolate one layer without editing the wall', () => {
    const wall = osbWall();
    const before = JSON.stringify(wall);
    const geometry = buildWallGeometry(wall);
    const construction = togglesFor('construction', geometry);
    const framing = displayBoxes(geometry, 'construction', construction);
    assert.equal(framing.some((box) => box.layer === 'board-a' || box.layer === 'board-b'), false);
    assert.equal(measureLines(wall, geometry, construction).some((entry) => entry.id.includes('thickness') && entry.id.startsWith('board-')), false);
    const sideA = togglesFor('side-a', geometry);
    assert.equal(displayBoxes(geometry, 'side-a', sideA).some((box) => box.side === 'B'), false);
    const isolated = isolateBoard(togglesFor('complete', geometry), 'osb', 'A');
    const shown = displayBoxes(geometry, 'layers', isolated);
    assert.equal(shown.some((box) => box.boardLayerId === 'osb'), true);
    assert.equal(shown.some((box) => box.boardLayerId === 'gk' || box.side === 'B'), false);
    const restored = revealBoards(isolated, geometry);
    assert.equal(displayBoxes(geometry, 'complete', restored).some((box) => box.side === 'B'), true);
    assert.equal(displayBoxes(geometry, 'complete', restored).some((box) => box.boardLayerId === 'gk'), true);
    assert.equal(JSON.stringify(wall), before);
  });

  it('highlights the selected solids without changing their size', () => {
    const geometry = buildWallGeometry(base());
    const board = geometry.boxes.find((box) => box.id.startsWith('board-A-layer-a'));
    assert.ok(board);
    const size = [...board.sizeMm];
    const overlay = buildOverlay([board], []);
    const highlight = overlay.children.find((child) => child.name === `highlight-${board.id}`);
    assert.ok(highlight);
    assert.deepEqual(board.sizeMm, size);
    assert.equal(overlay.children.some((child) => child.name === `highlight-edge-${board.id}`), true);
    assert.equal(overlay.children.length, 2);
  });
});

describe('formatMillimetres', () => {
  it('keeps one decimal place in German and English', () => {
    assert.equal(formatMillimetres(12.5, 'de'), '12,5 mm');
    assert.equal(formatMillimetres(12.5, 'en'), '12.5 mm');
    assert.equal(formatMillimetres(2010, 'de'), '2.010 mm');
  });
});
