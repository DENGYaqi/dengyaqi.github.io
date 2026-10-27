import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Runner, validateConfig, validateContainer } from '../demo-runner/runner.mjs';
import { createProxy } from '../demo-runner/proxy.mjs';
import { digest, now, randomToken, signature } from '../src/runtime-shared.js';

const container = 'a'.repeat(64);
function config() {
  return { portal_origin: 'https://portal.example.com', token: randomToken(), agent_id: 'local-demo', profiles: { daniel: { containers: [container], health_url: 'http://127.0.0.1:18080/health' } } };
}
function info(running = false) {
  return { Id: container, Config: { Labels: { 'io.yaqi.demo': '1', 'io.yaqi.runtime': 'daniel', 'io.yaqi.agent': 'local-demo' } }, State: { Running: running }, HostConfig: { Memory: 256 * 1024 ** 2, NanoCpus: 1000000000, PidsLimit: 100, RestartPolicy: { Name: 'no' }, PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '18080' }] } }, Mounts: [] };
}
const job = () => ({ id: crypto.randomUUID(), claim: randomToken(), runtime_key: 'daniel', expires_at: now() + 300, lease_until: now() + 30 });
async function fixture(t, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'demo-runner-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const commands = [], reports = []; let running = false;
  const runner = new Runner(config(), join(directory, 'journal.json'), {
    execute: async args => {
      commands.push(args);
      if (args[0] === 'inspect') return JSON.stringify([info(running)]);
      if (args[0] === 'start') running = true;
      if (args[0] === 'stop') running = false;
      return '';
    },
    fetch: async (url, options) => {
      if (url.startsWith('http://127.0.0.1')) return new Response('ok');
      reports.push(JSON.parse(options.body)); return Response.json({ ok: true });
    }, ...overrides,
  });
  return { runner, commands, reports, directory };
}

test('private runner profiles reject remote health URLs, commands and shared container IDs', () => {
  const bad = config(); bad.profiles.daniel.health_url = 'http://192.168.0.2:80';
  assert.throws(() => validateConfig(bad));
  bad.profiles.daniel.health_url = 'http://127.0.0.1:80'; bad.profiles.daniel.containers = ['container; powershell'];
  assert.throws(() => validateConfig(bad));
  const shared = config(); shared.profiles.other = { ...shared.profiles.daniel };
  assert.throws(() => validateConfig(shared));
});

test('container checks reject host privileges, mounts, public ports, missing limits and labels', () => {
  const variants = [
    value => { value.HostConfig.Privileged = true; },
    value => { value.HostConfig.NetworkMode = 'host'; },
    value => { value.HostConfig.CapAdd = ['SYS_ADMIN']; },
    value => { value.HostConfig.PortBindings['80/tcp'][0].HostIp = '0.0.0.0'; },
    value => { value.HostConfig.Memory = 0; },
    value => { value.HostConfig.RestartPolicy.Name = 'always'; },
    value => { value.Mounts = [{ Type: 'bind', Source: 'C:/Users', Destination: '/host' }]; },
    value => { value.Config.Labels = {}; },
  ];
  for (const change of variants) { const value = info(); change(value); assert.throws(() => validateContainer(value, container, 'daniel', 'local-demo')); }
  assert.equal(validateContainer(info(), container, 'daniel', 'local-demo').Id, container);
});

test('runner journals ownership before starting, reports health and stops only its containers', async t => {
  const { runner, commands, reports } = await fixture(t), task = job();
  await runner.start(task);
  assert.deepEqual(commands.filter(args => args[0] === 'start'), [['start', container]]);
  assert.equal(reports[0].state, 'ready');
  const journal = JSON.parse(await readFile(runner.journal, 'utf8'));
  assert.deepEqual(journal[0].owned, [container]);
  await runner.stop(runner.runs.get(task.id));
  assert.deepEqual(commands.filter(args => args[0] === 'stop'), [['stop','--time','5',container]]);
  assert.equal(reports.at(-1).state, 'stopped');
  assert.deepEqual(JSON.parse(await readFile(runner.journal, 'utf8')), []);
});

test('manually running containers are neither adopted nor stopped', async t => {
  const commands = [];
  const { runner } = await fixture(t, { execute: async args => { commands.push(args); return JSON.stringify([info(true)]); } });
  await runner.start(job());
  assert.equal(commands.some(args => ['start','stop'].includes(args[0])), false);
});

test('cloud outage stops expired owned runs locally and keeps undelivered results', async t => {
  const { runner, commands } = await fixture(t), task = job();
  await runner.start(task);
  runner.runs.get(task.id).lease_until = now() - 1;
  runner.fetch = async () => { throw new Error('offline'); };
  await runner.tick();
  assert.equal(commands.some(args => args[0] === 'stop'), true);
  assert.equal(runner.runs.get(task.id).result.state, 'stopped');
  assert.deepEqual(runner.runs.get(task.id).owned, []);
});

test('crash recovery stops only previously journaled IDs and retains cleanup on failure', async t => {
  const { runner, commands } = await fixture(t), task = job();
  await runner.start(task);
  runner.runs.clear();
  await runner.recover();
  assert.ok(commands.some(args => args[0] === 'stop'));
  assert.equal(runner.runs.size, 0);
});

test('local proxy rejects unsigned, expired or modified requests and hides gateway credentials', async t => {
  let received;
  const app = http.createServer((request, response) => { received = request.headers; response.end('real app'); });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const secret = randomToken();
  const proxy = createProxy({ secret, port: 18081, routes: { daniel: { target: `http://127.0.0.1:${app.address().port}`, public_origin: 'https://demo.example.com' } } });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  t.after(() => { proxy.closeAllConnections(); proxy.close(); app.closeAllConnections(); app.close(); });
  const origin = `http://127.0.0.1:${proxy.address().port}`;
  assert.equal((await fetch(origin + '/')).status, 403);
  const deadline = now() + 20, path = '/api/view?q=one';
  const headers = { 'X-Demo-Key': 'daniel', 'X-Demo-Deadline': String(deadline), 'X-Demo-Signature': await signature(secret, `GET\n${path}\ndaniel\n${deadline}\n${await digest(new Uint8Array())}`), 'CF-Access-Client-Secret': 'hidden', 'X-Forwarded-Host': 'forged' };
  assert.equal((await fetch(origin + '/changed', { headers })).status, 403);
  const result = await fetch(origin + path, { headers });
  assert.equal(result.status, 200); assert.equal(await result.text(), 'real app');
  assert.equal(received['cf-access-client-secret'], undefined);
  assert.equal(received['x-demo-signature'], undefined);
  assert.equal(received['x-forwarded-host'], 'demo.example.com');
});
