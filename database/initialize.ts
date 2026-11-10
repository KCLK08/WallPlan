import type { SQLiteDatabase } from 'expo-sqlite';

import { CATALOG_VERSION } from '@/catalog/version';

import { SCHEMA_VERSION, upgradeSql } from './migrate';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch {
    // Some web builds ignore this pragma. Deletes still remove child rows explicitly.
  }
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // The web build of SQLite does not always accept WAL mode.
  }

  const projectColumns = await readProjectColumns(db);
  for (const statement of upgradeSql(projectColumns)) {
    await db.execAsync(statement);
  }

  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES ('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    String(SCHEMA_VERSION),
  );
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES ('catalog_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    CATALOG_VERSION,
  );
}

async function readProjectColumns(db: SQLiteDatabase): Promise<string[]> {
  try {
    const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(projects)');
    return rows.map((row) => row.name);
  } catch {
    return [];
  }
}
