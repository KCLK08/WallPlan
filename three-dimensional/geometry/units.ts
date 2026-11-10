/**
 * Three.js uses metres. Every construction measure stays in millimetres until
 * `toScene` converts it at the renderer boundary.
 */
export const MILLIMETRE_IN_METRE = 0.001;

/** Sheet thinner than this is drawn at this thickness so the profile stays readable. The catalog value is kept in the notes. */
export const VISUAL_STEEL_MM = 2;

/** Separates faces that would otherwise lie on each other. It is not a joint or a construction gap. */
export const DISPLAY_GAP_MM = 0.5;

export const LAYER_SEPARATION_MM = 24;

export const EXPLOSION_STEP_MM = 80;

export function toScene(mm: number): number {
  return mm * MILLIMETRE_IN_METRE;
}
