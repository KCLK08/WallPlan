import { create } from 'zustand';

import type { Project } from '@/types/project';

type ProjectsState = {
  projects: Project[];
  ready: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
};

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  ready: false,
  setProjects: (projects) => set({ projects, ready: true }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects.filter((entry) => entry.id !== project.id)],
    })),
}));
