import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { OrthographicCamera } from 'three';

import type { OrbitCamera } from './orbit';
import { orbitPosition } from './orbit';
import { buildSceneGroup, disposeSceneGroup } from './geometry/buildSceneGroup';
import type { SceneBox } from './geometry/types';
import { buildOverlay, disposeOverlay } from './inspection/overlayGroup';
import type { MeasureLine } from './inspection/inspectionTypes';
import { orthographicZoom } from './inspection/viewCamera';
import { useFrame, useThree } from './wallFiber';

type SavedWallSceneProps = {
  boxes: readonly SceneBox[];
  selected: readonly SceneBox[];
  measures: readonly MeasureLine[];
  cameraRef: RefObject<OrbitCamera>;
  lengthMm: number;
  heightMm: number;
  orthographic: boolean;
};

export function SavedWallScene({ boxes, selected, measures, cameraRef, lengthMm, heightMm, orthographic }: SavedWallSceneProps) {
  const group = useMemo(() => buildSceneGroup(boxes), [boxes]);
  const overlay = useMemo(() => buildOverlay(selected, measures), [selected, measures]);
  const { camera, size } = useThree();

  useEffect(() => () => disposeSceneGroup(group), [group]);
  useEffect(() => () => disposeOverlay(overlay), [overlay]);

  useFrame(() => {
    const view = cameraRef.current;
    const [x, y, z] = orbitPosition(view);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return;
    }
    camera.position.set(x, y, z);
    camera.lookAt(view.targetX, view.targetY, view.targetZ);
    if (orthographic && camera instanceof OrthographicCamera) {
      camera.zoom = orthographicZoom(lengthMm, heightMm, size.width, size.height, view.radius, view.frameRadius ?? view.radius);
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
      <primitive object={overlay} />
    </>
  );
}
