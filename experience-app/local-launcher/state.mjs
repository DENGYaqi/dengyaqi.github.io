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
      CREATE TABLE IF NOT EXISTS runtime_locks (key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, owner TEXT NOT NULL DEFAULT '');`);
    // Serialize the legacy schema check and migration across launcher processes.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (!this.db.prepare('PRAGMA table_info(runtime_locks)').all().some(column => column.name === 'owner')) this.db.exec("ALTER TABLE runtime_locks ADD COLUMN owner TEXT NOT NULL DEFAULT ''");
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); this.db.close(); throw error; }
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
  forget(key) { this.db.prepare('DELETE FROM native_instances WHERE key=?').run(key); }
  remember(key, fingerprint, process) {
    this.db.prepare('INSERT OR REPLACE INTO native_instances VALUES (?,?,?,?,?)').run(key, fingerprint, process.pid, process.started_at, process.executable);
  }
  lock(key) {
    const owner = crypto.randomUUID(), timestamp = now();
    if (!this.db.prepare('INSERT INTO runtime_locks (key,expires_at,owner) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET expires_at=excluded.expires_at,owner=excluded.owner WHERE expires_at < ?').run(key, timestamp+240, owner, timestamp).changes) throw new Error('busy');
    return owner;
  }
  unlock(key, owner) {
    if (typeof owner !== 'string' || !owner) return false;
    return this.db.prepare('DELETE FROM runtime_locks WHERE key=? AND owner=?').run(key, owner).changes > 0;
  }
  close() { this.db.close(); }
}
