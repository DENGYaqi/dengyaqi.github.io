CREATE TABLE project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  download_name TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX project_files_project ON project_files (project_id, created_at);
