import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import {
  deleteConstructionsSql,
  deleteProjectSql,
  insertProjectSql,
  listProjectsSql,
  updateProjectSql,
} from './projectSql';
import { upgradeSql } from './migrate';

type Row = Record<string, string>;

function columnNames(db: DatabaseSync): string[] {
  return db
    .prepare('PRAGMA table_info(projects)')
    .all()
    .map((row) => String((row as Row).name));
}

function migrate(db: DatabaseSync): void {
  for (const statement of upgradeSql(columnNames(db))) {
    db.exec(statement);
  }
}

describe('project sqlite', () => {
  it('upgrades a phase-3 database and keeps the old project', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.prepare('INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
      'legacy',
      'Altbau',
      '',
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
    );
    migrate(db);
    const row = db.prepare('SELECT id, name, status FROM projects WHERE id = ?').get('legacy') as Row;
    assert.equal(row.status, 'active');
    assert.equal(row.name, 'Altbau');
    migrate(db);
    assert.equal(columnNames(db).includes('status'), true);
    db.close();
  });

  it('stores, reloads, updates and deletes without duplicating ids', () => {
    const directory = mkdtempSync(join(tmpdir(), 'wallplan-'));
    const path = join(directory, 'wallplan.db');
    const first = new DatabaseSync(path);
    migrate(first);
    first.prepare(insertProjectSql).run('a', 'Eins', '', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    first.prepare(insertProjectSql).run('b', 'Zwei', 'Dach', 'active', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
    assert.throws(() =>
      first.prepare(insertProjectSql).run('a', 'Noch einmal', '', 'active', '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'),
    );
    first.close();

    const second = new DatabaseSync(path);
    const reloaded = second.prepare(listProjectsSql).all() as Row[];
    assert.deepEqual(
      reloaded.map((row) => row.id),
      ['b', 'a'],
    );
    second.prepare(updateProjectSql).run('Eins neu', 'Hinweis', 'active', '2026-04-01T00:00:00.000Z', 'a');
    const updated = second.prepare('SELECT id, name, description, created_at FROM projects WHERE id = ?').get('a') as Row;
    assert.equal(updated.id, 'a');
    assert.equal(updated.name, 'Eins neu');
    assert.equal(updated.description, 'Hinweis');
    assert.equal(updated.created_at, '2026-01-01T00:00:00.000Z');

    second
      .prepare(
        `INSERT INTO constructions (id, project_id, type, name, data_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('c1', 'b', 'metal_stud_partition', 'Wand', '{}', '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
    second.prepare(deleteConstructionsSql).run('b');
    const deleted = second.prepare(deleteProjectSql).run('b');
    assert.equal(deleted.changes, 1);
    assert.equal(second.prepare('SELECT COUNT(*) AS count FROM projects').get().count, 1);
    assert.equal(second.prepare('SELECT COUNT(*) AS count FROM constructions').get().count, 0);
    second.close();
  });
});
