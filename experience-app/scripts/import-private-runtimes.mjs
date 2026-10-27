import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { digest, publicOrigin, tokenPattern, uuidPattern } from '../src/runtime-shared.js';

const keyPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
export async function runtimeSql(data) {
  if (!Array.isArray(data.agents) || !Array.isArray(data.projects)) throw new Error('agents and projects must be arrays');
  const sql = [], agents = new Set(), projects = new Set(), keys = new Set(), origins = new Set();
  for (const agent of data.agents) {
    if (!keyPattern.test(agent.id) || agents.has(agent.id) || !tokenPattern.test(agent.token) || typeof agent.enabled !== 'boolean') throw new Error('Invalid agent');
    agents.add(agent.id);
    sql.push(`INSERT INTO runtime_agents (id, token_hash, enabled) VALUES (${quote(agent.id)},${quote(await digest(agent.token))},${Number(agent.enabled)}) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash,enabled=excluded.enabled;`);
  }
  for (const project of data.projects) {
    const origin = project.gateway_origin || '', duration = project.duration_seconds ?? 1800;
    if (!uuidPattern.test(project.project_id) || projects.has(project.project_id) || !keyPattern.test(project.runtime_key) || keys.has(project.runtime_key) || !agents.has(project.agent_id) || typeof project.enabled !== 'boolean' || !Number.isInteger(duration) || duration < 60 || duration > 1800 || (origin && (!publicOrigin(origin) || origins.has(origin))) || (project.enabled && !origin)) throw new Error('Invalid project runtime');
    projects.add(project.project_id); keys.add(project.runtime_key); if (origin) origins.add(origin);
    // Refuse to retarget an active runtime. Stop its sessions first.
    sql.push(`INSERT INTO project_runtimes (project_id,runtime_key,agent_id,gateway_origin,enabled,duration_seconds) VALUES (${quote(project.project_id)},${quote(project.runtime_key)},${quote(project.agent_id)},${quote(origin)},${Number(project.enabled)},${duration}) ON CONFLICT(project_id) DO UPDATE SET runtime_key=excluded.runtime_key,agent_id=excluded.agent_id,gateway_origin=excluded.gateway_origin,enabled=excluded.enabled,duration_seconds=excluded.duration_seconds;`);
  }
  return sql;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, mode] = process.argv.slice(2);
  if (!input || (mode && !['--local','--remote'].includes(mode))) throw new Error('Usage: node scripts/import-private-runtimes.mjs <private.json> [--local|--remote]');
  const sql = await runtimeSql(JSON.parse(readFileSync(input, 'utf8')));
  if (!mode) process.stdout.write('Runtime configuration validated. No database changes.\n');
  else {
    const directory = mkdtempSync(join(tmpdir(), 'yaqi-runtime-')), file = join(directory, 'import.sql');
    try {
      writeFileSync(file, mode === '--local' ? `BEGIN TRANSACTION;\n${sql.join('\n')}\nCOMMIT;\n` : sql.join('\n'), { mode: 0o600 });
      const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
      const result = spawnSync(process.execPath, [cli, 'd1', 'execute', 'yaqi-projects', mode, '--file', file], { stdio: 'inherit' });
      if (result.error) throw result.error;
      process.exitCode = result.status || 0;
    } finally { unlinkSync(file); rmdirSync(directory); }
  }
}
