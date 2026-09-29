CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  target_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  created_at INTEGER NOT NULL,
  handled_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_one_pending ON access_requests(email) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS access_requests_recent ON access_requests(status, created_at DESC);
