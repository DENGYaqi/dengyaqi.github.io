import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import http from 'node:http';
import { projectId, runtimeFixture } from './runtime-fixture.mjs';
import { now } from '../src/runtime-shared.js';
import { issueLocalTicket, verifyLocalTicket, parseLocalUri } from '../src/local-ticket.js';
import localClient from '../src/local-launch-client.js';
import { localCopy } from '../src/local-launch-copy.js';
import { LocalDocker } from '../local-launcher/docker.mjs';
import { LocalState } from '../local-launcher/state.mjs';
import { fingerprint, validateConfig, localUrl } from '../local-launcher/config.mjs';
import { statusServer } from '../local-launcher/status.mjs';
import { launchLocal } from '../local-launcher/index.mjs';

const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign','verify']);
const privateKey = await crypto.subtle.exportKey('jwk', keys.privateKey), publicKey = await crypto.subtle.exportKey('jwk', keys.publicKey);
const issuer = 'https://portal.example.com', path = `/api/projects/${projectId}/local-launch`;
const context = { name: 'desktop-linux', endpoint: 'npipe:////./pipe/dockerDesktopLinuxEngine' };
const uri = async (id = projectId, lang = 'zh') => `yaqi-local://launch?ticket=${await issueLocalTicket(privateKey, id, lang, issuer)}`;
async function fixture() {
  const f = await runtimeFixture();
  Object.assign(f.env, { LAUNCH_ENABLED: 'false', LOCAL_LAUNCH_ENABLED: 'true', LOCAL_LAUNCH_PRIVATE_KEY: JSON.stringify(privateKey), LOCAL_LAUNCH_ISSUER: issuer });
  return f;
}
async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), 'yaqi-local-test-'));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}
function config(directory, projects = {}) { return { version: 1, issuer, public_key: publicKey, docker_path: resolve('docker.exe'), state_path: join(directory,'state.sqlite'), context, projects }; }
const project = { title: 'Demo', mode: 'open', open_url: 'http://127.0.0.1:8765/', health_urls: ['http://127.0.0.1:8765/'], timeout_seconds: 5 };

test('local launch is admin-only, POST-only, CSRF-protected and independent from remote launch', async () => {
  const f = await fixture();
  assert.equal((await f.call(path, {}, null)).status, 401);
  assert.equal((await f.post(path)).status, 403);
  assert.equal((await f.call(path, {}, 'owner')).status, 405);
  assert.equal((await f.post(path, { csrf: 'bad' }, 'owner')).status, 403);
  assert.equal((await f.call(path, { method: 'POST', headers: { Origin: 'https://evil.example.com' }, body: new URLSearchParams({ csrf: f.sessions.owner.csrf_token }) }, 'owner')).status, 403);
  const result = await f.post(path, { lang: 'fr' }, 'owner');
  assert.equal(result.status, 200); assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
  const body = await result.json(), claims = await verifyLocalTicket(parseLocalUri(body.uri), publicKey, issuer);
  assert.equal(claims.sub, projectId); assert.equal(claims.lang, 'fr'); assert.equal(body.expires_at, claims.exp);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM runtime_runs').get().n, 0);
  assert.equal((await f.launch()).response.status, 503);
  for (const sql of ["UPDATE projects SET status='draft'", "UPDATE accounts SET enabled=0 WHERE id='owner'"]) {
    f.sqlite.exec(sql); assert.notEqual((await f.post(path, {}, 'owner')).status, 200);
  }
});

test('local tickets fail closed for disabled mode, missing key, wrong language and excessive requests', async () => {
  const f = await fixture();
  f.env.LOCAL_LAUNCH_ENABLED = 'false'; assert.equal((await f.post(path, {}, 'owner')).status, 503);
  f.env.LOCAL_LAUNCH_ENABLED = 'true'; assert.equal((await f.post(path, { lang: 'bad' }, 'owner')).status, 400);
  for (let i = 0; i < 10; i++) assert.equal((await f.post(path, {}, 'owner')).status, 200);
  assert.equal((await f.post(path, {}, 'owner')).status, 429);
  f.env.LOCAL_LAUNCH_PRIVATE_KEY = ''; assert.equal((await f.post(path, {}, 'owner')).status, 503);
});

test('four-language local controls do not leak addresses, keys or commands and remain hidden from visitors', async () => {
  const f = await fixture();
  for (const lang of ['zh','en','ja','fr']) {
    const html = await (await f.call(`/${lang}/projects/${projectId}/`, {}, 'owner')).text();
    assert.ok(html.includes(localCopy[lang].start)); assert.match(html, /data-local-launch=/);
    assert.doesNotMatch(html, /127\.0\.0\.1|npipe:|PRIVATE_KEY|yaqi-local:\/\/|docker start/);
    assert.doesNotMatch(await (await f.call(`/${lang}/projects/${projectId}/`)).text(), /data-local-launch=/);
    assert.equal((await f.call(`/${lang}/local-launch/setup/`, {}, 'owner')).status, 200);
    assert.equal((await f.call(`/${lang}/local-launch/setup/`)).status, 403);
  }
});

test('signed tickets reject tampering, algorithm confusion, extra claims, wrong issuer and clock expiry', async () => {
  const ticket = await issueLocalTicket(privateKey, projectId, 'zh', issuer, 1000);
  assert.equal((await verifyLocalTicket(ticket, publicKey, issuer, 1030)).sub, projectId);
  for (const time of [990,1060,2000]) await assert.rejects(verifyLocalTicket(ticket, publicKey, issuer, time));
  await assert.rejects(verifyLocalTicket(ticket, publicKey, 'https://other.example.com', 1030));
  const [header, payload, signature] = ticket.split('.');
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  await assert.rejects(verifyLocalTicket(`${header}.${encode({ sub: crypto.randomUUID() })}.${signature}`, publicKey, issuer, 1030));
  await assert.rejects(verifyLocalTicket(`${encode({ alg: 'none', typ: 'JWT' })}.${payload}.${signature}`, publicKey, issuer, 1030));
  const data = `${header}.${encode({ ...JSON.parse(Buffer.from(payload,'base64url')), command: 'docker rm' })}`;
  const signed = Buffer.from(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(data))).toString('base64url');
  await assert.rejects(verifyLocalTicket(`${data}.${signed}`, publicKey, issuer, 1030));
  for (const bad of ['yaqi-local://launch?ticket=x&command=start', 'yaqi-local://launch?ticket=x&ticket=y', 'yaqi-local://launch/path?ticket=x', 'https://launch?ticket=x', 'yaqi-local://launch?ticket=x#fragment', 'yaqi-local://launch?ticket=x";calc', 'yaqi-local://user@launch?ticket=x']) assert.throws(() => parseLocalUri(bad));
});

test('local state serializes starts across processes and rejects replay without stopping services', async t => {
  let first, second;
  t.after(() => { first?.close(); second?.close(); });
  const directory = await temporary(t);
  first = new LocalState(join(directory,'state.sqlite')); second = new LocalState(join(directory,'state.sqlite'));
  const ticket = { jti: crypto.randomUUID(), sub: projectId, exp: now() + 60 };
  const operation = first.begin(ticket);
  assert.throws(() => second.begin(ticket), /ticket/);
  assert.throws(() => second.begin({ ...ticket, jti: crypto.randomUUID() }), /busy/);
  const another = second.begin({ ...ticket, sub: crypto.randomUUID(), jti: crypto.randomUUID() });
  assert.throws(() => first.begin({ ...ticket, sub: crypto.randomUUID(), jti: crypto.randomUUID() }), /busy/);
  first.update(operation, ['kept'], 'ready'); second.update(another, [], 'failed');
  assert.throws(() => second.begin(ticket), /ticket/);
  const stale = first.begin({ ...ticket, jti: crypto.randomUUID() });
  first.db.prepare('UPDATE operations SET updated_at=? WHERE id=?').run(now()-601,stale);
  second.begin({ ...ticket, jti: crypto.randomUUID() });
  assert.equal(first.db.prepare('SELECT error FROM operations WHERE id=?').get(stale).error, 'interrupted');
});

test('private configuration pins loopback endpoints and a local Docker context', () => {
  assert.ok(validateConfig(config(tmpdir(), { [projectId]: project })));
  for (const url of ['http://example.com:8000/','http://127.0.0.1.evil:8000/','https://127.0.0.1:8000/','http://user:pass@localhost:8000/','file:///tmp/example','http://192.168.1.3:8000/']) assert.throws(() => localUrl(url));
  assert.throws(() => validateConfig({ ...config(tmpdir()), context: { name: 'remote', endpoint: 'tcp://example.com:2375' } }));
  assert.throws(() => validateConfig({ ...config(tmpdir()), public_key: privateKey }));
});

function dockerFixture(running = false) {
  const infos = ['a','b'].map(char => ({ Id: char.repeat(64), Name: '/service-' + char, Image: 'sha256:example', Config: { Labels: {}, Healthcheck: { Test: ['CMD','check'] } }, HostConfig: { PortBindings: {} }, Mounts: [], State: { Running: running, Health: { Status: 'healthy' } } }));
  const calls = [], started = [], profile = { ...project, mode: 'docker', containers: infos.map(info => ({ id: info.Id, fingerprint: fingerprint(info) })) };
  const command = async args => {
    calls.push(args);
    if (args[0] === 'context') return JSON.stringify([{ Endpoints: { docker: { Host: context.endpoint } } }]);
    const action = args[2];
    if (action === 'info') return '28';
    if (action === 'inspect') return JSON.stringify([infos.find(info => info.Id === args.at(-1))]);
    if (action === 'start') { infos.find(info => info.Id === args[3]).State.Running = true; return args[3]; }
    throw new Error('Unexpected command');
  };
  const docker = new LocalDocker({ context }, { command, fetch: async () => new Response('ready'), sleep: async () => {} });
  return { infos, calls, started, profile, docker };
}

test('container fingerprints ignore inspect ordering but detect changed mounts and ports', () => {
  const info = { Id: 'a'.repeat(64), Mounts: [{ Type: 'bind', Source: '/first', Destination: '/a', RW: false }, { Type: 'volume', Source: '/second', Destination: '/b', RW: true }], HostConfig: { PortBindings: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '8080' }], '81/tcp': [{ HostIp: '127.0.0.1', HostPort: '8081' }] } } };
  const changed = structuredClone(info); changed.Mounts.reverse(); changed.HostConfig.PortBindings = Object.fromEntries(Object.entries(changed.HostConfig.PortBindings).reverse());
  assert.equal(fingerprint(info),fingerprint(changed));
  changed.Mounts[0].RW = !changed.Mounts[0].RW;
  assert.notEqual(fingerprint(info),fingerprint(changed));
});

test('local Docker starts dependencies in order and reuses already running containers', async () => {
  for (const running of [false,true]) {
    const f = dockerFixture(running);
    assert.equal(await f.docker.launch(f.profile, () => {}, id => f.started.push(id)), project.open_url);
    assert.deepEqual(f.started, running ? [] : f.infos.map(info => info.Id));
    assert.ok(f.calls.every(args => !args.some(arg => ['stop','rm','pull','build','compose','exec'].includes(arg))));
    assert.ok(f.calls.filter(args => args[2] === 'inspect').length >= 4);
  }
});

test('local Docker rejects all work before startup when identity or context changes', async () => {
  const f = dockerFixture(); f.infos[1].HostConfig.PortBindings = { '80/tcp': [{ HostPort: '9999' }] };
  await assert.rejects(f.docker.launch(f.profile, () => {}, () => {}), /container/);
  assert.equal(f.calls.some(args => args[2] === 'start'), false);
  const wrong = dockerFixture(); wrong.docker.command = async () => JSON.stringify([{ Endpoints: { docker: { Host: 'tcp://remote:2375' } } }]);
  await assert.rejects(wrong.docker.launch(wrong.profile, () => {}, () => {}), /context/);
});

test('local Docker starts Desktop only when needed and reports partial failures without rollback', async () => {
  const f = dockerFixture(), command = f.docker.command; let offline = true, desktop = 0;
  f.docker.command = async args => {
    if (args[0] === 'desktop') { desktop++; offline = false; return ''; }
    if (args[2] === 'info' && offline) throw new Error('offline');
    return command(args);
  };
  f.infos[1].State.Health.Status = 'unhealthy';
  await assert.rejects(f.docker.launch(f.profile, () => {}, id => f.started.push(id)), /health/);
  assert.equal(desktop, 1); assert.equal(f.started.length, 2);
  assert.ok(f.infos.every(info => info.State.Running));
});

test('health probes follow local login redirects but never reach other hosts', async () => {
  const f = dockerFixture(), reached = [];
  f.docker.fetch = async url => { reached.push(url); return url.endsWith('/login') ? new Response('login') : new Response(null, { status: 302, headers: { Location: '/login' } }); };
  assert.equal(await f.docker.health(project.open_url), true); assert.equal(reached.length, 2);
  f.docker.fetch = async () => new Response(null, { status: 302, headers: { Location: 'https://example.com' } });
  assert.equal(await f.docker.health(project.open_url), false);
});

test('local status has an unguessable read-only URL, no cross-site access and escaped content', async t => {
  const server = await statusServer('zh','<script>unsafe</script>'); t.after(() => server.close());
  const response = await fetch(server.url), html = await response.text();
  assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.ok(html.includes('&lt;script&gt;'));
  assert.equal((await fetch(server.url, { method: 'POST' })).status, 403);
  assert.equal((await fetch(server.url, { headers: { Origin: 'https://evil.example.com' } })).status, 403);
  const forgedHost = await new Promise((resolve, reject) => http.get(server.url, { headers: { Host: 'evil.example.com' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject));
  assert.equal(forgedHost, 403);
  assert.equal((await fetch(new URL('/status/guess/state',server.url))).status, 404);
  server.set('failed','blocked','','', 'No hardware connected.');
  assert.match((await (await fetch(new URL('state',server.url))).json()).message, /No hardware/);
});

test('full helper flow verifies ticket, opens progress, records success, and rejects replays or excluded projects', async t => {
  const directory = await temporary(t), settings = config(directory, { [projectId]: project }), opened = [];
  const dependencies = { openBrowser: async url => opened.push(url), docker: { launch: async () => project.open_url } };
  const ticket = await uri();
  const result = await launchLocal(ticket, settings, dependencies); t.after(() => result.status.close());
  assert.equal(result.state, 'ready'); assert.equal(opened.length, 1);
  assert.equal((await (await fetch(new URL('state',result.status.url))).json()).url, project.open_url);
  const replay = await launchLocal(ticket, settings, dependencies); t.after(() => replay.status.close()); assert.equal(replay.error,'ticket');
  settings.projects[projectId] = { title: 'Excluded', mode: 'unavailable', reason: { zh: '保留项目' } };
  const blocked = await launchLocal(await uri(), settings, dependencies); t.after(() => blocked.status.close()); assert.equal(blocked.error,'blocked');
  assert.match((await (await fetch(new URL('state',blocked.status.url))).json()).message, /保留项目/);
  await assert.rejects(launchLocal('yaqi-local://launch?ticket=forged', settings, dependencies), /ticket/);
});

test('browser flow prevents duplicate submits, keeps an explicit launch link and clears expired credentials', async () => {
  let submit, expire, clicks = 0, resolveFetch;
  const button = {}, status = {}, help = {}, retry = { hidden: true, removeAttribute() { delete this.href; }, click() { clicks++; } };
  const form = { querySelector: () => button, addEventListener: (_, fn) => { submit = fn; } };
  const panel = { dataset: { localLaunch: path, working: 'working', sent: 'sent', error: 'error', expired: 'expired' }, querySelector: key => ({ form, '[role=status]': status, '[data-local-retry]': retry, '[data-local-help]': help })[key] };
  runInNewContext(localClient, { document: { querySelectorAll: () => [panel] }, fetch: () => new Promise(resolve => { resolveFetch = resolve; }), FormData: class {}, URLSearchParams: class {}, Date, clearTimeout() {}, setTimeout(fn) { expire = fn; } });
  const first = submit({ preventDefault() {} }); await submit({ preventDefault() {} }); assert.equal(button.disabled,true);
  resolveFetch(Response.json({ uri: await uri(), expires_at: now()+60 })); await first;
  assert.equal(clicks,1); assert.equal(button.disabled,false); assert.equal(retry.hidden,false); assert.equal(status.textContent,'sent');
  expire(); assert.equal(retry.href,undefined); assert.equal(retry.hidden,true); assert.equal(status.textContent,'expired');
  const next = submit({ preventDefault() {} }); resolveFetch(Response.json({ uri: 'javascript:alert(1)', expires_at: now()+60 })); await next;
  assert.equal(clicks,1); assert.equal(status.textContent,'error');
});
