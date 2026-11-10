import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { OrthographicCamera } from 'three';

import type { OrbitCamera } from './orbit';
import { orbitPosition } from './orbit';
import { buildSceneGroup, disposeSceneGroup } from './geometry/buildSceneGroup';
import type { SceneBox } from './geometry/types';
import { useFrame, useThree } from './wallFiber';

type SavedWallSceneProps = {
  boxes: readonly SceneBox[];
  cameraRef: RefObject<OrbitCamera>;
  lengthMm: number;
  heightMm: number;
  orthographic: boolean;
};

export function SavedWallScene({ boxes, cameraRef, lengthMm, heightMm, orthographic }: SavedWallSceneProps) {
  const group = useMemo(() => buildSceneGroup(boxes), [boxes]);
  const { camera, size } = useThree();

  useEffect(() => () => disposeSceneGroup(group), [group]);

  useFrame(() => {
    const view = cameraRef.current;
    const [x, y, z] = orbitPosition(view);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return;
    }
    camera.position.set(x, y, z);
    camera.lookAt(view.targetX, view.targetY, view.targetZ);
    if (orthographic && camera instanceof OrthographicCamera) {
      const span = (Math.max(lengthMm, heightMm) / 1000) * 1.35;
      const fitted = Math.min(size.width, size.height) / Math.max(span, 0.2);
      const frame = view.frameRadius ?? view.radius;
      camera.zoom = fitted * (frame / Math.max(view.radius, 0.2));
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <color attach="background" args={['#1c1f24']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 7, 5]} intensity={1.15} />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} />
      <primitive object={group} />
    </>
  );
}
