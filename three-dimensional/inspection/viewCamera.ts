/** Matches the camera numbers used by the saved-wall canvas. */
export const PERSPECTIVE_FOV = 40;
export const PERSPECTIVE_NEAR = 0.04;
export const PERSPECTIVE_FAR = 200;
export const ORTHO_NEAR = -30;
export const ORTHO_FAR = 200;

export function orthographicZoom(
  lengthMm: number,
  heightMm: number,
  width: number,
  height: number,
  radius: number,
  frameRadius: number,
): number {
  const span = (Math.max(lengthMm, heightMm) / 1000) * 1.35;
  const fitted = Math.min(width, height) / Math.max(span, 0.2);
  return fitted * (frameRadius / Math.max(radius, 0.2));
}
