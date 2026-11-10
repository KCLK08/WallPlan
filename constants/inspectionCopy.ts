import type { Language } from '@/types/settings';

const de = {
  part: 'Bauteil',
  measures: 'Maße',
  measuresOn: 'Maße ein',
  general: 'Allgemein',
  geometry: 'Geometrie',
  construction: 'Konstruktion',
  clear: 'Auswahl aufheben',
  isolate: 'Nur diese Lage',
  reveal: 'Alle Beplankungen',
  empty: 'Tippen Sie ein Bauteil an. Die gespeicherte Wand bleibt unverändert.',
  readonly: 'Die Auswahl liest nur die gespeicherte Wand. Sie verändert keine Maße.',
  measureNote: 'Die Zahlen stehen hier. Im Modell liegen nur die Maßlinien, damit kein zusätzliches Schriftpaket nötig ist.',
};

const en: typeof de = {
  part: 'Part',
  measures: 'Dimensions',
  measuresOn: 'Dimensions on',
  general: 'General',
  geometry: 'Geometry',
  construction: 'Construction',
  clear: 'Clear selection',
  isolate: 'Only this layer',
  reveal: 'All cladding',
  empty: 'Tap a part. The saved wall stays unchanged.',
  readonly: 'Selection only reads the saved wall. It does not change any size.',
  measureNote: 'The numbers are listed here. The model shows the dimension lines only, so no extra font package is required.',
};

const copy = { de, en };

export type InspectionCopyKey = keyof typeof de;

export function inspectionText(language: Language, key: InspectionCopyKey): string {
  return copy[language][key];
}
