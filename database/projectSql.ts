export const listProjectsSql = `SELECT id, name, description, status, created_at, updated_at
  FROM projects
  ORDER BY updated_at DESC`;

export const listConstructionsSql = `SELECT id, project_id, type, name, created_at, updated_at
  FROM constructions
  ORDER BY created_at ASC`;

export const insertProjectSql = `INSERT INTO projects (id, name, description, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)`;

export const updateProjectSql = `UPDATE projects
  SET name = ?, description = ?, status = ?, updated_at = ?
  WHERE id = ?`;

export const deleteConstructionsSql = `DELETE FROM constructions WHERE project_id = ?`;

export const deleteProjectSql = `DELETE FROM projects WHERE id = ?`;
