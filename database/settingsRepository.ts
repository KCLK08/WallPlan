import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultSettings, type Settings } from '@/types/settings';

type SettingRow = {
  key: string;
  value: string;
};

function isLanguage(value: string): value is Settings['language'] {
  return value === 'de' || value === 'en';
}

function isUnit(value: string): value is Settings['units'] {
  return value === 'mm' || value === 'cm' || value === 'm';
}

function isTheme(value: string): value is Settings['theme'] {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function readSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<SettingRow>('SELECT key, value FROM settings');
  const settings: Settings = { ...defaultSettings };

  for (const row of rows) {
    if (row.key === 'language' && isLanguage(row.value)) {
      settings.language = row.value;
    }
    if (row.key === 'units' && isUnit(row.value)) {
      settings.units = row.value;
    }
    if (row.key === 'theme' && isTheme(row.value)) {
      settings.theme = row.value;
    }
  }

  return settings;
}

export async function writeSetting(
  db: SQLiteDatabase,
  key: keyof Settings,
  value: Settings[keyof Settings],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}
