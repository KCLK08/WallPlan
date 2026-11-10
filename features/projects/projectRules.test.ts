import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Project } from '@/types/project';

import { applyProjectEdit, filterProjects, parseProjectInput, shouldDeleteProject } from './projectRules';

function sample(id: string, updatedAt: string, name = id): Project {
  return {
    id,
    name,
    description: '',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
    constructions: [],
  };
}

describe('project rules', () => {
  it('rejects an empty name and trims the rest', () => {
    assert.deepEqual(parseProjectInput({ name: '   ', description: ' Raum ' }), { ok: false, error: 'name-required' });
    assert.deepEqual(parseProjectInput({ name: '  Wohnung  ', description: '  EG  ' }), {
      ok: true,
      value: { name: 'Wohnung', description: 'EG' },
    });
  });

  it('keeps the id and creation date when renaming or editing', () => {
    const project = sample('stable', '2026-01-01T00:00:00.000Z', 'Alt');
    const renamed = applyProjectEdit(project, { name: ' Neu ', description: project.description }, '2026-02-01T00:00:00.000Z');
    assert.ok(!('error' in renamed));
    if ('error' in renamed) {
      return;
    }
    assert.equal(renamed.id, 'stable');
    assert.equal(renamed.createdAt, project.createdAt);
    assert.equal(renamed.name, 'Neu');
    assert.equal(renamed.updatedAt, '2026-02-01T00:00:00.000Z');

    const edited = applyProjectEdit(project, { name: 'Neu', description: 'Hinweis' }, '2026-03-01T00:00:00.000Z');
    assert.ok(!('error' in edited));
    if ('error' in edited) {
      return;
    }
    assert.equal(edited.description, 'Hinweis');
    assert.equal(edited.id, project.id);
  });

  it('sorts by last change and filters the list', () => {
    const projects = [sample('old', '2026-01-01T00:00:00.000Z', 'Keller'), sample('new', '2026-05-01T00:00:00.000Z', 'Dach')];
    assert.deepEqual(
      filterProjects(projects, '').map((project) => project.id),
      ['new', 'old'],
    );
    assert.deepEqual(
      filterProjects(projects, 'kel').map((project) => project.name),
      ['Keller'],
    );
    assert.equal(filterProjects(projects, 'fehlt').length, 0);
  });

  it('deletes only after confirmation', () => {
    assert.equal(shouldDeleteProject('cancel'), false);
    assert.equal(shouldDeleteProject('confirm'), true);
  });
});
