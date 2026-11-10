import { findMaterial } from '@/catalog/materials';
import type { MaterialCategory } from '@/catalog/types';
import type { SavedOpening } from '@/construction/wallModel';

import type { CalculationGroup, CalculationStatus, CalculationUnit, MaterialLine } from './types';

const categoryDe: Record<MaterialCategory, string> = {
  'metal-profiles': 'Metallprofil',
  hangers: 'Abhänger',
  boards: 'Platte',
  insulation: 'Dämmung',
  fasteners: 'Befestigungsmittel',
  'joint-compounds': 'Spachtel',
  sealing: 'Abdichtung',
  accessories: 'Zubehör',
};

const categoryEn: Record<MaterialCategory, string> = {
  'metal-profiles': 'Metal profile',
  hangers: 'Hanger',
  boards: 'Board',
  insulation: 'Insulation',
  fasteners: 'Fastener',
  'joint-compounds': 'Joint compound',
  sealing: 'Sealing',
  accessories: 'Accessory',
};

export function openingsOverlap(openings: readonly SavedOpening[]): boolean {
  for (let left = 0; left < openings.length; left += 1) {
    for (let right = left + 1; right < openings.length; right += 1) {
      const a = openings[left];
      const b = openings[right];
      if (a.offsetFromLeftMm < b.offsetFromLeftMm + b.widthMm && b.offsetFromLeftMm < a.offsetFromLeftMm + a.widthMm) {
        return true;
      }
    }
  }
  return false;
}

export function openingAreaMm2(openings: readonly SavedOpening[]): number {
  return openings.reduce((sum, opening) => sum + opening.widthMm * opening.heightMm, 0);
}

export function squareMetres(areaMm2: number): number {
  return areaMm2 / 1_000_000;
}

export function catalogText(id: string | null): {
  nameDe: string;
  nameEn: string;
  categoryDe: string;
  categoryEn: string;
  found: boolean;
} {
  if (!id) {
    return { nameDe: 'Ohne Katalogeintrag', nameEn: 'No catalog item', categoryDe: 'Nicht zugeordnet', categoryEn: 'Unassigned', found: false };
  }
  const item = findMaterial(id);
  if (!item) {
    return { nameDe: id, nameEn: id, categoryDe: 'Nicht im Katalog', categoryEn: 'Not in the catalog', found: false };
  }
  return {
    nameDe: item.nameDe,
    nameEn: item.nameEn,
    categoryDe: categoryDe[item.category],
    categoryEn: categoryEn[item.category],
    found: true,
  };
}

export function materialLine(input: {
  id: string;
  catalogItemId?: string | null;
  group: CalculationGroup;
  theoretical?: number | null;
  planning?: number | null;
  unit?: CalculationUnit | null;
  basisDe: string;
  basisEn: string;
  assumptionsDe?: readonly string[];
  assumptionsEn?: readonly string[];
  status: CalculationStatus;
  warningsDe?: readonly string[];
  warningsEn?: readonly string[];
  nameDe?: string;
  nameEn?: string;
}): MaterialLine {
  const named = catalogText(input.catalogItemId ?? null);
  return {
    id: input.id,
    catalogItemId: input.catalogItemId ?? null,
    nameDe: input.nameDe ?? named.nameDe,
    nameEn: input.nameEn ?? named.nameEn,
    categoryDe: named.categoryDe,
    categoryEn: named.categoryEn,
    group: input.group,
    theoretical: input.theoretical ?? null,
    planning: input.planning ?? null,
    unit: input.unit ?? null,
    basisDe: input.basisDe,
    basisEn: input.basisEn,
    assumptionsDe: input.assumptionsDe ?? [],
    assumptionsEn: input.assumptionsEn ?? [],
    status: input.status,
    warningsDe: input.warningsDe ?? [],
    warningsEn: input.warningsEn ?? [],
  };
}
