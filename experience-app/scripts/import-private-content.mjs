import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import experiences from '../src/experiences.json' with { type: 'json' };

const input = process.argv[2];
const mode = process.argv[3];
if (!input || (mode && !['--local', '--remote'].includes(mode))) throw new Error('Usage: node scripts/import-private-content.mjs <private.json> [--local|--remote]');
const data = JSON.parse(readFileSync(input, 'utf8'));
const schools = data.educations ?? [];
const projects = data.projects ?? [];
const work = data.work_experiences ?? [];
const education = data.education_experiences ?? [];
if (!Array.isArray(schools) || !Array.isArray(projects) || !Array.isArray(work) || !Array.isArray(education)) throw new Error('educations, projects, work_experiences, and education_experiences must be arrays');
const keyPattern = /^[a-z0-9_]+$/;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const orderOf = value => {
  const order = Number(value ?? 0);
  if (!Number.isSafeInteger(order)) throw new Error('sort_order must be an integer');
  return order;
};
const sql = [];
const workKeys = new Set(experiences.map(item => item.key));
const seenWork = new Set();
for (const item of work) {
  if (!workKeys.has(item.key) || seenWork.has(item.key) || !['zh', 'en', 'ja', 'fr'].every(lang => typeof item.description?.[lang] === 'string' && item.description[lang].trim()) || !Array.isArray(item.projects) || !item.projects.length || item.projects.some(project => !['zh', 'en', 'ja', 'fr'].every(lang => typeof project.title?.[lang] === 'string' && project.title[lang].trim()) || (project.project_id != null && !idPattern.test(project.project_id)))) throw new Error('Work experience requires a known unique key, four descriptions, and translated project names with optional UUID links');
  seenWork.add(item.key);
  sql.push(`INSERT INTO work_experiences (key, description, projects) VALUES (${quote(item.key)}, ${quote(JSON.stringify(item.description))}, ${quote(JSON.stringify(item.projects))}) ON CONFLICT(key) DO UPDATE SET description = excluded.description, projects = excluded.projects;`);
}
for (const school of schools) {
  if (!keyPattern.test(school.key) || !school.translations?.zh?.school) throw new Error('Education requires a key and a Chinese school name');
  sql.push(`INSERT INTO educations (key, sort_order, translations) VALUES (${quote(school.key)}, ${orderOf(school.sort_order)}, ${quote(JSON.stringify(school.translations))}) ON CONFLICT(key) DO UPDATE SET sort_order = excluded.sort_order, translations = excluded.translations;`);
}
const seenEducation = new Set();
for (const item of education) {
  if (!keyPattern.test(item.key) || seenEducation.has(item.key) || !['zh', 'en', 'ja', 'fr'].every(lang => ['degree', 'study_mode', 'major'].every(field => typeof item.details?.[lang]?.[field] === 'string' && item.details[lang][field].trim())) || !Array.isArray(item.projects) || item.projects.some(project => !['zh', 'en', 'ja', 'fr'].every(lang => typeof project.title?.[lang] === 'string' && project.title[lang].trim()) || (project.project_id != null && !idPattern.test(project.project_id)))) throw new Error('Education experience requires a unique key, four complete detail translations, and translated project names with optional UUID links');
  seenEducation.add(item.key);
  sql.push(`INSERT INTO education_experiences (key, details, projects) VALUES (${quote(item.key)}, ${quote(JSON.stringify(item.details))}, ${quote(JSON.stringify(item.projects))}) ON CONFLICT(key) DO UPDATE SET details = excluded.details, projects = excluded.projects;`);
}
for (const project of projects) {
  if (!idPattern.test(project.id) || !['draft', 'published'].includes(project.status) || !Array.isArray(project.education_keys) || project.education_keys.some(key => !keyPattern.test(key)) || !Array.isArray(project.experience_keys ?? []) || (project.experience_keys ?? []).some(key => !keyPattern.test(key))) throw new Error('Project requires a UUID, status, and valid related keys');
  if (project.status === 'published' && !['zh', 'en', 'ja', 'fr'].every(lang => project.translations?.[lang]?.title && project.translations?.[lang]?.summary && project.translations?.[lang]?.body)) throw new Error('Published projects need four complete translations');
  const modules = ['zh', 'en', 'ja', 'fr'].map(lang => project.translations?.[lang]?.modules);
  if (modules.some(Boolean) && (!modules.every(items => Array.isArray(items) && items.length === modules[0].length && items.every((item, index) => idPattern.test(item.media_id) && item.media_id === modules[0][index].media_id && typeof item.title === 'string' && item.title.trim())) || new Set(modules[0].map(item => item.media_id)).size !== modules[0].length)) throw new Error('Project GIF modules need matching media IDs and titles in all four languages');
  const now = new Date().toISOString();
  sql.push(`INSERT INTO projects (id, status, sort_order, translations, experience_keys, education_keys, created_at, updated_at) VALUES (${quote(project.id)}, ${quote(project.status)}, ${orderOf(project.sort_order)}, ${quote(JSON.stringify(project.translations ?? {}))}, ${quote(JSON.stringify(project.experience_keys ?? []))}, ${quote(JSON.stringify(project.education_keys))}, ${quote(now)}, ${quote(now)}) ON CONFLICT(id) DO UPDATE SET status = excluded.status, sort_order = excluded.sort_order, translations = excluded.translations, experience_keys = excluded.experience_keys, education_keys = excluded.education_keys, updated_at = excluded.updated_at;`);
}
if (!mode) {
  process.stdout.write(`Validated ${schools.length} education entries, ${projects.length} projects, ${work.length} work experiences, and ${education.length} education experiences. Add --local or --remote to import.\n`);
  process.exit(0);
}
const temp = mkdtempSync(join(tmpdir(), 'yaqi-private-import-'));
const file = join(temp, 'import.sql');
try {
  writeFileSync(file, mode === '--local' ? `BEGIN TRANSACTION;\n${sql.join('\n')}\nCOMMIT;\n` : `${sql.join('\n')}\n`, { mode: 0o600 });
  const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'd1', 'execute', 'yaqi-projects', mode, '--file', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  unlinkSync(file);
  rmdirSync(temp);
}
