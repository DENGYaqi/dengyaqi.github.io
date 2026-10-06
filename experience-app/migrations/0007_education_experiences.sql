CREATE TABLE IF NOT EXISTS education_experiences (
  key TEXT PRIMARY KEY REFERENCES educations(key),
  details TEXT NOT NULL,
  projects TEXT NOT NULL
);
