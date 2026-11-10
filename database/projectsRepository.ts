import type { SQLiteDatabase } from 'expo-sqlite';

import { parseSavedWall } from '@/construction/wallRules';
import type { ConstructionRecord, Project, ProjectStatus } from '@/types/project';

import {
  deleteConstructionsSql,
  deleteOneConstructionSql,
  deleteProjectSql,
  insertConstructionSql,
  insertProjectSql,
  listConstructionsSql,
  listProjectsSql,
  updateConstructionSql,
  updateProjectSql,
} from './projectSql';

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ConstructionRow = {
  id: string;
  project_id: string;
  type: string;
  name: string;
  data_json: string;
  created_at: string;
  updated_at: string;
};

export class ProjectWriteError extends Error {
  constructor(message = 'project-write-failed') {
    super(message);
    this.name = 'ProjectWriteError';
  }
}

function isStatus(value: string): value is ProjectStatus {
  return value === 'active';
}

export function mapProject(row: ProjectRow, constructions: ConstructionRecord[] = []): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: isStatus(row.status) ? row.status : 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    constructions,
  };
}

export function mapConstruction(row: ConstructionRow): ConstructionRecord {
  const data = parseSavedWall(row.data_json);
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    name: data?.name || row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data,
  };
}

export async function listProjects(db: SQLiteDatabase): Promise<Project[]> {
  try {
    const rows = await db.getAllAsync<ProjectRow>(listProjectsSql);
    const constructionRows = await db.getAllAsync<ConstructionRow>(listConstructionsSql);
    const grouped = new Map<string, ConstructionRecord[]>();
    for (const row of constructionRows) {
      const list = grouped.get(row.project_id) ?? [];
      list.push(mapConstruction(row));
      grouped.set(row.project_id, list);
    }
    return rows.map((row) => mapProject(row, grouped.get(row.id) ?? []));
  } catch (error) {
    throw new ProjectWriteError(error instanceof Error ? error.message : 'project-read-failed');
  }
}

export async function insertProject(db: SQLiteDatabase, project: Project): Promise<void> {
  try {
    await db.runAsync(
      insertProjectSql,
      project.id,
      project.name,
      project.description,
      project.status,
      project.createdAt,
      project.updatedAt,
    );
  } catch (error) {
    throw new ProjectWriteError(error instanceof Error ? error.message : 'project-insert-failed');
  }
}

export async function updateProject(db: SQLiteDatabase, project: Project): Promise<void> {
  try {
    const result = await db.runAsync(
      updateProjectSql,
      project.name,
      project.description,
      project.status,
      project.updatedAt,
      project.id,
    );
    if (result.changes === 0) {
      throw new ProjectWriteError('project-missing');
    }
  } catch (error) {
    if (error instanceof ProjectWriteError) {
      throw error;
    }
    throw new ProjectWriteError(error instanceof Error ? error.message : 'project-update-failed');
  }
}

export async function insertConstruction(db: SQLiteDatabase, row: ConstructionRecord): Promise<void> {
  try {
    await db.runAsync(
      insertConstructionSql,
      row.id,
      row.projectId,
      row.type,
      row.name,
      JSON.stringify(row.data ?? {}),
      row.createdAt,
      row.updatedAt,
    );
  } catch (error) {
    throw new ProjectWriteError(error instanceof Error ? error.message : 'construction-insert-failed');
  }
}

export async function updateConstruction(db: SQLiteDatabase, row: ConstructionRecord): Promise<void> {
  try {
    const result = await db.runAsync(
      updateConstructionSql,
      row.type,
      row.name,
      JSON.stringify(row.data ?? {}),
      row.updatedAt,
      row.id,
      row.projectId,
    );
    if (result.changes === 0) {
      throw new ProjectWriteError('construction-missing');
    }
  } catch (error) {
    if (error instanceof ProjectWriteError) {
      throw error;
    }
    throw new ProjectWriteError(error instanceof Error ? error.message : 'construction-update-failed');
  }
}

export async function deleteConstruction(db: SQLiteDatabase, projectId: string, id: string): Promise<void> {
  try {
    const result = await db.runAsync(deleteOneConstructionSql, id, projectId);
    if (result.changes === 0) {
      throw new ProjectWriteError('construction-missing');
    }
  } catch (error) {
    if (error instanceof ProjectWriteError) {
      throw error;
    }
    throw new ProjectWriteError(error instanceof Error ? error.message : 'construction-delete-failed');
  }
}

export async function deleteProject(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync(deleteConstructionsSql, id);
    const result = await db.runAsync(deleteProjectSql, id);
    if (result.changes === 0) {
      throw new ProjectWriteError('project-missing');
    }
  } catch (error) {
    if (error instanceof ProjectWriteError) {
      throw error;
    }
    throw new ProjectWriteError(error instanceof Error ? error.message : 'project-delete-failed');
  }
}
