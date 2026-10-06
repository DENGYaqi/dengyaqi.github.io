import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [input, mode] = process.argv.slice(2);
if (!input || !['--local', '--remote'].includes(mode)) throw new Error('Usage: node scripts/upload-private-gifs.mjs <private.json> --local|--remote');
const media = JSON.parse(readFileSync(input, 'utf8')).media;
if (!Array.isArray(media)) throw new Error('media must be an array');
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const prepared = media.map(item => {
  const file = resolve(item.file || '');
  const header = readFileSync(file).subarray(0, 6).toString('ascii');
  const order = Number(item.sort_order ?? 0);
  if (!idPattern.test(item.id) || !idPattern.test(item.project_id) || !['GIF87a', 'GIF89a'].includes(header) || !Number.isSafeInteger(order) || !statSync(file).size) throw new Error('GIF needs valid IDs, file content, and sort_order');
  return { ...item, file, order, key: `projects/${item.project_id}/gifs/${item.id}.gif` };
});
if (new Set(prepared.map(item => item.id)).size !== prepared.length) throw new Error('Duplicate GIF ID');
for (const item of prepared) {
  for (const args of [
    ['r2', 'object', 'put', `yaqi-projects-media/${item.key}`, mode, '--file', item.file, '--content-type', 'image/gif'],
    ['d1', 'execute', 'yaqi-projects', mode, '--command', `INSERT INTO media (id, project_id, object_key, content_type, sort_order, created_at) VALUES ('${item.id}', '${item.project_id}', '${item.key}', 'image/gif', ${item.order}, datetime('now')) ON CONFLICT(id) DO UPDATE SET object_key = excluded.object_key, content_type = excluded.content_type, sort_order = excluded.sort_order WHERE media.project_id = excluded.project_id;`],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`GIF import failed for ${item.id}`);
  }
}
console.log(`Imported ${prepared.length} GIFs to ${mode.slice(2)} storage.`);
