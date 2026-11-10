export type Language = 'de' | 'en';

export type UnitSystem = 'mm' | 'cm' | 'm';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = {
  language: Language;
  units: UnitSystem;
  theme: ThemePreference;
};

export const defaultSettings: Settings = {
  language: 'de',
  units: 'mm',
  theme: 'system',
};
