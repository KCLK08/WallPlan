import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { METAL_STUD_TEST_WALL } from '../construction/metalStudPartition';
import { studOffsetsMm } from './studLayout';

describe('studOffsetsMm', () => {
  it('places a stud at both ends and on the grid', () => {
    assert.deepEqual(studOffsetsMm(3000, 625), [0, 625, 1250, 1875, 2500, 3000]);
  });

  it('does not duplicate the end stud when the length is an exact multiple', () => {
    assert.deepEqual(studOffsetsMm(2500, 625), [0, 625, 1250, 1875, 2500]);
  });

  it('keeps the end stud when the spacing is longer than the wall', () => {
    assert.deepEqual(studOffsetsMm(400, 625), [0, 400]);
  });

  it('rejects invalid measures', () => {
    assert.throws(() => studOffsetsMm(0, 625));
    assert.throws(() => studOffsetsMm(3000, 0));
  });

  it('matches the fixed prototype wall', () => {
    const offsets = studOffsetsMm(METAL_STUD_TEST_WALL.lengthMm, METAL_STUD_TEST_WALL.studSpacingMm);
    assert.equal(offsets.length, 6);
    assert.equal(offsets[0], 0);
    assert.equal(offsets.at(-1), METAL_STUD_TEST_WALL.lengthMm);
  });
});
