import type { Bounds } from '../sheet';

export const NAMED_SCALES = [10, 20, 25, 50] as const;

export type ScaleChoice = 'auto' | (typeof NAMED_SCALES)[number];

export const WEB_PX_PER_INCH = 96;

export const RN_DP_PER_INCH = 160;

export type Camera2D = {
  pxPerMm: number;
  panX: number;
  panY: number;
};

export function pxPerMmForScale(scale: number, pxPerInch: number): number {
  return pxPerInch / (scale * 25.4);
}

export function fitPxPerMm(widthMm: number, heightMm: number, viewportWidth: number, viewportHeight: number, padding: number): number {
  const innerWidth = Math.max(viewportWidth - padding * 2, 1);
  const innerHeight = Math.max(viewportHeight - padding * 2, 1);
  return Math.min(innerWidth / Math.max(widthMm, 1), innerHeight / Math.max(heightMm, 1));
}

export function effectiveScale(pxPerMm: number, pxPerInch: number): number {
  if (pxPerMm <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return pxPerInch / (pxPerMm * 25.4);
}

export function sheetPoint(
  mmX: number,
  mmY: number,
  bounds: Bounds,
  camera: Camera2D,
): { x: number; y: number } {
  return {
    x: camera.panX + (mmX - bounds.minX) * camera.pxPerMm,
    y: camera.panY + (bounds.maxY - mmY) * camera.pxPerMm,
  };
}

export function sheetMillimetres(
  screenX: number,
  screenY: number,
  bounds: Bounds,
  camera: Camera2D,
): { x: number; y: number } {
  return {
    x: bounds.minX + (screenX - camera.panX) / camera.pxPerMm,
    y: bounds.maxY - (screenY - camera.panY) / camera.pxPerMm,
  };
}

export function frameCamera(
  bounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  choice: ScaleChoice,
  pxPerInch: number,
  padding: number,
): Camera2D {
  const widthMm = Math.max(bounds.maxX - bounds.minX, 1);
  const heightMm = Math.max(bounds.maxY - bounds.minY, 1);
  const fitted = fitPxPerMm(widthMm, heightMm, viewportWidth, viewportHeight, padding);
  const pxPerMm = choice === 'auto' ? fitted : pxPerMmForScale(choice, pxPerInch);
  const contentWidth = widthMm * pxPerMm;
  const contentHeight = heightMm * pxPerMm;
  const fits = contentWidth <= viewportWidth - padding && contentHeight <= viewportHeight - padding;
  return {
    pxPerMm,
    panX: fits ? (viewportWidth - contentWidth) / 2 : padding,
    panY: fits ? (viewportHeight - contentHeight) / 2 : padding,
  };
}

export function scaleFits(
  bounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  choice: Exclude<ScaleChoice, 'auto'>,
  pxPerInch: number,
  padding: number,
): boolean {
  const widthMm = Math.max(bounds.maxX - bounds.minX, 1);
  const heightMm = Math.max(bounds.maxY - bounds.minY, 1);
  const pxPerMm = pxPerMmForScale(choice, pxPerInch);
  return widthMm * pxPerMm <= viewportWidth - padding && heightMm * pxPerMm <= viewportHeight - padding;
}

export function panBy(camera: Camera2D, dx: number, dy: number): Camera2D {
  return { ...camera, panX: camera.panX + dx, panY: camera.panY + dy };
}

export function zoomAt(camera: Camera2D, factor: number, anchorX: number, anchorY: number, minPxPerMm: number, maxPxPerMm: number): Camera2D {
  if (!Number.isFinite(factor) || factor <= 0) {
    return camera;
  }
  const pxPerMm = Math.min(maxPxPerMm, Math.max(minPxPerMm, camera.pxPerMm * factor));
  const worldX = (anchorX - camera.panX) / camera.pxPerMm;
  const worldY = (anchorY - camera.panY) / camera.pxPerMm;
  return {
    pxPerMm,
    panX: anchorX - worldX * pxPerMm,
    panY: anchorY - worldY * pxPerMm,
  };
}
