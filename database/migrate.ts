export const SCHEMA_VERSION = 2;

export const baseTablesSql = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export const addProjectStatusSql = `ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active';`;

export const constructionsSql = `
CREATE TABLE IF NOT EXISTS constructions (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS constructions_by_project ON constructions (project_id);
`;

export function upgradeSql(projectColumns: readonly string[]): string[] {
  const steps = [baseTablesSql];
  if (!projectColumns.includes('status')) {
    steps.push(addProjectStatusSql);
  }
  steps.push(constructionsSql);
  return steps;
}
