import type { SQLiteDatabase } from 'expo-sqlite';

import { deleteProject as deleteProjectRow, insertProject, updateProject } from '@/database/projectsRepository';
import { useProjectsStore } from '@/store/projectsStore';
import type { Project, ProjectInput } from '@/types/project';

import { applyProjectEdit, parseProjectInput } from './projectRules';

export class ProjectValidationError extends Error {
  readonly reason = 'name-required' as const;

  constructor() {
    super('name-required');
    this.name = 'ProjectValidationError';
  }
}

export function createProjectId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProject(db: SQLiteDatabase, input: ProjectInput): Promise<Project> {
  const parsed = parseProjectInput(input);
  if (!parsed.ok) {
    throw new ProjectValidationError();
  }
  const now = new Date().toISOString();
  const project: Project = {
    id: createProjectId(),
    name: parsed.value.name,
    description: parsed.value.description,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    constructions: [],
  };
  await insertProject(db, project);
  useProjectsStore.getState().upsertProject(project);
  return project;
}

export async function saveProject(db: SQLiteDatabase, id: string, input: ProjectInput): Promise<Project> {
  const current = useProjectsStore.getState().projects.find((project) => project.id === id);
  if (!current) {
    throw new ProjectValidationError();
  }
  const next = applyProjectEdit(current, input, new Date().toISOString());
  if ('error' in next) {
    throw new ProjectValidationError();
  }
  await updateProject(db, next);
  useProjectsStore.getState().upsertProject(next);
  return next;
}

export async function removeProject(db: SQLiteDatabase, id: string): Promise<void> {
  await deleteProjectRow(db, id);
  useProjectsStore.getState().removeProject(id);
}
