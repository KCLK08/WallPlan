import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitialCamera } from './orbit';
import { applyTouchSample, createTouchMemory } from './touchOrbit';

describe('applyTouchSample', () => {
  it('ignores the first sample and rotates on the next one-finger move', () => {
    const camera = createInitialCamera(3, 2.5);
    const before = camera.theta;
    const memory = createTouchMemory();
    applyTouchSample(camera, memory, [{ x: 10, y: 10 }], false);
    assert.equal(camera.theta, before);
    applyTouchSample(camera, memory, [{ x: 40, y: 10 }], false);
    assert.ok(camera.theta < before);
  });

  it('zooms in when two fingers move apart and keeps a finite radius', () => {
    const camera = createInitialCamera(3, 2.5);
    const before = camera.radius;
    const memory = createTouchMemory();
    applyTouchSample(camera, memory, [{ x: 0, y: 0 }, { x: 40, y: 0 }], false);
    applyTouchSample(camera, memory, [{ x: 0, y: 0 }, { x: 80, y: 0 }], false);
    assert.ok(camera.radius < before);
    assert.ok(Number.isFinite(camera.radius));
  });

  it('does not poison the camera when a coordinate is missing', () => {
    const camera = createInitialCamera(3, 2.5);
    const memory = createTouchMemory();
    applyTouchSample(camera, memory, [{ x: Number.NaN, y: 10 }], false);
    applyTouchSample(camera, memory, [{ x: 20, y: 10 }], false);
    assert.ok(Number.isFinite(camera.theta));
    assert.ok(Number.isFinite(camera.phi));
    assert.ok(Number.isFinite(camera.radius));
  });
});