import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assessCompatibility } from '@/catalog/compatibility';

import type { WallDraft } from './wallModel';
import {
  compileWall,
  constructionTypeChoices,
  createWallDraft,
  draftFromWall,
  fibreSpacingLimitMm,
  parseLengthInput,
  parseSavedWall,
  profileChoices,
  replaceOpening,
  setLayerBoard,
  setLayerFormat,
  spacingChoices,
  spacingRejection,
  studPositions,
  thicknessChoices,
  validateOpening,
  withVariant,
} from './wallRules';

const format1250 = { widthMm: 1250, lengthMm: 2500 };

function readyDraft(): WallDraft {
  const draft = createWallDraft('project-1', '2026-11-10T12:00:00.000Z');
  draft.id = 'wall-1';
  draft.name = ' Trennwand Wohnzimmer ';
  draft.description = ' Flur ';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA = {
    side: 'A',
    variant: 'single-gypsum',
    staggerJoints: false,
    layers: [{ id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 }],
  };
  draft.sideB = {
    side: 'B',
    variant: 'double-gypsum',
    staggerJoints: true,
    layers: [
      { id: 'layer-b1', catalogItemId: 'gk-12-5', format: format1250 },
      { id: 'layer-b2', catalogItemId: 'board-gypsum-h2-12-5', format: { widthMm: 1250, lengthMm: 2000 } },
    ],
  };
  return draft;
}

describe('wall measures', () => {
  it('accepts millimetres, centimetres and metres and rejects bad input', () => {
    assert.deepEqual(parseLengthInput('2500', 'mm'), { ok: true, mm: 2500 });
    assert.deepEqual(parseLengthInput(' 2,5 ', 'm'), { ok: true, mm: 2500 });
    assert.deepEqual(parseLengthInput('250', 'cm'), { ok: true, mm: 2500 });
    assert.equal(parseLengthInput('', 'mm').ok, false);
    assert.equal(parseLengthInput('abc', 'mm').ok, false);
    assert.equal(parseLengthInput('-20', 'mm').ok, false);
    assert.equal(parseLengthInput('0', 'mm').ok, false);
    assert.equal(parseLengthInput('50', 'mm').ok, true);
    const tooSmall = compileWall({ ...readyDraft(), lengthMm: 50 });
    assert.equal(tooSmall.ok, false);
    if (!tooSmall.ok) {
      assert.equal(tooSmall.issues.some((issue) => issue.code === 'length'), true);
    }
    const tooBig = compileWall({ ...readyDraft(), heightMm: 9000 });
    assert.equal(tooBig.ok, false);
  });

  it('places studs on the selected grid, including both ends', () => {
    assert.deepEqual(spacingChoices().map((choice) => choice.spacingMm), [312.5, 417, 625]);
    assert.equal(spacingChoices()[0]?.status, 'not-assessed');
    assert.deepEqual(studPositions(3000, 625), [0, 625, 1250, 1875, 2500, 3000]);
    assert.deepEqual(studPositions(1000, 312.5), [0, 312.5, 625, 937.5, 1000]);
  });
});

describe('wall profiles and cladding', () => {
  it('offers only matching UW and CW widths from the catalog', () => {
    const choices = profileChoices();
    assert.deepEqual(
      choices.map((choice) => choice.nominalDepthMm),
      [50, 75, 100, 125, 150],
    );
    assert.equal(choices.every((choice) => choice.status === 'compatible'), true);
    assert.equal(assessCompatibility('cw-75', 'uw-50').status, 'incompatible');
  });

  it('stores single, double and OSB layers with stable ids', () => {
    const draft = readyDraft();
    draft.sideA = withVariant(draft.sideA, 'osb-gypsum');
    draft.sideA = setLayerBoard(draft.sideA, draft.sideA.layers[0].id, 'board-osb3-15');
    draft.sideA = setLayerBoard(draft.sideA, draft.sideA.layers[1].id, 'gk-12-5');
    draft.sideA = setLayerFormat(draft.sideA, draft.sideA.layers[1].id, format1250);
    const firstLayerId = draft.sideA.layers[0].id;
    const secondLayerId = draft.sideA.layers[1].id;
    const compiled = compileWall(draft);
    assert.equal(compiled.ok, true);
    if (!compiled.ok) {
      return;
    }
    const sideA = compiled.wall.sides.A;
    const sideB = compiled.wall.sides.B;
    assert.equal(sideA.layers[0]?.catalogItemId, 'board-osb3-15');
    assert.equal(sideA.layers[1]?.catalogItemId, 'gk-12-5');
    assert.equal(sideA.layers[0]?.id, firstLayerId);
    assert.equal(sideA.layers[1]?.id, secondLayerId);
    assert.notEqual(sideA.layers[0]?.id, sideA.layers[1]?.id);
    assert.equal(sideA.layers[0]?.fastening.catalogItemId, null);
    assert.equal(sideA.layers[0]?.fastening.offered, false);
    assert.equal(sideA.layers[0]?.fastening.status, 'not-assessed');
    assert.equal(sideA.layers[1]?.fastening.status, 'not-assessed');
    assert.equal(sideA.pairStatus, 'conditional');
    assert.equal(sideB.variant, 'double-gypsum');
    assert.equal(sideB.staggerJoints, true);
    assert.equal(sideB.layers.length, 2);
    assert.notEqual(sideB.layers[0]?.id, sideB.layers[1]?.id);
    assert.notEqual(sideA.layers[0]?.id, sideB.layers[0]?.id);
    assert.equal(compiled.wall.systemStatus, 'not-assessed');

    const edited = draftFromWall(compiled.wall, draft.projectId, draft.id, draft.createdAt);
    edited.sideA = setLayerBoard(edited.sideA, firstLayerId, 'board-osb3-12');
    const again = compileWall(edited);
    assert.equal(again.ok, true);
    if (!again.ok) {
      return;
    }
    assert.equal(again.wall.sides.A.layers[0]?.id, firstLayerId);
    assert.equal(again.wall.sides.A.layers[0]?.catalogItemId, 'board-osb3-12');
  });

  it('keeps the construction identity outside the payload and restores it', () => {
    const compiled = compileWall(readyDraft());
    assert.equal(compiled.ok, true);
    if (!compiled.ok) {
      return;
    }
    const raw = JSON.stringify(compiled.wall);
    const restored = parseSavedWall(raw);
    assert.ok(restored);
    assert.equal(restored?.name, 'Trennwand Wohnzimmer');
    assert.equal(restored?.description, 'Flur');
    assert.deepEqual(restored?.framing.studOffsetsMm, compiled.wall.framing.studOffsetsMm);
    const reopened = draftFromWall(restored!, 'project-1', 'wall-1', '2026-11-10T12:00:00.000Z');
    reopened.name = 'Trennwand Diele';
    const saved = compileWall(reopened);
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    assert.equal(reopened.id, 'wall-1');
    assert.equal(saved.wall.sides.A.layers[0]?.id, 'layer-a');
  });
});

describe('insulation and openings', () => {
  it('distinguishes cavity fit from a missing system approval', () => {
    assert.equal(thicknessChoices('insulation-stone-board', 50).find((entry) => entry.thicknessMm === 40)?.fits, true);
    assert.equal(thicknessChoices('insulation-stone-board', 50).find((entry) => entry.thicknessMm === 80)?.fits, false);
    const draft = readyDraft();
    draft.nominalDepthMm = 50;
    draft.insulationCatalogId = 'insulation-stone-board';
    draft.insulationThicknessMm = 40;
    const fitted = compileWall(draft);
    assert.equal(fitted.ok, true);
    if (!fitted.ok) {
      return;
    }
    assert.equal(fitted.wall.insulation.enabled, true);
    assert.equal(fitted.wall.insulation.geometricStatus, 'conditional');
    assert.equal(fitted.wall.insulation.systemStatus, 'not-assessed');
    assert.equal(fitted.wall.insulation.format?.widthMm, 625);

    draft.insulationThicknessMm = 80;
    const thick = compileWall(draft);
    assert.equal(thick.ok, false);
    if (!thick.ok) {
      assert.equal(thick.issues.some((issue) => issue.code === 'insulation-fit'), true);
    }
    draft.insulationCatalogId = null;
    draft.insulationThicknessMm = null;
    const removed = compileWall(draft);
    assert.equal(removed.ok, true);
    if (removed.ok) {
      assert.equal(removed.wall.insulation.enabled, false);
    }
  });

  it('keeps a door inside the wall and rejects overlaps', () => {
    const wall = { lengthMm: 3000, heightMm: 2500 };
    const door = { id: 'door-1', name: 'Wohnzimmer', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 400 };
    assert.equal(validateOpening(door, wall, []), null);
    assert.equal(validateOpening({ ...door, offsetFromLeftMm: -10 }, wall, []), 'negative');
    assert.equal(validateOpening({ ...door, widthMm: 0 }, wall, []), 'not-positive');
    assert.equal(validateOpening({ ...door, widthMm: 100 }, wall, []), 'implausible');
    assert.equal(validateOpening({ ...door, offsetFromLeftMm: 2500 }, wall, []), 'outside');
    assert.equal(validateOpening({ ...door, heightMm: 2600 }, wall, []), 'outside');
    const other = { id: 'door-2', name: '', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 1000 };
    assert.equal(validateOpening(other, wall, [door]), 'overlap');
    assert.equal(validateOpening({ ...other, offsetFromLeftMm: 1285 }, wall, [door]), null);

    const draft = readyDraft();
    draft.openings = [door];
    const compiled = compileWall(draft);
    assert.equal(compiled.ok, true);
    if (!compiled.ok) {
      return;
    }
    assert.equal(compiled.wall.openings[0]?.id, 'door-1');
    assert.equal(compiled.wall.openings[0]?.executionStatus, 'not-assessed');
    assert.equal(compiled.wall.openings[0]?.uaCatalogId, 'ua-75');
    assert.equal(compiled.wall.openings[0]?.lintelCatalogId, 'lintel-75');
    const edited = replaceOpening(draft.openings, { ...door, widthMm: 900 });
    assert.equal(edited[0]?.id, 'door-1');
    assert.equal(edited[0]?.widthMm, 900);
    assert.equal(edited.length, 1);
  });
});

describe('catalog limits used by the configurator', () => {
  it('applies the stored fibre spacing rule only where the catalog states it', () => {
    assert.equal(fibreSpacingLimitMm('board-fibre-12-5'), 625);
    assert.equal(fibreSpacingLimitMm('board-fibre-10'), null);
    assert.equal(fibreSpacingLimitMm('gk-12-5'), null);
    assert.deepEqual(spacingRejection(626, ['board-fibre-12-5']), { boardId: 'board-fibre-12-5', maxMm: 625 });
    assert.equal(spacingRejection(625, ['board-fibre-12-5']), null);
    assert.equal(spacingRejection(625, ['gk-12-5']), null);
  });

  it('enables only the metal stud partition', () => {
    const choices = constructionTypeChoices();
    assert.equal(choices.find((choice) => choice.kind === 'metal-stud-partition')?.available, true);
    assert.equal(choices.find((choice) => choice.kind === 'double-stud-partition')?.available, false);
    assert.equal(choices.find((choice) => choice.kind === 'double-stud-partition')?.reason, 'no-stored-rules');
    assert.equal(choices.filter((choice) => choice.available).length, 1);
  });
});
