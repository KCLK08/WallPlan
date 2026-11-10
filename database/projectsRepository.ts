import type { SQLiteDatabase } from 'expo-sqlite';

import type { ConstructionRecord, Project, ProjectStatus } from '@/types/project';

import {
  deleteConstructionsSql,
  deleteProjectSql,
  insertProjectSql,
  listConstructionsSql,
  listProjectsSql,
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

function mapConstruction(row: ConstructionRow): ConstructionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
