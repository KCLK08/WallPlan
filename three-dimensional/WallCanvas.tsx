import type { RefObject } from 'react';

import type { OrbitCamera } from './orbit';
import { Canvas } from './wallFiber';
import { WallScene } from './WallScene';

type WallCanvasProps = {
  showBoard: boolean;
  cameraRef: RefObject<OrbitCamera>;
};

export function WallCanvas({ showBoard, cameraRef }: WallCanvasProps) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ fov: 40, near: 0.05, far: 80, position: [3, 2, 4] }}
    >
      <WallScene showBoard={showBoard} cameraRef={cameraRef} />
    </Canvas>
  );
}
