import type { SQLiteDatabase } from 'expo-sqlite';

import type { Project } from '@/types/project';

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(db: SQLiteDatabase): Promise<Project[]> {
  const rows = await db.getAllAsync<ProjectRow>(
    'SELECT id, name, description, created_at, updated_at FROM projects ORDER BY updated_at DESC',
  );
  return rows.map(mapProject);
}

export async function insertProject(db: SQLiteDatabase, project: Project): Promise<void> {
  await db.runAsync(
    'INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    project.id,
    project.name,
    project.description,
    project.createdAt,
    project.updatedAt,
  );
}
