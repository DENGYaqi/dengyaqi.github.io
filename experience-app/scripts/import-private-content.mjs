import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const input = process.argv[2];
const mode = process.argv[3];
if (!input || (mode && !['--local', '--remote'].includes(mode))) throw new Error('Usage: node scripts/import-private-content.mjs <private.json> [--local|--remote]');
const data = JSON.parse(readFileSync(input, 'utf8'));
const schools = data.educations ?? [];
const projects = data.projects ?? [];
if (!Array.isArray(schools) || !Array.isArray(projects)) throw new Error('educations and projects must be arrays');
const keyPattern = /^[a-z0-9_]+$/;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const orderOf = value => {
  const order = Number(value ?? 0);
  if (!Number.isSafeInteger(order)) throw new Error('sort_order must be an integer');
  return order;
};
const sql = [];
for (const school of schools) {
  if (!keyPattern.test(school.key) || !school.translations?.zh?.school) throw new Error('Education requires a key and a Chinese school name');
  sql.push(`INSERT INTO educations (key, sort_order, translations) VALUES (${quote(school.key)}, ${orderOf(school.sort_order)}, ${quote(JSON.stringify(school.translations))}) ON CONFLICT(key) DO UPDATE SET sort_order = excluded.sort_order, translations = excluded.translations;`);
}
for (const project of projects) {
  if (!idPattern.test(project.id) || !['draft', 'published'].includes(project.status) || !Array.isArray(project.education_keys) || project.education_keys.some(key => !keyPattern.test(key))) throw new Error('Project requires a UUID, status, and education_keys');
  if (project.status === 'published' && (!project.education_keys.length || !['zh', 'en', 'ja', 'fr'].every(lang => project.translations?.[lang]?.title && project.translations?.[lang]?.summary && project.translations?.[lang]?.body))) throw new Error('Published education projects need four complete translations');
  const now = new Date().toISOString();
  sql.push(`INSERT INTO projects (id, status, sort_order, translations, experience_keys, education_keys, created_at, updated_at) VALUES (${quote(project.id)}, ${quote(project.status)}, ${orderOf(project.sort_order)}, ${quote(JSON.stringify(project.translations ?? {}))}, '[]', ${quote(JSON.stringify(project.education_keys))}, ${quote(now)}, ${quote(now)}) ON CONFLICT(id) DO UPDATE SET status = excluded.status, sort_order = excluded.sort_order, translations = excluded.translations, education_keys = excluded.education_keys, updated_at = excluded.updated_at;`);
}
if (!mode) {
  process.stdout.write(`Validated ${schools.length} education entries and ${projects.length} projects. Add --local or --remote to import.\n`);
  process.exit(0);
}
const temp = mkdtempSync(join(tmpdir(), 'yaqi-private-import-'));
const file = join(temp, 'import.sql');
try {
  writeFileSync(file, `BEGIN TRANSACTION;\n${sql.join('\n')}\nCOMMIT;\n`, { mode: 0o600 });
  const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'd1', 'execute', 'yaqi-projects', mode, '--file', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  unlinkSync(file);
  rmdirSync(temp);
}
