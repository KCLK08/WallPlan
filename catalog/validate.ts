import { MATERIALS } from './materials';
import { findSource } from './sources';
import { CATALOG_TAXONOMY } from './taxonomy';
import { CATALOG_VERSION } from './version';

const pricePattern = /€|eur|preis|price/i;

export function validateCatalog(): readonly string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  if (!/^\d+\.\d+\.\d+$/.test(CATALOG_VERSION)) {
    errors.push('catalog version is not a dotted version');
  }

  for (const item of MATERIALS) {
    if (seen.has(item.id)) {
      errors.push(`duplicate id ${item.id}`);
    }
    seen.add(item.id);
    if (item.catalogVersion !== CATALOG_VERSION) {
      errors.push(`${item.id} has another catalog version`);
    }
    if (!item.nameDe.trim() || !item.nameEn.trim()) {
      errors.push(`${item.id} is missing a name`);
    }
    if (item.thicknessMm !== undefined && (!Number.isFinite(item.thicknessMm) || item.thicknessMm <= 0)) {
      errors.push(`${item.id} has an invalid thickness`);
    }
    for (const sourceId of item.sourceIds) {
      if (!findSource(sourceId)) {
        errors.push(`${item.id} cites missing source ${sourceId}`);
      }
    }
    if (item.sourceIds.length === 0) {
      errors.push(`${item.id} has no source`);
    }
    for (const partner of item.compareWith ?? []) {
      if (!seen.has(partner) && !MATERIALS.some((candidate) => candidate.id === partner)) {
        errors.push(`${item.id} compares with missing ${partner}`);
      }
    }
    const blob = JSON.stringify(item);
    if (pricePattern.test(blob)) {
      errors.push(`${item.id} contains a price`);
    }
  }

  for (const category of CATALOG_TAXONOMY) {
    for (const group of category.groups) {
      const found = MATERIALS.some((item) => item.category === category.id && item.subcategory === group.id);
      if (!found) {
        errors.push(`missing ${category.id}/${group.id}`);
      }
    }
  }

  return errors;
}
