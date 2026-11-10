import type { RefObject } from 'react';

import type { OrbitCamera } from './orbit';
import type { SceneBox } from './geometry/types';
import type { MeasureLine } from './inspection/inspectionTypes';
import { SavedWallScene } from './SavedWallScene';
import { Canvas } from './wallFiber';

type SavedWallCanvasProps = {
  boxes: readonly SceneBox[];
  selected: readonly SceneBox[];
  measures: readonly MeasureLine[];
  cameraRef: RefObject<OrbitCamera>;
  lengthMm: number;
  heightMm: number;
  orthographic: boolean;
};

export function SavedWallCanvas({ boxes, selected, measures, cameraRef, lengthMm, heightMm, orthographic }: SavedWallCanvasProps) {
  return (
    <Canvas
      key={orthographic ? 'ortho' : 'perspective'}
      orthographic={orthographic}
      style={{ width: '100%', height: '100%' }}
      camera={
        orthographic
          ? { zoom: 80, near: -30, far: 200, position: [2, 1.5, 4] }
          : { fov: 40, near: 0.04, far: 200, position: [2, 1.5, 4] }
      }
    >
      <SavedWallScene
        boxes={boxes}
        selected={selected}
        measures={measures}
        cameraRef={cameraRef}
        lengthMm={lengthMm}
        heightMm={heightMm}
        orthographic={orthographic}
      />
    </Canvas>
  );
}
