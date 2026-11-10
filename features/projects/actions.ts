import type { SQLiteDatabase } from 'expo-sqlite';

import { insertProject } from '@/database/projectsRepository';
import { useProjectsStore } from '@/store/projectsStore';
import type { Project } from '@/types/project';

export function createProjectId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProject(
  db: SQLiteDatabase,
  input: { name: string; description: string },
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: createProjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    createdAt: now,
    updatedAt: now,
  };
  await insertProject(db, project);
  useProjectsStore.getState().addProject(project);
  return project;
}
