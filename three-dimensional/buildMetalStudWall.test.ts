import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Mesh } from 'three';

import { buildMetalStudWall } from './buildMetalStudWall';

describe('buildMetalStudWall', () => {
  it('builds two tracks, six studs and one gypsum board', () => {
    const wall = buildMetalStudWall();
    assert.ok(wall.getObjectByName('uw-bottom'));
    assert.ok(wall.getObjectByName('uw-top'));
    assert.ok(wall.getObjectByName('gypsum-board'));
    for (let index = 0; index < 6; index += 1) {
      assert.ok(wall.getObjectByName(`cw-${index}`), `missing stud ${index}`);
    }

    let meshes = 0;
    wall.traverse((object) => {
      if (object instanceof Mesh) {
        meshes += 1;
      }
    });
    assert.equal(meshes, 25);
  });
});