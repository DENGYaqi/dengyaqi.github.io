import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { now } from '../src/runtime-shared.js';

export class LocalState {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, state TEXT NOT NULL, updated_at INTEGER NOT NULL, started_ids TEXT NOT NULL DEFAULT '[]', error TEXT NOT NULL DEFAULT '');
      CREATE UNIQUE INDEX IF NOT EXISTS active_project ON operations(project_id) WHERE state = 'starting';
      CREATE TABLE IF NOT EXISTS native_instances (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, pid INTEGER NOT NULL, started_at TEXT NOT NULL, executable TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runtime_locks (key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);`);
  }
  begin(ticket) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM tickets WHERE expires_at < ?').run(now() - 300);
      this.db.prepare("UPDATE operations SET state='failed',error='interrupted' WHERE state='starting' AND updated_at < ?").run(now() - 600);
      if (this.db.prepare('SELECT id FROM tickets WHERE id = ?').get(ticket.jti)) throw new Error('ticket');
      if (this.db.prepare("SELECT COUNT(*) AS n FROM operations WHERE state='starting'").get().n >= 2 || this.db.prepare("SELECT id FROM operations WHERE project_id = ? AND state='starting'").get(ticket.sub)) throw new Error('busy');
      this.db.prepare('INSERT INTO tickets VALUES (?,?)').run(ticket.jti, ticket.exp);
      const id = crypto.randomUUID();
      this.db.prepare("INSERT INTO operations (id,project_id,state,updated_at) VALUES (?,?,'starting',?)").run(id, ticket.sub, now());
      this.db.exec('COMMIT'); return id;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  update(id, started, state = 'starting', error = '') {
    this.db.prepare('UPDATE operations SET state=?,updated_at=?,started_ids=?,error=? WHERE id=?').run(state, now(), JSON.stringify(started), error, id);
  }
  instance(key) { return this.db.prepare('SELECT * FROM native_instances WHERE key=?').get(key); }
  remember(key, fingerprint, process) {
    this.db.prepare('INSERT OR REPLACE INTO native_instances VALUES (?,?,?,?,?)').run(key, fingerprint, process.pid, process.started_at, process.executable);
  }
  lock(key) {
    if (!this.db.prepare('INSERT INTO runtime_locks VALUES (?,?) ON CONFLICT(key) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at < ?').run(key, now()+240, now()).changes) throw new Error('busy');
  }
  unlock(key) { this.db.prepare('DELETE FROM runtime_locks WHERE key=?').run(key); }
  close() { this.db.close(); }
}
