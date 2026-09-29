ALTER TABLE projects ADD COLUMN education_keys TEXT NOT NULL DEFAULT '[]';

CREATE TABLE educations (
  key TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  translations TEXT NOT NULL DEFAULT '{}'
);
