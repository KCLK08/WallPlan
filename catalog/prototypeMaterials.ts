import type { Language } from '@/types/settings';

import { findMaterial } from './materials';

export function catalogName(id: string, language: Language): string {
  const item = findMaterial(id);
  if (!item) {
    return id;
  }
  return language === 'de' ? item.nameDe : item.nameEn;
}
