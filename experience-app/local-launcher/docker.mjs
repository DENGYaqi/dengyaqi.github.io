import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fingerprint, localUrl } from './config.mjs';

const execute = promisify(execFile);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export class LocalDocker {
  constructor(config, dependencies = {}) {
    this.config = config;
    this.fetch = dependencies.fetch || fetch;
    this.sleep = dependencies.sleep || sleep;
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^DOCKER_/i.test(key)));
    this.command = dependencies.command || (async (args, timeout = 20000) => (await execute(config.docker_path, args, { shell: false, windowsHide: true, env, timeout, maxBuffer: 4 * 1024 * 1024 })).stdout);
  }
  commandLocal(args, timeout) { return this.command(['--context', this.config.context.name, ...args], timeout); }
  async ensureEngine(update) {
    let contexts;
    try { contexts = JSON.parse(await this.command(['context','inspect',this.config.context.name])); } catch { throw new Error('context'); }
    if (contexts.length !== 1 || contexts[0].Endpoints?.docker?.Host !== this.config.context.endpoint) throw new Error('context');
    try { await this.commandLocal(['info','--format','{{.ServerVersion}}']); return; } catch { /* Start only the installed Desktop, without switching contexts. */ }
    update('docker');
    try {
      await this.command(['desktop','start','--timeout','120'], 125000);
      await this.commandLocal(['info','--format','{{.ServerVersion}}']);
    } catch { throw new Error('unavailable'); }
  }
  async inspect(item) {
    let infos;
    try { infos = JSON.parse(await this.commandLocal(['inspect','--type','container',item.id])); } catch { throw new Error('container'); }
    if (infos.length !== 1 || infos[0].Id !== item.id || fingerprint(infos[0]) !== item.fingerprint) throw new Error('container');
    return infos[0];
  }
  async health(url) {
    try {
      let current = localUrl(url);
      for (let count = 0; count < 4; count++) {
        const response = await this.fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
        await response.body?.cancel();
        if (response.ok) return true;
        if (![301,302,303,307,308].includes(response.status) || !response.headers.get('Location')) return false;
        const next = new URL(response.headers.get('Location'), current);
        if (next.origin !== new URL(url).origin) return false;
        current = localUrl(next.toString());
      }
    } catch { /* Retry until the project deadline. */ }
    return false;
  }
  async startContainers(project, update, recordStarted) {
    await this.ensureEngine(update);
    const serviceDeadline = Date.now() + project.timeout_seconds * 1000;
    // Validate the complete allowlist before starting any container.
    for (const item of project.containers) await this.inspect(item);
    update('starting');
    for (const item of project.containers) {
      if (Date.now() >= serviceDeadline) throw new Error('health');
      const info = await this.inspect(item);
      if (info.State?.Paused || info.State?.Restarting) throw new Error('container');
      if (!info.State?.Running) {
        await this.commandLocal(['start',item.id]);
        recordStarted(item.id);
      }
      if (info.Config?.Healthcheck && info.Config.Healthcheck.Test?.[0] !== 'NONE') {
        let healthy = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          if (Date.now() >= serviceDeadline) throw new Error('health');
          update('starting');
          const refreshed = await this.inspect(item);
          if (refreshed.State?.Health?.Status === 'healthy') { healthy = true; break; }
          if (!refreshed.State?.Running || refreshed.State?.Health?.Status === 'unhealthy') throw new Error('health');
          await this.sleep(1000);
        }
        if (!healthy) throw new Error('health');
      }
    }
  }
  async launch(project, update, recordStarted) {
    if (project.mode === 'docker') await this.startContainers(project, update, recordStarted);
    update('waiting');
    const deadline = Date.now() + project.timeout_seconds * 1000;
    do {
      update('waiting');
      if ((await Promise.all(project.health_urls.map(url => this.health(url)))).every(Boolean)) return localUrl(project.open_url);
      await this.sleep(1000);
    } while (Date.now() < deadline);
    throw new Error('health');
  }
}
