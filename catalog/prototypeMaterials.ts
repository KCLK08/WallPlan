import type { Language } from '@/types/settings';

export type CatalogKind = 'profile' | 'board';

export type CatalogItem = {
  id: string;
  nameDe: string;
  nameEn: string;
  kind: CatalogKind;
};

export const PROTOTYPE_CATALOG: readonly CatalogItem[] = [
  { id: 'uw-75', nameDe: 'UW-Profil 75', nameEn: 'UW track 75', kind: 'profile' },
  { id: 'cw-75', nameDe: 'CW-Profil 75', nameEn: 'CW stud 75', kind: 'profile' },
  { id: 'gk-12-5', nameDe: 'Gipskartonplatte 12,5 mm', nameEn: 'Gypsum board 12.5 mm', kind: 'board' },
];

export function catalogName(id: string, language: Language): string {
  const item = PROTOTYPE_CATALOG.find((entry) => entry.id === id);
  if (!item) {
    return id;
  }
  return language === 'de' ? item.nameDe : item.nameEn;
}
