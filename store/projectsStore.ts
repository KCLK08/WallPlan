import { create } from 'zustand';

import { projectsByRecent } from '@/features/projects/projectRules';
import type { Project } from '@/types/project';

type ProjectsState = {
  projects: Project[];
  ready: boolean;
  setProjects: (projects: Project[]) => void;
  upsertProject: (project: Project) => void;
  removeProject: (id: string) => void;
};

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  ready: false,
  setProjects: (projects) => set({ projects: projectsByRecent(projects), ready: true }),
  upsertProject: (project) =>
    set((state) => ({
      projects: projectsByRecent([project, ...state.projects.filter((entry) => entry.id !== project.id)]),
      ready: true,
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((entry) => entry.id !== id),
    })),
}));
