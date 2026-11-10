import type { CladdingLayerSpec } from './types';

/**
 * One side of a multi-layer cladding. Layers are counted from the framing
 * outward. Each layer keeps its own catalog id.
 */
export type CladdingSide = {
  side: 'A' | 'B';
  layers: readonly CladdingLayerSpec[];
};

/**
 * Data example for OSB plus gypsum. It is not a tested wall system.
 * The OSB layer and the gypsum layer stay separate material references.
 */
export const OSB_PLUS_GYPSUM_SIDE_A: CladdingSide = {
  side: 'A',
  layers: [
    {
      id: 'osb-plus-gypsum-backing',
      catalogItemId: 'board-osb3-15',
      orderFromFraming: 1,
      role: 'backing',
    },
    {
      id: 'osb-plus-gypsum-finish',
      catalogItemId: 'gk-12-5',
      orderFromFraming: 2,
      role: 'finish',
    },
  ],
};
