CREATE TABLE runtime_agents (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  last_seen INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE project_runtimes (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  runtime_key TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL REFERENCES runtime_agents(id),
  gateway_origin TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  duration_seconds INTEGER NOT NULL DEFAULT 1800 CHECK (duration_seconds BETWEEN 60 AND 1800)
);
CREATE TABLE project_runtime_grants (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES project_runtimes(project_id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, project_id)
);
CREATE TABLE runtime_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project_runtimes(project_id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  session_hash TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES runtime_agents(id),
  state TEXT NOT NULL CHECK (state IN ('queued','starting','ready','stopping','stopped','failed')),
  slot INTEGER NOT NULL CHECK (slot IN (1, 2)),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  claim_hash TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  error_code TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX runtime_active_project ON runtime_runs(project_id) WHERE state IN ('queued','starting','ready','stopping');
CREATE UNIQUE INDEX runtime_active_slot ON runtime_runs(slot) WHERE state IN ('queued','starting','ready','stopping');
CREATE INDEX runtime_run_agent ON runtime_runs(agent_id, state);
CREATE INDEX runtime_run_account ON runtime_runs(account_id, created_at);
CREATE TABLE runtime_access (
  token_hash TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runtime_runs(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('code','session')),
  state_hash TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL
);
CREATE INDEX runtime_access_expiry ON runtime_access(expires_at);
CREATE UNIQUE INDEX runtime_gateway_origin ON project_runtimes(gateway_origin) WHERE gateway_origin <> '';
CREATE TRIGGER runtime_prevent_active_retarget
BEFORE UPDATE OF runtime_key, agent_id, gateway_origin ON project_runtimes
WHEN (NEW.runtime_key <> OLD.runtime_key OR NEW.agent_id <> OLD.agent_id OR NEW.gateway_origin <> OLD.gateway_origin)
  AND EXISTS (SELECT 1 FROM runtime_runs WHERE project_id = OLD.project_id AND state IN ('queued','starting','ready','stopping'))
BEGIN
  SELECT RAISE(ABORT, 'Stop active runtime sessions before changing their target');
END;
