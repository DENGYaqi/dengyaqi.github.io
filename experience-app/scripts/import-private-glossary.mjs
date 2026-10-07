import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [input, mode] = process.argv.slice(2);
if (!input || (mode && !['--local', '--remote'].includes(mode))) throw new Error('Usage: node scripts/import-private-glossary.mjs <private.json> [--local|--remote]');
const { terms, projects } = JSON.parse(readFileSync(input, 'utf8'));
if (!Array.isArray(terms) || !Array.isArray(projects)) throw new Error('terms and projects must be arrays');
const languages = ['zh', 'en', 'ja', 'fr'];
const keyPattern = /^[a-z][a-z0-9_-]*$/;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const termKeys = new Set(), projectIds = new Set(), sql = [];

for (const term of terms) {
  if (!keyPattern.test(term.key) || termKeys.has(term.key) || !languages.every(lang => ['text', 'definition'].every(field => typeof term.translations?.[lang]?.[field] === 'string' && term.translations[lang][field].trim()))) throw new Error('Each term needs a unique key and four nonempty translations');
  termKeys.add(term.key);
  sql.push(`INSERT INTO glossary_terms (key, translations) VALUES (${quote(term.key)}, ${quote(JSON.stringify(term.translations))}) ON CONFLICT(key) DO UPDATE SET translations = excluded.translations;`);
}
for (const project of projects) {
  if (!idPattern.test(project.id) || projectIds.has(project.id) || !Array.isArray(project.terms) || new Set(project.terms).size !== project.terms.length || project.terms.some(key => !termKeys.has(key))) throw new Error('Each project needs a unique UUID and known, nonduplicate term keys');
  projectIds.add(project.id);
  for (const key of project.terms) sql.push(`INSERT OR IGNORE INTO project_glossary_terms (project_id, term_key) VALUES (${quote(project.id)}, ${quote(key)});`);
  sql.push(project.terms.length
    ? `DELETE FROM project_glossary_terms WHERE project_id = ${quote(project.id)} AND term_key NOT IN (${project.terms.map(quote).join(', ')});`
    : `DELETE FROM project_glossary_terms WHERE project_id = ${quote(project.id)};`);
}
if (!mode) {
  process.stdout.write(`Validated ${terms.length} terms for ${projects.length} projects. Add --local or --remote to import.\n`);
  process.exit(0);
}
const temp = mkdtempSync(join(tmpdir(), 'yaqi-glossary-'));
const file = join(temp, 'import.sql');
try {
  writeFileSync(file, mode === '--local' ? `BEGIN TRANSACTION;\n${sql.join('\n')}\nCOMMIT;\n` : sql.join('\n'), { mode: 0o600 });
  const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'd1', 'execute', 'yaqi-projects', mode, '--file', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  unlinkSync(file);
  rmdirSync(temp);
}
