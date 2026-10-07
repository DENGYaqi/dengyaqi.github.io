CREATE TABLE glossary_terms (
  key TEXT PRIMARY KEY,
  translations TEXT NOT NULL CHECK (json_valid(translations))
);

CREATE TABLE project_glossary_terms (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  term_key TEXT NOT NULL REFERENCES glossary_terms(key) ON DELETE CASCADE,
  PRIMARY KEY (project_id, term_key)
);
