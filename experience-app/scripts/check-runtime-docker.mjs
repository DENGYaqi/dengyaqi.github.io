import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import net from 'node:net';
import { Runner } from '../demo-runner/runner.mjs';
import { now, randomToken } from '../src/runtime-shared.js';

// Explicit opt-in integration test. Reuses a local PHP image; never pulls or builds.
const image = process.argv[2];
if (!image) throw new Error('Usage: node scripts/check-runtime-docker.mjs <existing-local-php-image>');
const execute = promisify(execFile);
const docker = async args => (await execute('docker', args, { shell: false, windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 })).stdout.trim();
await docker(['image','inspect',image]);
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const directory = await mkdtemp(join(tmpdir(), 'yaqi-docker-smoke-'));
const label = `smoke-${crypto.randomUUID()}`;
let container;
try {
  const php = '$s=stream_socket_server("tcp://0.0.0.0:8080");while($c=@stream_socket_accept($s)){fwrite($c,"HTTP/1.1 200 OK\r\nContent-Length: 7\r\nConnection: close\r\n\r\ndemo-ok");fclose($c);}';
  container = await docker(['create','--name',label,'--label','io.yaqi.demo=1','--label','io.yaqi.runtime=smoke','--label','io.yaqi.agent=smoke-agent','--label',`io.yaqi.smoke=${label}`,'--memory','128m','--cpus','0.5','--pids-limit','32','--restart','no','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--publish',`127.0.0.1:${port}:8080`,'--entrypoint','php',image,'-r',php]);
  const reports = [];
  const runner = new Runner({ portal_origin: 'https://portal.example.com', token: randomToken(), agent_id: 'smoke-agent', profiles: { smoke: { containers: [container], health_url: `http://127.0.0.1:${port}/` } } }, join(directory, 'journal.json'), {
    fetch: async (url, options) => url.startsWith('http://127.0.0.1:') ? fetch(url, options) : (reports.push(JSON.parse(options.body)), Response.json({ ok: true })),
  });
  const job = { id: crypto.randomUUID(), claim: randomToken(), runtime_key: 'smoke', expires_at: now() + 120, lease_until: now() + 30 };
  await runner.start(job);
  assert.equal(reports[0]?.state, 'ready');
  assert.equal(await (await fetch(`http://127.0.0.1:${port}/`)).text(), 'demo-ok');
  runner.runs.get(job.id).lease_until = now() - 1;
  runner.fetch = async () => { throw new Error('simulated portal outage'); };
  await runner.tick();
  assert.equal(JSON.parse(await docker(['inspect',container]))[0].State.Running, false);
  assert.deepEqual(JSON.parse(await readFile(runner.journal, 'utf8'))[0].owned, []);
  process.stdout.write('PASS: real Docker start, HTTP readiness, expired lease and offline stop.\n');
} finally {
  if (container && /^[a-f0-9]{64}$/.test(container)) {
    const [info] = JSON.parse(await docker(['inspect',container]));
    if (info.Config.Labels['io.yaqi.smoke'] !== label) throw new Error('Cleanup ownership mismatch');
    await docker(['rm','--force',container]);
  }
  if (!resolve(directory).startsWith(resolve(tmpdir()) + sep) || !directory.includes('yaqi-docker-smoke-')) throw new Error('Unsafe temp path');
  await rm(directory, { recursive: true, force: true });
}
