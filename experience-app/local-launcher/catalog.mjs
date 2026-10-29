import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './config.mjs';
import { localCatalog } from '../src/local-launch.js';

export function exportCatalog(config) {
  validateConfig(config);
  const catalog = {}, enabled = [];
  for (const [id,project] of Object.entries(config.projects)) {
    if (!project.display) continue;
    const {kind,note,file_id} = project.display;
    const expected = {docker:'web',open:'web',native:project.open_url ? 'web' : 'desktop',sample:'sample',android:'android'}[project.mode];
    if (expected ? kind !== expected : !['document','unavailable'].includes(kind)) throw new Error('catalog');
    if (kind === 'document' && !file_id) throw new Error('catalog');
    // Explicitly copy public fields; never serialize executable paths, environment or container data.
    catalog[id] = {kind,note:Object.fromEntries(['zh','en','ja','fr'].map(lang=>[lang,note?.[lang]])),...(kind === 'document' ? {file_id} : {})};
    if (expected) enabled.push(id);
  }
  const json = JSON.stringify(catalog);
  if (Object.keys(localCatalog({LOCAL_LAUNCH_CATALOG:json})).length !== Object.keys(catalog).length) throw new Error('catalog');
  const result = {LOCAL_LAUNCH_PROJECT_IDS:JSON.stringify(enabled),LOCAL_LAUNCH_CATALOG:json};
  // Worker variables, including secrets, are limited to 5 KB each.
  if (Buffer.byteLength(json) > 4500) {
    const parts = []; let part = {};
    for (const [id,item] of Object.entries(catalog)) {
      if (Buffer.byteLength(JSON.stringify({[id]:item})) > 4500) throw new Error('catalog entry too large');
      if (Buffer.byteLength(JSON.stringify({...part,[id]:item})) > 4500) { parts.push(part); part={}; }
      part[id]=item;
    }
    if (Object.keys(part).length) parts.push(part);
    if (parts.length > 16) throw new Error('catalog too large');
    result.LOCAL_LAUNCH_CATALOG=JSON.stringify({parts:parts.length});
    parts.forEach((value,index)=>{result[`LOCAL_LAUNCH_CATALOG_${index+1}`]=JSON.stringify(value);});
  }
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw new Error('Expected <private-config.json> <cloud-settings.json>');
  const result = exportCatalog(JSON.parse(await readFile(process.argv[2],'utf8')));
  await writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n');
  console.log(`Prepared ${JSON.parse(result.LOCAL_LAUNCH_PROJECT_IDS).length} launch entries. No private runtime data exported.`);
}
