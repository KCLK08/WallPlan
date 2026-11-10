import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OSB_PLUS_GYPSUM_SIDE_A } from './cladding';
import { assessCompatibility, fastenersFor } from './compatibility';
import { MATERIALS, findMaterial } from './materials';
import { relevantMaterials } from './query';
import { validateCatalog } from './validate';
import { CATALOG_VERSION } from './version';

describe('material catalog', () => {
  it('validates unique ids, categories, sources and version', () => {
    assert.deepEqual(validateCatalog(), []);
    assert.equal(CATALOG_VERSION, '3.0.0');
    assert.ok(MATERIALS.length > 40);
  });

  it('keeps the prototype ids and does not store prices', () => {
    assert.equal(findMaterial('uw-75')?.nameDe, 'UW-Profil 75');
    assert.equal(findMaterial('cw-75')?.profile?.nominalDepthMm, 75);
    assert.equal(findMaterial('gk-12-5')?.thicknessMm, 12.5);
    assert.equal(JSON.stringify(MATERIALS).includes('€'), false);
  });

  it('pairs CW and UW only at the same nominal width', () => {
    assert.equal(assessCompatibility('cw-75', 'uw-75').status, 'compatible');
    assert.equal(assessCompatibility('cw-50', 'uw-75').status, 'incompatible');
    assert.equal(assessCompatibility('lintel-75', 'ua-75').status, 'compatible');
    assert.equal(assessCompatibility('cd-60-27', 'cw-75').status, 'incompatible');
  });

  it('does not treat ceiling hangers as wall fixings', () => {
    assert.equal(assessCompatibility('hanger-u-direct-cd', 'cd-60-27').status, 'compatible');
    assert.equal(assessCompatibility('hanger-quick-anchor', 'cw-75').status, 'incompatible');
    assert.equal(assessCompatibility('sealing-acrylic-unknown', 'gk-12-5').status, 'not-assessed');
  });

  it('keeps OSB and gypsum as separate layers with separate screws', () => {
    const ids = OSB_PLUS_GYPSUM_SIDE_A.layers.map((layer) => layer.catalogItemId);
    assert.deepEqual(ids, ['board-osb3-15', 'gk-12-5']);
    assert.equal(new Set(ids).size, 2);
    assert.equal(assessCompatibility('board-osb3-15', 'gk-12-5').status, 'conditional');
    assert.equal(assessCompatibility('fastener-tn-fine', 'board-osb3-15').status, 'incompatible');
    assert.equal(assessCompatibility('fastener-tn-fine', 'gk-12-5').status, 'conditional');
    assert.equal(assessCompatibility('fastener-tn-coarse', 'cw-75').status, 'incompatible');
    assert.equal(assessCompatibility('fastener-tb-drill', 'ua-50').status, 'compatible');
    const osbScrews = fastenersFor('osb-on-metal');
    assert.equal(osbScrews.some((entry) => entry.status === 'compatible'), false);
    const gypsumScrews = fastenersFor('gypsum-on-thin-metal');
    assert.equal(gypsumScrews.find((entry) => entry.id === 'fastener-tn-fine')?.status, 'compatible');
  });

  it('offers only the matching profile depth and leaves unknown values empty', () => {
    const profiles = relevantMaterials({
      construction: 'metal-stud-partition',
      category: 'metal-profiles',
      nominalDepthMm: 75,
    }).map((item) => item.id);
    assert.ok(profiles.includes('uw-75'));
    assert.ok(profiles.includes('cw-75'));
    assert.equal(profiles.includes('uw-50'), false);
    assert.equal(profiles.includes('cd-60-27'), false);
    const glass = findMaterial('insulation-glass-unknown');
    assert.equal(glass?.insulation?.lambdaWmK, undefined);
    assert.equal(glass?.suitableFor.length, 0);
    assert.equal(findMaterial('board-cement-unknown')?.thicknessMm, undefined);
  });

  it('is a shipped dataset, not a network catalog', () => {
    assert.equal(MATERIALS.every((item) => item.catalogVersion === CATALOG_VERSION), true);
    assert.equal(findMaterial('insulation-stone-board')?.insulation?.lambdaWmK, 0.04);
  });
});
