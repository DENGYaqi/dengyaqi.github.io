import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

export function wrangler(args, capture = false) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler ${args[0]} ${args[1]} failed${capture ? `: ${result.stderr || result.stdout}` : ''}`);
  return capture ? JSON.parse(result.stdout) : undefined;
}

export async function prepareMedia(data) {
  if (!Array.isArray(data.media ?? [])) throw new Error('media must be an array');
  const prepared = [];
  for (const item of data.media ?? []) {
    const order = Number(item.sort_order ?? 0);
    if (!idPattern.test(item.id) || !idPattern.test(item.project_id) || typeof item.file !== 'string' || !item.file || !Number.isSafeInteger(order)) throw new Error('Media needs valid IDs, file, and sort_order');
    if ((data.preserve_project_ids ?? []).includes(item.project_id)) throw new Error('Cannot replace a preserved project');
    const file = resolve(item.file), bytes = statSync(file).size;
    if (!bytes || bytes > 24 * 1024 * 1024) throw new Error('Media must be between 1 byte and 24 MiB');
    const decoder = sharp(readFileSync(file), { animated: true, failOn: 'warning', limitInputPixels: 300_000_000 });
    const info = await decoder.metadata();
    const types = { gif: 'image/gif', png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
    const frames = info.pages ?? 1, height = info.pageHeight ?? info.height;
    if (!types[info.format] || info.width > 2560 || height > 1600 || (info.format === 'gif' ? frames < 2 || frames > 600 : frames !== 1 || bytes > 4 * 1024 * 1024)) throw new Error('Expected an animated GIF or a static poster, up to 2560 × 1600');
    await decoder.stats(); // Decode every frame; a valid header alone does not prove the file is usable.
    prepared.push({ ...item, file, order, bytes, content_type: types[info.format], key: `projects/${item.project_id}/${info.format === 'gif' ? 'gifs' : 'posters'}/${item.id}.${info.format}` });
  }
  if (new Set(prepared.map(item => item.id)).size !== prepared.length) throw new Error('Duplicate media ID');
  return prepared;
}

export function checkMediaReferences(data, prepared, existing, projectIds) {
  const records = new Map(existing.map(item => [item.id, item]));
  const knownProjects = new Set([...projectIds, ...(data.projects ?? []).map(item => item.id)]);
  for (const item of prepared) {
    if (records.has(item.id)) throw new Error('Use a new media ID; existing media must not be overwritten');
    if (!knownProjects.has(item.project_id)) throw new Error('Media project does not exist');
    records.set(item.id, item);
  }
  for (const project of data.projects ?? []) {
    if ((data.preserve_project_ids ?? []).includes(project.id)) throw new Error('Cannot replace a preserved project');
    for (const translation of Object.values(project.translations ?? {})) {
      for (const module of translation.modules ?? []) {
        const gif = records.get(module.media_id), poster = records.get(module.poster_id);
        if (!gif || gif.project_id !== project.id || gif.content_type !== 'image/gif') throw new Error('Demo GIF must belong to its project');
        if (module.poster_id && (!poster || poster.project_id !== project.id || !['image/png', 'image/jpeg', 'image/webp'].includes(poster.content_type))) throw new Error('Demo poster must be a static image owned by its project');
      }
    }
  }
}

export function checkRemoteMedia(data, prepared, mode) {
  const result = wrangler(['d1', 'execute', 'yaqi-projects', mode, '--command', 'SELECT id, project_id, content_type, object_key FROM media; SELECT id, translations FROM projects;', '--json'], true);
  checkMediaReferences(data, prepared, result[0].results, result[1].results.map(item => item.id));
  checkRetirements(data, result[0].results, result[1].results);
}

export function checkRetirements(data, existing, projects = []) {
  const retired = data.retire_media ?? [];
  if (!Array.isArray(retired) || new Set(retired.map(item => item.id)).size !== retired.length) throw new Error('retire_media must contain unique media IDs');
  const replacements = new Map((data.projects ?? []).map(project => [project.id, project]));
  const records = existing && new Map(existing.map(item => [item.id, item]));
  const references = new Set();
  for (const project of [...projects.filter(project => !replacements.has(project.id)), ...replacements.values()]) {
    const translations = typeof project.translations === 'string' ? JSON.parse(project.translations) : project.translations;
    for (const translation of Object.values(translations ?? {})) for (const module of translation.modules ?? []) {
      references.add(module.media_id);
      references.add(module.poster_id);
    }
  }
  for (const item of retired) {
    if (!idPattern.test(item.id) || !idPattern.test(item.project_id) || !replacements.has(item.project_id) || (data.preserve_project_ids ?? []).includes(item.project_id)) throw new Error('Retired media must belong to a replaced, unprotected project');
    if (typeof item.object_key !== 'string' || !item.object_key.startsWith(`projects/${item.project_id}/`) || item.object_key.includes('..') || item.object_key.includes('\\') || typeof item.backup_file !== 'string' || !/^[a-f0-9]{64}$/i.test(item.sha256 ?? '')) throw new Error('Retired media needs its exact object key and a verified backup');
    const hash = createHash('sha256').update(readFileSync(item.backup_file)).digest('hex');
    if (hash !== item.sha256.toLowerCase()) throw new Error('Retired media backup checksum mismatch');
    if (references.has(item.id) || (data.media ?? []).some(media => media.id === item.id)) throw new Error('Cannot retire referenced or newly uploaded media');
    const record = records?.get(item.id);
    if (records && (!record || record.project_id !== item.project_id || record.object_key !== item.object_key)) throw new Error('Retired media no longer matches the database');
  }
  return retired;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, mode] = process.argv.slice(2);
  if (!input || (mode && !['--local', '--remote'].includes(mode))) throw new Error('Usage: node scripts/upload-private-gifs.mjs <private.json> [--local|--remote]');
  const data = JSON.parse(readFileSync(input, 'utf8'));
  const prepared = await prepareMedia(data);
  const importer = fileURLToPath(new URL('./import-private-content.mjs', import.meta.url));
  const validation = spawnSync(process.execPath, [importer, input], { stdio: 'inherit' });
  if (validation.error) throw validation.error;
  if (validation.status !== 0) throw new Error('Content validation failed; no media uploaded');
  console.table(prepared.map(({ id, project_id, bytes, content_type }) => ({ id, project_id, bytes, content_type })));
  if (mode) {
    checkRemoteMedia(data, prepared, mode);
    for (const item of prepared) wrangler(['r2', 'object', 'put', `yaqi-projects-media/${item.key}`, mode, '--file', item.file, '--content-type', item.content_type]);
    // Register media and switch content only after every upload succeeded. Old objects remain recoverable.
    const result = spawnSync(process.execPath, [importer, input, mode], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Content switch failed; old media retained. New objects may be orphaned.');
    console.log(`Imported ${prepared.length} media files to ${mode.slice(2)} storage.`);
  } else console.log('Validated only. Add --local or --remote to upload and switch content.');
}
