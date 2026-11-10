import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { GridHelper } from 'three';

import { METAL_STUD_TEST_WALL } from '@/construction/metalStudPartition';

import { buildMetalStudWall } from './buildMetalStudWall';
import type { OrbitCamera } from './orbit';
import { orbitPosition } from './orbit';
import { useFrame, useThree } from './wallFiber';

type WallSceneProps = {
  showBoard: boolean;
  cameraRef: RefObject<OrbitCamera>;
};

export function WallScene({ showBoard, cameraRef }: WallSceneProps) {
  const wall = useMemo(() => buildMetalStudWall(METAL_STUD_TEST_WALL), []);
  const grid = useMemo(() => new GridHelper(6, 12, '#4a5160', '#2c313a'), []);
  const { camera } = useThree();

  useEffect(() => {
    const board = wall.getObjectByName('gypsum-board');
    if (board) {
      board.visible = showBoard;
    }
  }, [showBoard, wall]);

  useFrame(() => {
    const [x, y, z] = orbitPosition(cameraRef.current);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return;
    }
    camera.position.set(x, y, z);
    camera.lookAt(cameraRef.current.targetX, cameraRef.current.targetY, cameraRef.current.targetZ);
  });

  return (
    <>
      <color attach="background" args={['#1c1f24']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.4} />
      <primitive object={wall} />
      <primitive object={grid} position={[METAL_STUD_TEST_WALL.lengthMm / 2000, -0.001, 0]} />
    </>
  );
}
