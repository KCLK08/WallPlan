import type { SQLiteDatabase } from 'expo-sqlite';

import type { SavedWall } from '@/construction/wallModel';
import { compileWall, draftFromWall } from '@/construction/wallRules';
import type { WallDraft } from '@/construction/wallModel';
import {
  deleteConstruction,
  insertConstruction,
  ProjectWriteError,
  updateConstruction,
  updateProject,
} from '@/database/projectsRepository';
import { useProjectsStore } from '@/store/projectsStore';
import type { ConstructionRecord, Project } from '@/types/project';

export class ConstructionValidationError extends Error {
  constructor() {
    super('construction-invalid');
    this.name = 'ConstructionValidationError';
  }
}

export async function saveConstruction(db: SQLiteDatabase, draft: WallDraft): Promise<ConstructionRecord> {
  const compiled = compileWall(draft);
  if (!compiled.ok) {
    throw new ConstructionValidationError();
  }
  const project = useProjectsStore.getState().projects.find((entry) => entry.id === draft.projectId);
  if (!project) {
    throw new ProjectWriteError('project-missing');
  }
  const current = project.constructions.find((entry) => entry.id === draft.id);
  const now = new Date().toISOString();
  const row = toRow(draft.id, draft.projectId, compiled.wall, current?.createdAt ?? draft.createdAt, now);
  if (current) {
    await updateConstruction(db, row);
  } else {
    await insertConstruction(db, row);
  }
  await commit(db, project, upsertRow(project.constructions, row), now);
  return row;
}

export async function renameConstruction(
  db: SQLiteDatabase,
  projectId: string,
  constructionId: string,
  name: string,
): Promise<ConstructionRecord> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ConstructionValidationError();
  }
  const project = useProjectsStore.getState().projects.find((entry) => entry.id === projectId);
  const current = project?.constructions.find((entry) => entry.id === constructionId);
  if (!project || !current?.data) {
    throw new ProjectWriteError('construction-missing');
  }
  const now = new Date().toISOString();
  const data: SavedWall = { ...current.data, name: trimmed.slice(0, 80) };
  const row = toRow(current.id, projectId, data, current.createdAt, now);
  await updateConstruction(db, row);
  await commit(db, project, upsertRow(project.constructions, row), now);
  return row;
}

export async function removeConstruction(db: SQLiteDatabase, projectId: string, constructionId: string): Promise<void> {
  const project = useProjectsStore.getState().projects.find((entry) => entry.id === projectId);
  if (!project) {
    throw new ProjectWriteError('project-missing');
  }
  await deleteConstruction(db, projectId, constructionId);
  const now = new Date().toISOString();
  await commit(
    db,
    project,
    project.constructions.filter((entry) => entry.id !== constructionId),
    now,
  );
}

export function editableDraft(row: ConstructionRecord): WallDraft | null {
  if (!row.data) {
    return null;
  }
  return draftFromWall(row.data, row.projectId, row.id, row.createdAt);
}

function toRow(id: string, projectId: string, wall: SavedWall, createdAt: string, updatedAt: string): ConstructionRecord {
  return {
    id,
    projectId,
    type: wall.kind,
    name: wall.name,
    createdAt,
    updatedAt,
    data: wall,
  };
}

function upsertRow(rows: readonly ConstructionRecord[], row: ConstructionRecord): ConstructionRecord[] {
  const without = rows.filter((entry) => entry.id !== row.id);
  return [...without, row].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

async function commit(db: SQLiteDatabase, project: Project, constructions: ConstructionRecord[], updatedAt: string): Promise<void> {
  const next: Project = { ...project, constructions, updatedAt };
  await updateProject(db, next);
  useProjectsStore.getState().upsertProject(next);
}
