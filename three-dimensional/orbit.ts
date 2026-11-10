export type OrbitCamera = {
  theta: number;
  phi: number;
  radius: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  minRadius?: number;
  maxRadius?: number;
  frameRadius?: number;
};

const MIN_PHI = 0.18;
const MAX_PHI = Math.PI - 0.18;
const MIN_RADIUS = 1.4;
const MAX_RADIUS = 12;

export function createInitialCamera(lengthM: number, heightM: number): OrbitCamera {
  return {
    theta: 0.62,
    phi: 1.18,
    radius: Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, Math.max(lengthM, heightM) * 1.35)),
    targetX: lengthM / 2,
    targetY: heightM * 0.46,
    targetZ: 0,
  };
}

export function orbitPosition(camera: OrbitCamera): [number, number, number] {
  const sinPhi = Math.sin(camera.phi);
  return [
    camera.targetX + camera.radius * sinPhi * Math.sin(camera.theta),
    camera.targetY + camera.radius * Math.cos(camera.phi),
    camera.targetZ + camera.radius * sinPhi * Math.cos(camera.theta),
  ];
}

export function rotateOrbit(camera: OrbitCamera, deltaX: number, deltaY: number): void {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    return;
  }
  camera.theta -= deltaX * 0.008;
  const nextPhi = camera.phi - deltaY * 0.008;
  camera.phi = Math.min(MAX_PHI, Math.max(MIN_PHI, nextPhi));
}

export function panOrbit(camera: OrbitCamera, deltaX: number, deltaY: number): void {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    return;
  }
  const { right, up } = cameraBasis(camera.theta, camera.phi);
  const scale = camera.radius * 0.0016;
  camera.targetX -= (right.x * deltaX + up.x * deltaY) * scale;
  camera.targetY -= (right.y * deltaX + up.y * deltaY) * scale;
  camera.targetZ -= (right.z * deltaX + up.z * deltaY) * scale;
}

export function frameWallCamera(lengthM: number, heightM: number, depthM: number): OrbitCamera {
  const span = Math.max(lengthM, heightM, depthM, 0.4);
  const radius = span * 1.7;
  return {
    theta: 0.62,
    phi: 1.18,
    radius,
    targetX: lengthM / 2,
    targetY: heightM * 0.46,
    targetZ: 0,
    minRadius: Math.max(0.35, span * 0.28),
    maxRadius: Math.max(MAX_RADIUS, span * 8),
    frameRadius: radius,
  };
}

export function zoomOrbit(camera: OrbitCamera, factor: number): void {
  if (!Number.isFinite(factor) || factor <= 0) {
    return;
  }
  const next = camera.radius * factor;
  camera.radius = Math.min(camera.maxRadius ?? MAX_RADIUS, Math.max(camera.minRadius ?? MIN_RADIUS, next));
}

function cameraBasis(theta: number, phi: number): {
  right: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
} {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const forward = {
    x: -sinPhi * sinTheta,
    y: -cosPhi,
    z: -sinPhi * cosTheta,
  };
  const right = { x: -forward.z, y: 0, z: forward.x };
  const rightLength = Math.hypot(right.x, right.z) || 1;
  right.x /= rightLength;
  right.z /= rightLength;
  const up = {
    x: right.y * forward.z - right.z * forward.y,
    y: right.z * forward.x - right.x * forward.z,
    z: right.x * forward.y - right.y * forward.x,
  };
  return { right, up };
}
