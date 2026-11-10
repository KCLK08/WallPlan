export type ProjectStatus = 'active';

import type { SavedWall } from '@/construction/wallModel';

/**
 * A saved construction row. The configuration payload lives in `data_json`.
 * `data` is null when that payload is empty or not a known wall.
 */
export type ConstructionRecord = {
  id: string;
  projectId: string;
  type: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: SavedWall | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  constructions: ConstructionRecord[];
};

export type ProjectInput = {
  name: string;
  description: string;
};
