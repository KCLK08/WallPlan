import type { Language, UnitSystem } from '@/types/settings';

export function formatLength(lengthMm: number, unit: UnitSystem, language: Language): string {
  const locale = language === 'de' ? 'de-DE' : 'en-GB';
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 'mm' ? 1 : 2 });
  if (unit === 'cm') {
    return `${format.format(lengthMm / 10)} cm`;
  }
  if (unit === 'm') {
    return `${format.format(lengthMm / 1000)} m`;
  }
  return `${format.format(lengthMm)} mm`;
}

export function formatTimestamp(iso: string, language: Language): string {
  const locale = language === 'de' ? 'de-DE' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
