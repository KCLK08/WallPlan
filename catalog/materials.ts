import { BOARD_ITEMS } from './items/boards';
import { OTHER_ITEMS } from './items/other';
import { PROFILE_ITEMS } from './items/profiles';
import type { MaterialItem } from './types';

export const MATERIALS: readonly MaterialItem[] = [...PROFILE_ITEMS, ...BOARD_ITEMS, ...OTHER_ITEMS];

const byId = new Map(MATERIALS.map((item) => [item.id, item]));

export function findMaterial(id: string): MaterialItem | undefined {
  return byId.get(id);
}
