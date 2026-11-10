import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SavedWall, WallDraft } from '@/construction/wallModel';
import { compileWall, createWallDraft } from '@/construction/wallRules';

import type { SceneBox } from './types';
import { displayBoxes, togglesFor } from './view';
import { buildWallGeometry } from './wallGeometry';

const format1250 = { widthMm: 1250, lengthMm: 2500 };

function wallFrom(draft: WallDraft): SavedWall {
  const compiled = compileWall(draft);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) {
    throw new Error('draft did not compile');
  }
  return compiled.wall;
}

function base(changes: Partial<WallDraft> = {}): SavedWall {
  const draft = createWallDraft('project', '2026-11-10T12:00:00.000Z');
  draft.name = 'Wand';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
  draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
  return wallFrom({ ...draft, ...changes, sideA: changes.sideA ?? draft.sideA, sideB: changes.sideB ?? draft.sideB });
}

function boxes(geometry: ReturnType<typeof buildWallGeometry>, prefix: string): SceneBox[] {
  return geometry.boxes.filter((box) => box.id.startsWith(prefix));
}

function area(items: readonly SceneBox[]): number {
  return items.reduce((sum, box) => sum + box.sizeMm[0] * box.sizeMm[1], 0);
}

function overlaps(left: SceneBox, right: SceneBox): boolean {
  return [0, 1, 2].every((axis) => {
    const leftStart = left.centerMm[axis] - left.sizeMm[axis] / 2;
    const leftEnd = left.centerMm[axis] + left.sizeMm[axis] / 2;
    const rightStart = right.centerMm[axis] - right.sizeMm[axis] / 2;
    const rightEnd = right.centerMm[axis] + right.sizeMm[axis] / 2;
    return leftStart < rightEnd - 0.05 && rightStart < leftEnd - 0.05;
  });
}

function hitsOpening(box: SceneBox, opening: { x: number; width: number; height: number }): boolean {
  const x0 = box.centerMm[0] - box.sizeMm[0] / 2;
  const x1 = box.centerMm[0] + box.sizeMm[0] / 2;
  const y0 = box.centerMm[1] - box.sizeMm[1] / 2;
  const y1 = box.centerMm[1] + box.sizeMm[1] / 2;
  return x0 < opening.x + opening.width - 0.05 && opening.x < x1 - 0.05 && y0 < opening.height - 0.05 && 0 < y1 - 0.05;
}

describe('saved wall geometry', () => {
  it('builds one track pair and the stored studs for a plain wall', () => {
    const geometry = buildWallGeometry(base());
    assert.equal(boxes(geometry, 'uw-floor').length, 3);
    assert.equal(boxes(geometry, 'uw-ceiling').length, 3);
    assert.equal(boxes(geometry, 'uw-left').length, 3);
    assert.equal(boxes(geometry, 'uw-right').length, 3);
    assert.equal(boxes(geometry, 'cw-').filter((box) => box.id.endsWith('-web')).length, 6);
    const middle = geometry.boxes.find((box) => box.id === 'cw-1-web');
    assert.equal(middle?.centerMm[0], 625);
    assert.equal(middle?.sizeMm[2], 73.8);
    assert.equal(geometry.boxes.find((box) => box.id === 'uw-floor-web')?.sizeMm[2], 75);
    assert.equal(geometry.boxes.find((box) => box.id === 'uw-floor-flange-a')?.sizeMm[1], 38);
    assert.equal(area(boxes(geometry, 'board-A-layer-a')), 3000 * 2500);
    assert.equal(area(boxes(geometry, 'board-B-layer-b')), 3000 * 2500);
    assert.equal(geometry.boxes.some((box) => box.layer === 'insulation'), false);
    assert.equal(geometry.boxes.some((box) => box.id.includes('ua') || box.id.includes('lintel')), false);
    const profiles = geometry.boxes.filter((box) => box.layer === 'uw' || box.layer === 'cw');
    for (let left = 0; left < profiles.length; left += 1) {
      for (let right = left + 1; right < profiles.length; right += 1) {
        assert.equal(overlaps(profiles[left], profiles[right]), false, `${profiles[left].id} ${profiles[right].id}`);
      }
    }
  });

  it('cuts one door out of both board sides and the insulation', () => {
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 75;
    draft.spacingMm = 625;
    draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'board-gypsum-h2-12-5', format: { widthMm: 1250, lengthMm: 2000 } };
    draft.openings = [{ id: 'door-1', name: 'Wohnzimmer', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 400 }];
    draft.insulationCatalogId = 'insulation-stone-board';
    draft.insulationThicknessMm = 40;
    const geometry = buildWallGeometry(wallFrom(draft));
    const opening = { x: 400, width: 885, height: 2010 };
    const net = 3000 * 2500 - 885 * 2010;
    assert.equal(area(boxes(geometry, 'board-A-layer-a')), net);
    assert.equal(area(boxes(geometry, 'board-B-layer-b')), net);
    assert.notEqual(boxes(geometry, 'board-A')[0]?.catalogItemId, boxes(geometry, 'board-B')[0]?.catalogItemId);
    for (const box of [...boxes(geometry, 'board-'), ...boxes(geometry, 'insulation-')]) {
      assert.equal(hitsOpening(box, opening), false, box.id);
    }
    assert.equal(geometry.boxes.find((box) => box.id === 'insulation-0-0')?.sizeMm[2], 40);
    assert.ok(geometry.notes.some((note) => note.id === 'no-door-profiles'));
    assert.ok(geometry.notes.some((note) => note.id === 'stud-through-opening'));
    assert.ok(geometry.boxes.some((box) => box.id === 'cw-1-web' && box.centerMm[0] === 625));
    assert.equal(geometry.boxes.some((box) => box.catalogItemId === 'ua-75' || box.catalogItemId === 'lintel-75'), false);
  });

  it('cuts several doors and follows length, height and profile width', () => {
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 4000;
    draft.heightMm = 2600;
    draft.nominalDepthMm = 100;
    draft.spacingMm = 312.5;
    draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    draft.openings = [
      { id: 'd1', name: '', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 200 },
      { id: 'd2', name: '', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 2000 },
    ];
    const wide = buildWallGeometry(wallFrom(draft));
    const narrow = buildWallGeometry(base({ lengthMm: 1000, heightMm: 2400, nominalDepthMm: 50 }));
    assert.equal(area(boxes(wide, 'board-A-layer-a')), 4000 * 2600 - 2 * 885 * 2010);
    assert.ok((wide.boxes.find((box) => box.id === 'uw-floor-web')?.sizeMm[0] ?? 0) > (narrow.boxes.find((box) => box.id === 'uw-floor-web')?.sizeMm[0] ?? 0));
    assert.equal(wide.boxes.find((box) => box.id === 'uw-floor-web')?.sizeMm[2], 100);
    assert.equal(narrow.boxes.find((box) => box.id === 'cw-0-web')?.sizeMm[2], 48.8);
    assert.notEqual(
      wide.boxes.filter((box) => box.id.endsWith('-web') && box.layer === 'cw').length,
      narrow.boxes.filter((box) => box.id.endsWith('-web') && box.layer === 'cw').length,
    );
  });

  it('stacks gypsum, OSB and different thicknesses without a joint layout', () => {
    const doubled = createWallDraft('project');
    doubled.name = 'Wand';
    doubled.lengthMm = 3000;
    doubled.heightMm = 2500;
    doubled.nominalDepthMm = 75;
    doubled.spacingMm = 625;
    doubled.sideA = {
      side: 'A',
      variant: 'double-gypsum',
      staggerJoints: true,
      layers: [
        { id: 'a1', catalogItemId: 'gk-12-5', format: format1250 },
        { id: 'a2', catalogItemId: 'board-gypsum-a-15', format: null },
      ],
    };
    doubled.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    const doubleGeometry = buildWallGeometry(wallFrom(doubled));
    assert.equal(area(boxes(doubleGeometry, 'board-A-a1')), 3000 * 2500);
    assert.equal(area(boxes(doubleGeometry, 'board-A-a2')), 3000 * 2500);
    assert.equal(doubleGeometry.boxes.find((box) => box.id.startsWith('board-A-a1'))?.sizeMm[2], 12.5);
    assert.equal(doubleGeometry.boxes.find((box) => box.id.startsWith('board-A-a2'))?.sizeMm[2], 15);
    assert.ok((doubleGeometry.boxes.find((box) => box.id.startsWith('board-A-a2'))?.centerMm[2] ?? 0) > (doubleGeometry.boxes.find((box) => box.id.startsWith('board-A-a1'))?.centerMm[2] ?? 0));
    assert.ok(doubleGeometry.notes.some((note) => note.id === 'no-joint-layout'));

    const mixed = createWallDraft('project');
    mixed.name = 'Wand';
    mixed.lengthMm = 3000;
    mixed.heightMm = 2500;
    mixed.nominalDepthMm = 50;
    mixed.spacingMm = 625;
    mixed.sideA = {
      side: 'A',
      variant: 'osb-gypsum',
      staggerJoints: false,
      layers: [
        { id: 'osb', catalogItemId: 'board-osb3-15', format: null },
        { id: 'gk', catalogItemId: 'gk-12-5', format: format1250 },
      ],
    };
    mixed.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    const osb = buildWallGeometry(wallFrom(mixed));
    assert.equal(osb.boxes.find((box) => box.id.startsWith('board-A-osb'))?.sizeMm[2], 15);
    assert.equal(osb.boxes.find((box) => box.id.startsWith('board-A-osb'))?.color, '#C4A574');
    assert.equal(osb.boxes.find((box) => box.id.startsWith('board-A-gk'))?.sizeMm[2], 12.5);
    assert.ok((osb.boxes.find((box) => box.id.startsWith('board-A-gk'))?.centerMm[2] ?? 0) > (osb.boxes.find((box) => box.id.startsWith('board-A-osb'))?.centerMm[2] ?? 0));
  });

  it('scales insulation and keeps it out of the profile overlap', () => {
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 75;
    draft.spacingMm = 625;
    draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    draft.insulationCatalogId = 'insulation-stone-board';
    draft.insulationThicknessMm = 60;
    const geometry = buildWallGeometry(wallFrom(draft));
    assert.ok(geometry.boxes.some((box) => box.layer === 'insulation' && box.sizeMm[2] === 60));
    const studs = geometry.boxes.filter((box) => box.layer === 'cw');
    const fill = geometry.boxes.filter((box) => box.layer === 'insulation');
    for (const stud of studs) {
      for (const piece of fill) {
        assert.equal(overlaps(stud, piece), false);
      }
    }
  });

  it('moves layers apart without changing the saved boxes or hidden layers', () => {
    const geometry = buildWallGeometry(base());
    const before = geometry.boxes.find((box) => box.id.startsWith('board-A-layer-a'));
    assert.ok(before);
    const exploded = displayBoxes(geometry, 'exploded', togglesFor('exploded', geometry));
    const moved = exploded.find((box) => box.id === before.id);
    assert.equal(moved?.sizeMm[2], before.sizeMm[2]);
    assert.notEqual(moved?.centerMm[2], before.centerMm[2]);
    assert.equal(geometry.boxes.find((box) => box.id === before.id)?.centerMm[2], before.centerMm[2]);
    const hidden = displayBoxes(geometry, 'complete', { ...togglesFor('complete', geometry), uw: false, sideA: false });
    assert.equal(hidden.some((box) => box.layer === 'uw' || box.layer === 'board-a'), false);
    assert.ok(hidden.some((box) => box.layer === 'cw'));
    assert.equal(geometry.boxes.some((box) => box.layer === 'uw'), true);
    const framing = displayBoxes(geometry, 'construction', togglesFor('construction', geometry));
    assert.equal(framing.some((box) => box.layer === 'board-a' || box.layer === 'board-b'), false);
    const layered = displayBoxes(geometry, 'layers', togglesFor('layers', geometry)).find((box) => box.id === before.id);
    assert.equal(layered?.sizeMm[0], before.sizeMm[0]);
    assert.notEqual(layered?.centerMm[2], before.centerMm[2]);
  });

  it('does not invent flanges when the catalog row is missing and follows edited studs', () => {
    const saved = base();
    saved.framing.uwCatalogId = 'uw-missing';
    saved.framing.cwCatalogId = 'cw-missing';
    saved.framing.studOffsetsMm = [0, 1000, 3000];
    const geometry = buildWallGeometry(saved);
    assert.equal(geometry.boxes.some((box) => box.id.includes('flange')), false);
    assert.ok(geometry.notes.some((note) => note.id === 'missing-uw-missing'));
    assert.equal(geometry.boxes.filter((box) => box.layer === 'cw' && box.id.endsWith('-web')).map((box) => box.centerMm[0])[1], 1000);
    saved.openings = [
      {
        id: 'a',
        kind: 'door',
        name: '',
        widthMm: 900,
        heightMm: 2000,
        offsetFromLeftMm: 0,
        executionStatus: 'not-assessed',
        executionRuleId: 'door-execution-missing',
        uaCatalogId: null,
        lintelCatalogId: null,
      },
      {
        id: 'b',
        kind: 'door',
        name: '',
        widthMm: 900,
        heightMm: 2000,
        offsetFromLeftMm: 400,
        executionStatus: 'not-assessed',
        executionRuleId: 'door-execution-missing',
        uaCatalogId: null,
        lintelCatalogId: null,
      },
    ];
    const blocked = buildWallGeometry(saved);
    assert.equal(blocked.boxes.some((box) => box.layer === 'board-a'), false);
    assert.ok(blocked.notes.some((note) => note.id === 'board-overlap'));
  });
});
