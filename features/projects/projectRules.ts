import type { Project, ProjectInput } from '@/types/project';

const nameLimit = 80;
const descriptionLimit = 400;

export function parseProjectInput(input: ProjectInput): { ok: true; value: ProjectInput } | { ok: false; error: 'name-required' } {
  const name = input.name.trim().slice(0, nameLimit);
  const description = input.description.trim().slice(0, descriptionLimit);
  if (!name) {
    return { ok: false, error: 'name-required' };
  }
  return { ok: true, value: { name, description } };
}

export function applyProjectEdit(project: Project, input: ProjectInput, updatedAt: string): Project | { error: 'name-required' } {
  const parsed = parseProjectInput(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  return {
    ...project,
    name: parsed.value.name,
    description: parsed.value.description,
    updatedAt,
  };
}

export function projectsByRecent(projects: readonly Project[]): Project[] {
  return [...projects].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function filterProjects(projects: readonly Project[], query: string): Project[] {
  const needle = query.trim().toLocaleLowerCase('de');
  const sorted = projectsByRecent(projects);
  if (!needle) {
    return sorted;
  }
  return sorted.filter((project) => `${project.name}\n${project.description}`.toLocaleLowerCase('de').includes(needle));
}

export function shouldDeleteProject(decision: 'cancel' | 'confirm'): boolean {
  return decision === 'confirm';
}
