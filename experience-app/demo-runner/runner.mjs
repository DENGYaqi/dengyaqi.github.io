import { execFile } from 'node:child_process';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { now, publicOrigin, tokenPattern, uuidPattern } from '../src/runtime-shared.js';

const exec = promisify(execFile);
const keyPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const idPattern = /^[0-9a-f]{64}$/;
export function loopbackUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || !url.port || url.hash) throw new Error('profile');
  return url;
}
export function validateConfig(config) {
  if (!publicOrigin(config.portal_origin) || !tokenPattern.test(config.token) || !keyPattern.test(config.agent_id) || !config.profiles || typeof config.profiles !== 'object' || Array.isArray(config.profiles)) throw new Error('config');
  const ids = new Set();
  for (const [key, profile] of Object.entries(config.profiles)) {
    if (!keyPattern.test(key) || !Array.isArray(profile.containers) || !profile.containers.length || profile.containers.length > 20) throw new Error('profile');
    loopbackUrl(profile.health_url);
    for (const id of profile.containers) {
      if (!idPattern.test(id) || ids.has(id)) throw new Error('profile');
      ids.add(id);
    }
  }
  return config;
}
export function validateContainer(info, id, key, agent) {
  const labels = info.Config?.Labels || {}, host = info.HostConfig || {};
  if (info.Id !== id || labels['io.yaqi.demo'] !== '1' || labels['io.yaqi.runtime'] !== key || labels['io.yaqi.agent'] !== agent || host.Privileged || host.NetworkMode === 'host' || host.PidMode === 'host' || host.IpcMode === 'host' || host.CapAdd?.length || host.Devices?.length || host.DeviceRequests?.length || host.Binds?.length || host.VolumesFrom?.length || host.RestartPolicy?.Name !== 'no') throw new Error('profile');
  if (!Number.isFinite(host.Memory) || host.Memory <= 0 || !Number.isFinite(host.NanoCpus) || host.NanoCpus <= 0 || !Number.isFinite(host.PidsLimit) || host.PidsLimit <= 0) throw new Error('profile');
  for (const mount of info.Mounts || []) if (mount.Type !== 'volume' || !mount.Name?.startsWith('yaqi-demo-') || /docker\.sock/i.test(mount.Destination)) throw new Error('profile');
  for (const bindings of Object.values(host.PortBindings || {})) for (const binding of bindings || []) if (!['127.0.0.1', '::1'].includes(binding.HostIp)) throw new Error('profile');
  return info;
}
export class Runner {
  constructor(config, journal, dependencies = {}) {
    this.config = validateConfig(config);
    this.journal = resolve(journal);
    this.runs = new Map();
    this.work = new Map();
    this.execute = dependencies.execute || (async args => (await exec('docker', args, { shell: false, windowsHide: true, timeout: 20000, maxBuffer: 1024 * 1024 })).stdout);
    this.fetch = dependencies.fetch || fetch;
    this.persisting = Promise.resolve();
  }
  async save() {
    const data = JSON.stringify([...this.runs.values()]);
    this.persisting = this.persisting.then(async () => {
      await mkdir(dirname(this.journal), { recursive: true });
      await writeFile(this.journal + '.tmp', data, { mode: 0o600 });
      await rename(this.journal + '.tmp', this.journal);
    });
    return this.persisting;
  }
  async inspect(id, key) {
    const infos = JSON.parse(await this.execute(['inspect', '--type', 'container', id]));
    if (infos.length !== 1) throw new Error('profile');
    const info = validateContainer(infos[0], id, key, this.config.agent_id);
    for (const mount of info.Mounts || []) {
      const [volume] = JSON.parse(await this.execute(['volume', 'inspect', mount.Name]));
      if (volume?.Labels?.['io.yaqi.demo'] !== '1' || volume.Labels['io.yaqi.runtime'] !== key || volume.Labels['io.yaqi.agent'] !== this.config.agent_id) throw new Error('profile');
    }
    return info;
  }
  async recover() {
    let stored;
    try { stored = JSON.parse(await readFile(this.journal, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    if (!Array.isArray(stored) || stored.length > 2) throw new Error('journal');
    for (const run of stored) {
      const profile = this.config.profiles[run.runtime_key];
      if (!uuidPattern.test(run.id) || !tokenPattern.test(run.claim) || !profile || !Array.isArray(run.owned) || run.owned.some(id => !profile.containers.includes(id))) throw new Error('journal');
      this.runs.set(run.id, run);
      await this.stop(run, 'stopped');
    }
  }
  async api(path, data) {
    const response = await this.fetch(this.config.portal_origin + path, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.token}` }, body: JSON.stringify(data), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('portal');
    return response.json();
  }
  expired(run) { return run.cancelled || run.expires_at <= now() || run.lease_until <= now(); }
  async stop(run, state = 'stopped', error = '') {
    run.cancelled = true;
    // Never remove containers or volumes. Stop only IDs persisted before this run started them.
    for (const id of [...run.owned].reverse()) {
      await this.inspect(id, run.runtime_key);
      await this.execute(['stop', '--time', '5', id]);
    }
    run.owned = [];
    run.result = { state, error };
    await this.save();
    try {
      await this.api(`/api/runner/jobs/${run.id}/result`, { claim: run.claim, ...run.result });
      this.runs.delete(run.id); await this.save();
    } catch { /* Keep journal and retry delivery without starting new work. */ }
  }
  async start(job) {
    const profile = this.config.profiles[job.runtime_key];
    if (!uuidPattern.test(job.id) || !tokenPattern.test(job.claim) || !Number.isInteger(job.expires_at) || job.expires_at > now() + 1800 || !Number.isInteger(job.lease_until) || job.lease_until > now() + 30) throw new Error('job');
    const run = { ...job, owned: [], cancelled: false };
    this.runs.set(run.id, run);
    await this.save();
    try {
      if (!profile || this.runs.size > 2 || [...this.runs.values()].some(item => item.id !== run.id && item.runtime_key === run.runtime_key)) throw new Error('profile');
      for (const id of profile.containers) {
        if (this.expired(run)) throw new Error('expired');
        const info = await this.inspect(id, run.runtime_key);
        if (info.State?.Running) throw new Error('profile');
      }
      for (const id of profile.containers) {
        if (this.expired(run)) throw new Error('expired');
        // Recheck directly before starting to detect a manual start during validation.
        if ((await this.inspect(id, run.runtime_key)).State?.Running) throw new Error('profile');
        run.owned.push(id); await this.save();
        await this.execute(['start', id]);
      }
      const deadline = Math.min(now() + 90, run.expires_at);
      while (!this.expired(run) && now() < deadline) {
        try {
          const response = await this.fetch(profile.health_url, { redirect: 'error', signal: AbortSignal.timeout(3000) });
          await response.body?.cancel();
          if (response.ok) {
            if (this.expired(run)) throw new Error('expired');
            await this.api(`/api/runner/jobs/${run.id}/result`, { claim: run.claim, state: 'ready' });
            run.ready = true; await this.save(); return;
          }
        } catch { /* Wait until the fixed health endpoint becomes ready. */ }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error(this.expired(run) ? 'expired' : 'health');
    } catch (error) { await this.stop(run, 'failed', ['health', 'profile', 'expired'].includes(error.message) ? error.message : 'docker'); }
  }
  async tick() {
    for (const run of this.runs.values()) {
      if (!this.work.has(run.id) && (this.expired(run) || run.result)) await this.stop(run, run.result?.state || 'stopped', run.result?.error || '');
    }
    try {
      const result = await this.api('/api/runner/poll', { runs: [...this.runs.values()].map(run => ({ id: run.id, claim: run.claim })) });
      for (const run of this.runs.values()) {
        const lease = result.leases?.find(item => item.id === run.id);
        if (!lease || lease.stop || !Number.isInteger(lease.lease_until) || lease.lease_until > now() + 30) run.cancelled = true;
        else run.lease_until = Math.min(lease.lease_until, run.expires_at);
      }
      if (result.job && !this.runs.has(result.job.id)) {
        const task = this.start(result.job).catch(() => { process.stderr.write('Demo job stopped: inspect the private configuration.\n'); }).finally(() => this.work.delete(result.job.id));
        this.work.set(result.job.id, task);
      }
      await this.save();
    } catch { /* An expired lease triggers local cleanup even when the portal is unreachable. */ }
  }
  async shutdown() {
    for (const run of this.runs.values()) run.cancelled = true;
    await Promise.allSettled(this.work.values());
    for (const run of this.runs.values()) await this.stop(run);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [configPath, journalPath] = process.argv.slice(2);
  if (!configPath || !journalPath) throw new Error('Usage: node runner.mjs <private-config.json> <private-journal.json>');
  const runner = new Runner(JSON.parse(await readFile(configPath, 'utf8')), journalPath);
  await runner.recover();
  let ending = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { ending = true; });
  while (!ending) { await runner.tick(); await new Promise(resolve => setTimeout(resolve, 2000)); }
  await runner.shutdown();
}
