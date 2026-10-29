import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseLocalUri, verifyLocalTicket } from '../src/local-ticket.js';
import { validateConfig } from './config.mjs';
import { LocalState } from './state.mjs';
import { LocalDocker } from './docker.mjs';
import { statusServer } from './status.mjs';
import { NativeRuntime } from './native.mjs';

const execute = promisify(execFile);
export async function openBrowser(url) {
  const command = Buffer.from('Start-Process -FilePath $env:YAQI_LOCAL_OPEN_URL', 'utf16le').toString('base64');
  const powershell = join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  await execute(powershell, ['-NoProfile','-NonInteractive','-EncodedCommand',command], { shell: false, windowsHide: true, timeout: 10000, env: { ...process.env, YAQI_LOCAL_OPEN_URL: url } });
}
export async function launchLocal(uri, config, dependencies = {}) {
  validateConfig(config);
  let ticket;
  try { ticket = await verifyLocalTicket(parseLocalUri(uri), config.public_key, config.issuer); } catch { throw new Error('ticket'); }
  const project = config.projects[ticket.sub];
  const status = await (dependencies.statusServer || statusServer)(ticket.lang, project?.title || '');
  const store = new LocalState(config.state_path), started = [];
  let operation;
  try {
    operation = store.begin(ticket);
    await (dependencies.openBrowser || openBrowser)(status.url);
    if (!project) throw new Error('not_configured');
    if (project.mode === 'unavailable') throw new Error('blocked');
    const docker = dependencies.docker || new LocalDocker(config);
    const update = stage => { store.update(operation, started); status.set(stage); };
    const recordStarted = id => { started.push(id); store.update(operation, started); };
    const result = ['native','sample','android'].includes(project.mode)
      ? await (dependencies.native || new NativeRuntime(config,{docker})).launch(project,ticket.sub,store,update,recordStarted)
      : {url:await docker.launch(project,update,recordStarted)};
    store.update(operation, started, 'ready'); status.set('ready','',result.url || '',false,project.reason?.[ticket.lang] || project.reason?.zh || '',result.output || '');
    return { state: 'ready', ...result, started, status };
  } catch (error) {
    const code = ['ticket','busy','not_configured','blocked','context','container','unavailable','health','config','artifact','process','device'].includes(error.message) ? error.message : 'unknown';
    if (operation) store.update(operation, started, 'failed', code);
    status.set('failed', code, '', started.length > 0, code === 'blocked' ? project.reason?.[ticket.lang] || project.reason?.zh || '' : '');
    if (!operation) await (dependencies.openBrowser || openBrowser)(status.url);
    return { state: 'failed', error: code, started, status };
  } finally { store.close(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 5 || process.argv[2] !== '--config') throw new Error('Expected --config <private-config.json> <yaqi-local-uri>');
  try {
    const config = JSON.parse(await readFile(process.argv[3], 'utf8'));
    const result = await launchLocal(process.argv[4], config);
    setTimeout(() => result.status.close(), result.state === 'ready' ? 60000 : 300000);
  } catch {
    const status = await statusServer('zh',''); status.set('failed','ticket');
    await openBrowser(status.url);
    setTimeout(() => status.close(), 120000);
  }
}
