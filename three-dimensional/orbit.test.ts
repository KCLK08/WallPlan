import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { orbitPosition, rotateOrbit, zoomOrbit, type OrbitCamera } from './orbit';

function camera(overrides: Partial<OrbitCamera> = {}): OrbitCamera {
  return {
    theta: 0,
    phi: Math.PI / 2,
    radius: 4,
    targetX: 1,
    targetY: 2,
    targetZ: 0,
    ...overrides,
  };
}

describe('orbit', () => {
  it('places the camera on +Z when looking straight at the target', () => {
    const [x, y, z] = orbitPosition(camera());
    assert.ok(Math.abs(x - 1) < 1e-9);
    assert.ok(Math.abs(y - 2) < 1e-9);
    assert.ok(Math.abs(z - 4) < 1e-9);
  });

  it('keeps the pitch inside the orbit range', () => {
    const view = camera({ phi: 0.2 });
    rotateOrbit(view, 0, 1000);
    assert.ok(view.phi >= 0.18);
    assert.ok(view.phi < Math.PI);
  });

  it('clamps zoom', () => {
    const view = camera({ radius: 2 });
    zoomOrbit(view, 0.01);
    assert.equal(view.radius, 1.4);
    zoomOrbit(view, 100);
    assert.equal(view.radius, 12);
  });
});
