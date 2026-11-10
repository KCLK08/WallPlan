export type ProjectStatus = 'active';

/**
 * A saved construction row. Phase 4 keeps the table and this shape so a
 * project can own several constructions later. Dimensions, profiles,
 * cladding, insulation, openings and material references are not written yet.
 * They belong in the reserved `data_json` column.
 */
export type ConstructionRecord = {
  id: string;
  projectId: string;
  type: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
