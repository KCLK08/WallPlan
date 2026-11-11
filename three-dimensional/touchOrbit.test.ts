import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitialCamera } from './orbit';
import { applyTouchSample, consumeTap, createTouchMemory } from './touchOrbit';

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

  it('keeps a short press as a tap and does not rotate', () => {
    const camera = createInitialCamera(3, 2.5);
    const before = camera.theta;
    const memory = createTouchMemory();
    applyTouchSample(camera, memory, [{ x: 10, y: 10 }], false);
    applyTouchSample(camera, memory, [{ x: 14, y: 12 }], false);
    assert.equal(camera.theta, before);
    assert.deepEqual(consumeTap(memory), { x: 10, y: 10 });
  });

  it('does not treat a drag or a pinch as a tap', () => {
    const drag = createInitialCamera(3, 2.5);
    const dragMemory = createTouchMemory();
    applyTouchSample(drag, dragMemory, [{ x: 10, y: 10 }], false);
    applyTouchSample(drag, dragMemory, [{ x: 40, y: 10 }], false);
    assert.equal(consumeTap(dragMemory), null);

    const pinch = createInitialCamera(3, 2.5);
    const pinchMemory = createTouchMemory();
    applyTouchSample(pinch, pinchMemory, [{ x: 0, y: 0 }, { x: 40, y: 0 }], false);
    applyTouchSample(pinch, pinchMemory, [{ x: 0, y: 0 }, { x: 80, y: 0 }], false);
    assert.equal(consumeTap(pinchMemory), null);
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