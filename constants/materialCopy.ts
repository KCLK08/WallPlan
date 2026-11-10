import type { CalculationGroup, CalculationStatus, CalculationUnit } from '@/calculations/material/types';
import type { Language } from '@/types/settings';

const de = {
  title: 'Materialliste',
  openList: 'Materialliste',
  intro: 'Die Liste wird aus der gespeicherten Wand berechnet. Sie ersetzt die Konstruktion nicht.',
  generated: 'Berechnet',
  sourceUpdated: 'Konstruktion zuletzt geändert',
  version: 'Berechnungsversion',
  noWaste: 'Es gibt keinen pauschalen Verschnitt. Eine Planungsmenge ist nur die Aufrundung auf ganze Teile, wenn ein Format hinterlegt ist.',
  incompleteTitle: 'Noch nicht vollständig berechenbar',
  incompleteBody: 'Diese Positionen bleiben sichtbar. Fehlende Maße oder Verbrauchswerte werden nicht durch Annahmen ersetzt.',
  groupEmpty: 'In dieser Gruppe gibt es keine berechnete Menge. Unvollständige Positionen stehen unten.',
  theoretical: 'Theoretische Menge',
  planning: 'Planungsmenge',
  noQuantity: 'Keine Menge',
  basis: 'Berechnungsgrundlage',
  assumptions: 'Annahmen',
  warnings: 'Hinweise',
  catalog: 'Katalog',
  none: 'Keiner',
  dataMissing: 'Die gespeicherte Wand kann nicht gelesen werden. Ohne Konstruktionsdaten gibt es keine Materialliste.',
};

const en = {
  title: 'Material list',
  openList: 'Material list',
  intro: 'The list is calculated from the saved wall. It does not replace the construction.',
  generated: 'Calculated',
  sourceUpdated: 'Construction last changed',
  version: 'Calculation version',
  noWaste: 'There is no blanket waste allowance. A planning quantity is only rounding up to whole parts when a format is recorded.',
  incompleteTitle: 'Not yet fully calculable',
  incompleteBody: 'These lines stay visible. Missing dimensions or consumption figures are not replaced by assumptions.',
  groupEmpty: 'This group has no calculated quantity. Incomplete lines are listed below.',
  theoretical: 'Theoretical quantity',
  planning: 'Planning quantity',
  noQuantity: 'No quantity',
  basis: 'Basis',
  assumptions: 'Assumptions',
  warnings: 'Notes',
  catalog: 'Catalog',
  none: 'None',
  dataMissing: 'The saved wall cannot be read. There is no material list without the construction data.',
};

const groupsDe: Record<CalculationGroup, string> = {
  framing: 'Unterkonstruktion',
  'cladding-a': 'Beplankung Seite A',
  'cladding-b': 'Beplankung Seite B',
  insulation: 'Dämmung',
  fasteners: 'Befestigungsmittel',
  other: 'Anschluss- und sonstige Materialien',
};

const groupsEn: Record<CalculationGroup, string> = {
  framing: 'Framing',
  'cladding-a': 'Cladding side A',
  'cladding-b': 'Cladding side B',
  insulation: 'Insulation',
  fasteners: 'Fasteners',
  other: 'Connections and other materials',
};

const statusDe: Record<CalculationStatus, string> = {
  calculable: 'Berechenbar',
  conditional: 'Bedingt berechenbar',
  incomplete: 'Unvollständig',
  'not-applicable': 'Nicht anwendbar',
};

const statusEn: Record<CalculationStatus, string> = {
  calculable: 'Calculable',
  conditional: 'Conditionally calculable',
  incomplete: 'Incomplete',
  'not-applicable': 'Not applicable',
};

const unitDe: Record<CalculationUnit, string> = {
  piece: 'Stück',
  metre: 'm',
  'square-metre': 'm²',
  'cubic-metre': 'm³',
};

const unitEn: Record<CalculationUnit, string> = {
  piece: 'piece',
  metre: 'm',
  'square-metre': 'm²',
  'cubic-metre': 'm³',
};

const copy = { de, en };

export type MaterialCopyKey = keyof typeof de;

export function materialText(language: Language, key: MaterialCopyKey): string {
  return copy[language][key];
}

export function materialGroupLabel(language: Language, group: CalculationGroup): string {
  return language === 'de' ? groupsDe[group] : groupsEn[group];
}

export function materialStatusLabel(language: Language, status: CalculationStatus): string {
  return language === 'de' ? statusDe[status] : statusEn[status];
}

export function materialUnitLabel(language: Language, unit: CalculationUnit): string {
  return language === 'de' ? unitDe[unit] : unitEn[unit];
}
