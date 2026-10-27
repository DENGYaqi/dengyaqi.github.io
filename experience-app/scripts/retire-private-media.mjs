import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { checkRetirements, wrangler } from './upload-private-gifs.mjs';

const [input, mode, confirmation] = process.argv.slice(2);
if (!input || !['--local', '--remote'].includes(mode) || (confirmation && confirmation !== '--delete-verified')) throw new Error('Usage: node scripts/retire-private-media.mjs <private.json> --local|--remote [--delete-verified]');
const data = JSON.parse(readFileSync(input, 'utf8'));
const snapshot = wrangler(['d1', 'execute', 'yaqi-projects', mode, '--command', 'SELECT id, object_key FROM media; SELECT id, translations FROM projects;', '--json'], true);
// Inspect current published references, rather than trusting the intended replacement content.
const current = { ...data, projects: snapshot[1].results.filter(project => (data.projects ?? []).some(item => item.id === project.id)) };
const retired = checkRetirements(current, undefined, snapshot[1].results);
if (retired.some(item => snapshot[0].results.some(record => record.id === item.id || record.object_key === item.object_key))) throw new Error('Old media is still registered; finish and verify the content switch first');
const directory = mkdtempSync(join(tmpdir(), 'yaqi-retire-media-'));
const file = join(directory, 'object');
try {
  for (const item of retired) {
    wrangler(['r2', 'object', 'get', `yaqi-projects-media/${item.object_key}`, mode, '--file', file]);
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (hash !== item.sha256.toLowerCase()) throw new Error('Remote object differs from its backup; refusing deletion');
    unlinkSync(file);
  }
  console.table(retired.map(({ id, project_id, object_key }) => ({ id, project_id, object_key })));
  if (confirmation) for (const item of retired) wrangler(['r2', 'object', 'delete', `yaqi-projects-media/${item.object_key}`, mode]);
  console.log(confirmation ? `Removed ${retired.length} verified old objects; private backups retained.` : 'Verified only. After page acceptance, add --delete-verified to remove exactly these objects.');
} finally {
  try { unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  rmdirSync(directory);
}
