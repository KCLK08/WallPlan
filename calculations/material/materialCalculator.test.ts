import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { studOffsetsMm } from '@/calculations/studLayout';
import type { SavedWall, WallDraft } from '@/construction/wallModel';
import { compileWall, createWallDraft } from '@/construction/wallRules';

import { calculateMaterials } from './materialCalculator';
import type { MaterialLine } from './types';

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

function line(result: ReturnType<typeof calculateMaterials>, id: string): MaterialLine {
  const found = result.lines.find((entry) => entry.id === id);
  assert.ok(found, id);
  return found!;
}

describe('material calculation', () => {
  it('counts tracks and end studs for a wall without a door', () => {
    const result = calculateMaterials(base(), { generatedAt: '2026-11-10T12:00:00.000Z', sourceUpdatedAt: '2026-11-10T11:00:00.000Z' });
    assert.equal(result.calculationVersion, 1);
    assert.equal(result.sourceUpdatedAt, '2026-11-10T11:00:00.000Z');
    assert.equal(line(result, 'uw-floor').theoretical, 3);
    assert.equal(line(result, 'uw-floor').planning, null);
    assert.equal(line(result, 'uw-floor').status, 'calculable');
    assert.equal(line(result, 'uw-ceiling').theoretical, 3);
    assert.equal(line(result, 'uw-left').theoretical, 2.5);
    assert.equal(line(result, 'uw-right').theoretical, 2.5);
    const studs = line(result, 'cw-studs');
    assert.equal(studs.theoretical, 6 * 2.5);
    assert.equal(studs.status, 'conditional');
    assert.match(studs.basisDe, /6 gespeicherte Positionen/);
    assert.match(studs.warningsDe.join(' '), /keine technische Systemfreigabe/);
    assert.equal(result.lines.some((entry) => entry.id.startsWith('door-')), false);
  });

  it('changes stud metres when length or spacing changes', () => {
    const short = calculateMaterials(base({ lengthMm: 1000 }));
    const wide = calculateMaterials(base({ lengthMm: 4000, spacingMm: 417 }));
    assert.equal(line(short, 'cw-studs').theoretical, studOffsetsMm(1000, 625).length * 2.5);
    assert.equal(line(wide, 'uw-floor').theoretical, 4);
    assert.equal(line(wide, 'cw-studs').theoretical, studOffsetsMm(4000, 417).length * 2.5);
    assert.notEqual(line(short, 'cw-studs').theoretical, line(wide, 'cw-studs').theoretical);
  });

  it('deducts one door and leaves the door profiles incomplete', () => {
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 75;
    draft.spacingMm = 625;
    draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'board-gypsum-h2-12-5', format: { widthMm: 1250, lengthMm: 2000 } };
    draft.openings = [{ id: 'door-1', name: 'Wohnzimmer', widthMm: 885, heightMm: 2010, offsetFromLeftMm: 400 }];
    const result = calculateMaterials(wallFrom(draft));
    const net = (3000 * 2500 - 885 * 2010) / 1_000_000;
    assert.equal(line(result, 'side-A-layer-a-area').theoretical, net);
    assert.equal(line(result, 'side-B-layer-b-area').theoretical, net);
    assert.notEqual(line(result, 'side-A-layer-a-area').catalogItemId, line(result, 'side-B-layer-b-area').catalogItemId);
    assert.equal(line(result, 'uw-floor').status, 'conditional');
    const ua = line(result, 'door-door-1-ua');
    const lintel = line(result, 'door-door-1-lintel');
    assert.equal(ua.status, 'incomplete');
    assert.equal(ua.theoretical, null);
    assert.equal(ua.catalogItemId, 'ua-75');
    assert.equal(lintel.theoretical, null);
    assert.equal(lintel.catalogItemId, 'lintel-75');
    assert.equal(line(result, 'door-door-1-fixing').theoretical, null);
  });

  it('keeps two door openings separate and subtracts both areas', () => {
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
    const result = calculateMaterials(wallFrom(draft));
    const net = (4000 * 2600 - 2 * 885 * 2010) / 1_000_000;
    assert.equal(line(result, 'side-A-layer-a-area').theoretical, net);
    assert.equal(line(result, 'door-d1-ua').catalogItemId, 'ua-100');
    assert.equal(line(result, 'door-d2-lintel').theoretical, null);
    assert.equal(line(result, 'cw-studs').theoretical, studOffsetsMm(4000, 312.5).length * 2.6);
  });

  it('calculates both gypsum layers and does not claim a joint offset', () => {
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 75;
    draft.spacingMm = 625;
    draft.sideA = {
      side: 'A',
      variant: 'double-gypsum',
      staggerJoints: true,
      layers: [
        { id: 'a1', catalogItemId: 'gk-12-5', format: format1250 },
        { id: 'a2', catalogItemId: 'gk-12-5', format: format1250 },
      ],
    };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    const saved = wallFrom(draft);
    saved.sides.B.layers[0].format = null;
    const result = calculateMaterials(saved);
    const area = (3000 * 2500) / 1_000_000;
    assert.equal(line(result, 'side-A-a1-area').theoretical, area);
    assert.equal(line(result, 'side-A-a2-area').theoretical, area);
    assert.equal(line(result, 'side-A-sum').theoretical, area * 2);
    assert.match(line(result, 'side-A-sum').warningsDe.join(' '), /Fugenversetzung/);
    const pieces = line(result, 'side-A-a1-pieces');
    assert.equal(pieces.status, 'conditional');
    assert.equal(pieces.theoretical, area / ((1250 * 2500) / 1_000_000));
    assert.equal(pieces.planning, Math.ceil(pieces.theoretical! - 1e-9));
    assert.match(pieces.assumptionsDe.join(' '), /kein Verschnitt/i);
    assert.equal(line(result, 'side-B-layer-b-pieces').status, 'incomplete');
    assert.equal(line(result, 'side-B-layer-b-pieces').theoretical, null);
    assert.equal(line(result, 'side-B-layer-b-area').theoretical, area);
  });

  it('keeps OSB and gypsum areas apart and invents no screw quantity', () => {
    const draft = createWallDraft('project');
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
    const result = calculateMaterials(wallFrom(draft));
    assert.equal(line(result, 'side-A-osb-area').catalogItemId, 'board-osb3-15');
    assert.equal(line(result, 'side-A-gk-area').catalogItemId, 'gk-12-5');
    assert.equal(line(result, 'side-A-osb-area').status, 'conditional');
    assert.match(line(result, 'side-A-osb-area').warningsDe.join(' '), /OSB auf Metall/);
    assert.equal(line(result, 'side-A-osb-pieces').theoretical, null);
    const screws = result.lines.filter((entry) => entry.group === 'fasteners');
    assert.ok(screws.length > 0);
    assert.ok(screws.every((entry) => entry.theoretical === null && entry.planning === null && entry.status === 'incomplete'));
    assert.equal(line(result, 'fastener-A-osb').catalogItemId, null);
  });

  it('scales insulation volume with thickness and skips it when omitted', () => {
    const none = calculateMaterials(base());
    assert.equal(line(none, 'insulation-none').status, 'not-applicable');
    assert.equal(line(none, 'insulation-none').theoretical, null);
    const draft = createWallDraft('project');
    draft.name = 'Wand';
    draft.lengthMm = 3000;
    draft.heightMm = 2500;
    draft.nominalDepthMm = 75;
    draft.spacingMm = 625;
    draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: format1250 };
    draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: format1250 };
    draft.insulationCatalogId = 'insulation-stone-board';
    draft.insulationThicknessMm = 40;
    const thin = calculateMaterials(wallFrom(draft));
    draft.insulationThicknessMm = 60;
    const thick = calculateMaterials(wallFrom(draft));
    const area = (3000 * 2500) / 1_000_000;
    assert.equal(line(thin, 'insulation-area').theoretical, area);
    assert.equal(line(thin, 'insulation-volume').theoretical, area * 0.04);
    assert.equal(line(thick, 'insulation-volume').theoretical, area * 0.06);
    assert.equal(line(thin, 'insulation-volume').status, 'conditional');
    assert.match(line(thin, 'insulation-volume').warningsDe.join(' '), /Kein U-Wert/);
    assert.equal(line(thin, 'insulation-pieces').unit, 'piece');
    assert.ok((line(thin, 'insulation-pieces').theoretical ?? 0) > 0);
  });

  it('refuses quantities when the catalog row or the opening geometry is missing', () => {
    const saved = base();
    saved.framing.cwCatalogId = 'cw-missing';
    saved.insulation = {
      enabled: true,
      catalogItemId: 'insulation-stone-board',
      thicknessMm: 40,
      format: { widthMm: 625, lengthMm: 1200 },
      geometricStatus: 'conditional',
      geometricRuleId: 'assumption-cavity',
      systemStatus: 'not-assessed',
    };
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
    const result = calculateMaterials(saved);
    assert.equal(line(result, 'cw-studs').theoretical, null);
    assert.equal(line(result, 'cw-studs').status, 'incomplete');
    assert.equal(line(result, 'side-A-overlap').status, 'incomplete');
    assert.equal(line(result, 'side-A-overlap').theoretical, null);
    assert.equal(line(result, 'door-a-ua').catalogItemId, null);
    assert.equal(line(result, 'door-a-ua').theoretical, null);
    assert.equal(line(result, 'insulation-incomplete').status, 'incomplete');
  });

  it('does not invent prices, waste or fastener counts', () => {
    const result = calculateMaterials(base());
    for (const entry of result.lines) {
      assert.equal('price' in entry, false);
      assert.ok(!entry.assumptionsDe.some((assumption) => /prozent|verschnittreserve/i.test(assumption)));
    }
    assert.ok(result.lines.filter((entry) => entry.group === 'fasteners').every((entry) => entry.theoretical === null));
    assert.equal(line(result, 'track-fixing').theoretical, null);
    assert.equal(line(result, 'uw-floor').planning, null);
  });
});
