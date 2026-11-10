import { useEffect, type RefObject } from 'react';

import type { OrbitCamera } from './orbit';
import { zoomOrbit } from './orbit';
import { pointerModifiers } from './pointerModifiers';

export function useWheelZoom(camera: RefObject<OrbitCamera>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        pointerModifiers.shift = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        pointerModifiers.shift = false;
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomOrbit(camera.current, event.deltaY > 0 ? 1.08 : 0.92);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      pointerModifiers.shift = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [camera]);
}
