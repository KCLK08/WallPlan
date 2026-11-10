import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { compileWall, createWallDraft, parseSavedWall } from '@/construction/wallRules';
import type { WallDraft } from '@/construction/wallModel';

import { upgradeSql } from './migrate';
import { insertConstructionSql, insertProjectSql, updateConstructionSql } from './projectSql';

function migrate(db: DatabaseSync): void {
  const columns = db
    .prepare('PRAGMA table_info(projects)')
    .all()
    .map((row) => String((row as { name: string }).name));
  for (const statement of upgradeSql(columns)) {
    db.exec(statement);
  }
}

function sampleDraft(): WallDraft {
  const draft = createWallDraft('p1', '2026-11-10T12:00:00.000Z');
  draft.id = 'wall-1';
  draft.name = 'Trennwand';
  draft.lengthMm = 3000;
  draft.heightMm = 2500;
  draft.nominalDepthMm = 75;
  draft.spacingMm = 625;
  draft.sideA.layers[0] = { id: 'layer-a', catalogItemId: 'gk-12-5', format: { widthMm: 1250, lengthMm: 2500 } };
  draft.sideB.layers[0] = { id: 'layer-b', catalogItemId: 'gk-12-5', format: { widthMm: 1250, lengthMm: 2500 } };
  return draft;
}

describe('construction sqlite', () => {
  it('reloads one construction after restart and keeps the id when edited', () => {
    const compiled = compileWall(sampleDraft());
    assert.equal(compiled.ok, true);
    if (!compiled.ok) {
      return;
    }
    const directory = mkdtempSync(join(tmpdir(), 'wallplan-wall-'));
    const path = join(directory, 'wallplan.db');
    const first = new DatabaseSync(path);
    migrate(first);
    first.prepare(insertProjectSql).run('p1', 'Wohnung', '', 'active', '2026-11-10T12:00:00.000Z', '2026-11-10T12:00:00.000Z');
    first
      .prepare(insertConstructionSql)
      .run('wall-1', 'p1', 'metal-stud-partition', 'Trennwand', JSON.stringify(compiled.wall), '2026-11-10T12:00:00.000Z', '2026-11-10T12:00:00.000Z');
    assert.throws(() =>
      first
        .prepare(insertConstructionSql)
        .run('wall-1', 'p1', 'metal-stud-partition', 'Noch einmal', '{}', '2026-11-10T13:00:00.000Z', '2026-11-10T13:00:00.000Z'),
    );
    first.close();

    const second = new DatabaseSync(path);
    const row = second.prepare('SELECT id, project_id, data_json, created_at FROM constructions WHERE id = ?').get('wall-1') as {
      id: string;
      project_id: string;
      data_json: string;
      created_at: string;
    };
    const restored = parseSavedWall(row.data_json);
    assert.equal(row.id, 'wall-1');
    assert.equal(row.project_id, 'p1');
    assert.equal(row.created_at, '2026-11-10T12:00:00.000Z');
    assert.equal(restored?.dimensions.lengthMm, 3000);
    assert.equal(restored?.sides.A.layers[0]?.id, 'layer-a');
    assert.equal(parseSavedWall('{}'), null);

    const edited = { ...compiled.wall, name: 'Trennwand Diele', description: 'Hinweis' };
    const result = second.prepare(updateConstructionSql).run(
      'metal-stud-partition',
      'Trennwand Diele',
      JSON.stringify(edited),
      '2026-11-10T14:00:00.000Z',
      'wall-1',
      'p1',
    );
    assert.equal(result.changes, 1);
    assert.equal(second.prepare('SELECT COUNT(*) AS count FROM constructions').get().count, 1);
    const after = parseSavedWall(
      (second.prepare('SELECT data_json, created_at FROM constructions WHERE id = ?').get('wall-1') as { data_json: string; created_at: string })
        .data_json,
    );
    assert.equal(after?.name, 'Trennwand Diele');
    assert.equal(after?.sides.A.layers[0]?.catalogItemId, 'gk-12-5');
    second.close();
  });
});
