import { MATERIALS } from './materials';
import type { ConstructionUse, MaterialCategory, MaterialItem } from './types';

export function searchMaterials(query: string): readonly MaterialItem[] {
  const needle = normalize(query);
  if (!needle) {
    return MATERIALS;
  }
  return MATERIALS.filter((item) => {
    const haystack = normalize(
      [item.nameDe, item.nameEn, item.materialType, item.subcategory, item.descriptionDe, item.descriptionEn].join(' '),
    );
    return haystack.includes(needle);
  });
}

export function materialsIn(category: MaterialCategory): readonly MaterialItem[] {
  return MATERIALS.filter((item) => item.category === category);
}

export function relevantMaterials(request: {
  construction: ConstructionUse;
  category?: MaterialCategory;
  nominalDepthMm?: number;
}): readonly MaterialItem[] {
  return MATERIALS.filter((item) => {
    if (request.category && item.category !== request.category) {
      return false;
    }
    if (!item.suitableFor.includes(request.construction)) {
      return false;
    }
    if (request.nominalDepthMm !== undefined && item.profile && item.profile.nominalDepthMm !== request.nominalDepthMm) {
      return false;
    }
    return true;
  });
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('de').replaceAll('ß', 'ss').trim();
}
