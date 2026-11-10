import type { SQLiteDatabase } from 'expo-sqlite';

import { CATALOG_VERSION } from '@/catalog/version';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // The web build of SQLite does not always accept WAL mode.
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES ('catalog_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    CATALOG_VERSION,
  );
}
