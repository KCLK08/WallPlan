import type { MaterialItem } from './types';
import { CATALOG_VERSION } from './version';

export function defineMaterial(item: Omit<MaterialItem, 'catalogVersion' | 'properties' | 'suitableFor' | 'manufacturerReferences'> & Partial<Pick<MaterialItem, 'properties' | 'suitableFor' | 'manufacturerReferences'>>): MaterialItem {
  return {
    ...item,
    properties: item.properties ?? [],
    suitableFor: item.suitableFor ?? [],
    manufacturerReferences: item.manufacturerReferences ?? [],
    catalogVersion: CATALOG_VERSION,
  };
}
