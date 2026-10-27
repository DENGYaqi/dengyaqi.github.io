import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { projectId, runtimeFixture } from './runtime-fixture.mjs';
import { digest, now, publicOrigin, randomToken } from '../src/runtime-shared.js';
import gateway, { accessFor, bridge, guardedStream } from '../demo-gateway/worker.js';
import { runtimeSql } from '../scripts/import-private-runtimes.mjs';
import launchClient from '../src/launch-client.js';

test('launch requires login, explicit grant, same-origin CSRF and POST', async () => {
  const f = await runtimeFixture(), path = `/api/projects/${projectId}/launch`;
  assert.equal((await f.call(path, {}, null)).status, 401);
  assert.equal((await f.call(path)).status, 405);
  assert.equal((await f.post(path, {}, 'owner')).status, 403);
  assert.equal((await f.post(path, { csrf: 'bad' })).status, 403);
  assert.equal((await f.call(path, { method: 'POST', headers: { Origin: 'https://evil.example.com' }, body: new URLSearchParams({ csrf: f.sessions.guest.csrf_token }) })).status, 403);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM runtime_runs').get().n, 0);
  const started = await f.launch(); assert.equal(started.response.status, 303);
  assert.equal((await f.launch()).id, started.id);
  assert.equal((await f.call(`/api/launches/${started.id}`, {}, 'other')).status, 404);
});

test('disabled, expired, offline, draft and unsafe runtime configurations fail closed', async () => {
  for (const update of ["UPDATE project_runtime_grants SET expires_at = 0", "UPDATE runtime_agents SET last_seen = 0", "UPDATE project_runtimes SET enabled = 0", "UPDATE projects SET status = 'draft'", "UPDATE project_runtimes SET gateway_origin = 'https://127.0.0.1'"]) {
    const f = await runtimeFixture(); f.sqlite.exec(update);
    assert.notEqual((await f.launch()).response.status, 303);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM runtime_runs').get().n, 0);
  }
  const f = await runtimeFixture(); f.env.LAUNCH_ENABLED = 'false';
  assert.equal((await f.launch()).response.status, 503);
  for (const value of ['http://demo.example.com', 'https://10.1.2.3', 'https://localhost', 'https://a.local', 'https://u:p@example.com', 'https://example.com/path', 'https://example.com:1234']) assert.equal(publicOrigin(value), null);
});

test('atomic scheduling limits global slots and does not affect unrelated containers', async () => {
  const f = await runtimeFixture();
  const ids = [projectId, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'];
  f.addProject(ids[1], 'hecai'); f.addProject(ids[2], 'third');
  const results = await Promise.all(ids.map(id => f.launch(id)));
  assert.deepEqual(results.map(result => result.response.status).sort(), [303,303,429]);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM runtime_runs WHERE state = 'queued'").get().n, 2);
  const run = results.find(result => result.id);
  assert.equal((await f.call(`/api/launches/${run.id}/stop`)).status, 405);
  await f.post(`/api/launches/${run.id}/stop`);
  assert.equal(f.sqlite.prepare('SELECT state FROM runtime_runs WHERE id = ?').get(run.id).state, 'stopped');
});

test('runner claims are single-use, authenticated, scoped and expire', async () => {
  const f = await runtimeFixture(), { id } = await f.launch();
  assert.equal((await f.agent('/api/runner/poll', { runs: [] }, randomToken())).status, 401);
  const replies = await Promise.all([f.agent('/api/runner/poll', { runs: [] }), f.agent('/api/runner/poll', { runs: [] })]);
  const jobs = (await Promise.all(replies.map(reply => reply.json()))).map(value => value.job).filter(Boolean);
  assert.equal(jobs.length, 1);
  const job = jobs[0]; assert.equal(job.id, id);
  assert.equal((await f.agent(`/api/runner/jobs/${id}/result`, { state: 'ready', claim: randomToken() })).status, 404);
  assert.equal((await f.agent(`/api/runner/jobs/${id}/result`, { state: 'ready', claim: job.claim })).status, 200);
  f.sqlite.prepare('UPDATE runtime_runs SET lease_until = ? WHERE id = ?').run(now() - 1, id);
  const stale = await (await f.agent('/api/runner/poll', { runs: [{ id, claim: job.claim }] })).json();
  assert.equal(stale.leases[0].stop, true);
  assert.equal((await f.agent(`/api/runner/jobs/${id}/result`, { state: 'ready', claim: job.claim })).status, 409);
  await f.agent(`/api/runner/jobs/${id}/result`, { state: 'stopped', claim: job.claim });
  assert.equal(f.sqlite.prepare('SELECT state FROM runtime_runs WHERE id = ?').get(id).state, 'stopped');
});

test('revoking grants, sessions or accounts stops existing runs on the next poll', async () => {
  for (const sql of ["DELETE FROM project_runtime_grants", "DELETE FROM sessions", "UPDATE accounts SET enabled = 0", "UPDATE projects SET status = 'draft'"]) {
    const f = await runtimeFixture(), { job } = await f.ready();
    f.sqlite.exec(sql);
    const result = await (await f.agent('/api/runner/poll', { runs: [{ id: job.id, claim: job.claim }] })).json();
    assert.equal(result.leases[0].stop, true);
  }
});

test('admin grants page is restricted, renders escaped values and supports revoke', async () => {
  const f = await runtimeFixture(), path = '/zh/admin/runtime-grants/';
  assert.equal((await f.call(path)).status, 403);
  const page = await f.call(path, {}, 'owner'); assert.equal(page.status, 200);
  assert.match(await page.text(), /演示权限/);
  assert.equal((await f.post(path, { action: 'grant', account_id: 'other', project_id: projectId, days: '31' }, 'owner')).status, 400);
  assert.equal((await f.post(path, { action: 'grant', account_id: 'other', project_id: projectId, days: '1' }, 'owner')).status, 303);
  assert.ok(f.sqlite.prepare("SELECT * FROM project_runtime_grants WHERE account_id = 'other'").get());
  await f.post(path, { action: 'revoke', account_id: 'other', project_id: projectId }, 'owner');
  assert.equal(f.sqlite.prepare("SELECT * FROM project_runtime_grants WHERE account_id = 'other'").get(), undefined);
});

test('four-language project UI shows runtime controls without private paths or origins', async () => {
  const f = await runtimeFixture();
  for (const lang of ['zh','en','ja','fr']) {
    const page = await f.call(`/${lang}/projects/${projectId}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /class="launch-panel"/); assert.match(html, /target="_blank" rel="noopener"/);
    assert.doesNotMatch(html, /127\.0\.0\.1|demo\.example\.com|runtime_key|docker/);
  }
  f.env.LAUNCH_ENABLED = 'false';
  assert.doesNotMatch(await (await f.call(`/zh/projects/${projectId}/`)).text(), new RegExp(`/api/projects/${projectId}/launch`));
});

async function handshake(f, job) {
  const request = path => new Request('https://demo.example.com' + path);
  const start = await gateway.fetch(request(`/__launch/start?run=${job.id}&lang=zh`), f.gatewayEnv);
  assert.equal(start.status, 303);
  const stateCookie = start.headers.get('Set-Cookie').split(';')[0];
  const authorize = new URL(start.headers.get('Location'));
  const codeResponse = await f.call(authorize.pathname + authorize.search);
  assert.equal(codeResponse.status, 303);
  const exchangeUrl = codeResponse.headers.get('Location');
  const exchange = () => gateway.fetch(new Request(exchangeUrl, { headers: { Cookie: stateCookie } }), f.gatewayEnv);
  const response = await exchange();
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), '/');
  const demoCookie = response.headers.getSetCookie()[0].split(';')[0];
  return { exchange, exchangeUrl, demoCookie, request: new Request('https://demo.example.com/', { headers: { Cookie: demoCookie } }) };
}

test('handoff binds browser state, run, host and portal session; codes cannot be replayed', async () => {
  const f = await runtimeFixture(), { job } = await f.ready();
  const h = await handshake(f, job);
  assert.ok(await accessFor(h.request, f.gatewayEnv));
  assert.equal((await h.exchange()).status, 403);
  assert.equal((await gateway.fetch(new Request(h.exchangeUrl), f.gatewayEnv)).status, 403);
  const wrongHost = new Request('https://other.example.com/', { headers: { Cookie: h.demoCookie } });
  assert.equal(await accessFor(wrongHost, f.gatewayEnv), null);
  assert.equal((await gateway.fetch(wrongHost, f.gatewayEnv)).status, 503);
  await f.post(`/api/launches/${job.id}/stop`);
  assert.equal(await accessFor(h.request, f.gatewayEnv), null);
});

test('gateway proxies only authenticated requests and removes privileged headers and cookies', async t => {
  const f = await runtimeFixture(), { job } = await f.ready(), h = await handshake(f, job);
  let forwarded;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    forwarded = { url, options };
    return new Response('app', { headers: { 'Set-Cookie': 'app_session=abc; Domain=example.com; HttpOnly' } });
  });
  assert.equal((await gateway.fetch(new Request('https://demo.example.com/'), f.gatewayEnv)).status, 403);
  const result = await gateway.fetch(new Request('https://demo.example.com/api/list', { headers: { Cookie: h.demoCookie + '; app_session=abc', 'CF-Access-Client-Secret': 'forged' } }), f.gatewayEnv);
  assert.equal(result.status, 200); assert.equal(await result.text(), 'app');
  assert.equal(forwarded.url, 'https://tunnel.example.com/api/list');
  assert.equal(forwarded.options.headers.get('Cookie'), 'app_session=abc');
  assert.equal(forwarded.options.headers.get('CF-Access-Client-Secret'), 'test-secret');
  assert.match(forwarded.options.headers.get('X-Demo-Signature'), /^[a-f0-9]{64}$/);
  assert.doesNotMatch(result.headers.get('Set-Cookie'), /Domain=/);
  assert.equal((await gateway.fetch(new Request('https://demo.example.com/api', { method: 'POST', headers: { Cookie: h.demoCookie, Origin: 'https://evil.example.com' }, body: 'x' }), f.gatewayEnv)).status, 403);
  f.sqlite.exec('DELETE FROM sessions');
  assert.equal((await gateway.fetch(h.request, f.gatewayEnv)).status, 403);
});

test('active streaming responses are interrupted on revocation', async () => {
  let permitted = true, cancelled = false;
  const source = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1])); }, cancel() { cancelled = true; } });
  const reader = guardedStream(source, async () => permitted, 10).getReader();
  assert.equal((await reader.read()).value[0], 1);
  permitted = false;
  await assert.rejects(reader.read(), /expired/);
  assert.equal(cancelled, true);
});

test('oversized or malformed runner messages cannot create work', async () => {
  const f = await runtimeFixture();
  assert.equal((await f.agent('/api/runner/poll', { runs: 'wrong' })).status, 400);
  assert.equal((await f.agent('/api/runner/poll', { runs: [], padding: 'x'.repeat(20000) })).status, 400);
});

test('racing double-clicks return the same task and enforce the hourly quota', async () => {
  const f = await runtimeFixture();
  const first = await Promise.all([f.launch(), f.launch()]);
  assert.equal(first[0].id, first[1].id);
  for (let count = 0; count < 7; count++) {
    const result = await f.launch();
    if (count === 6) assert.equal(result.response.status, 429);
    else { assert.equal(result.response.status, 303); await f.post(`/api/launches/${result.id}/stop`); }
  }
});

test('runtime import hashes secrets and rejects unsafe, shared or active targets', async () => {
  const f = await runtimeFixture(), token = randomToken();
  const data = { agents: [{ id: 'local-demo', token, enabled: true }], projects: [{ project_id: projectId, runtime_key: 'daniel', agent_id: 'local-demo', gateway_origin: 'https://demo.example.com', enabled: true }] };
  const sql = await runtimeSql(data);
  assert.equal(sql.join('').includes(token), false);
  assert.ok(sql.join('').includes(await digest(token)));
  await assert.rejects(runtimeSql({ ...data, projects: [{ ...data.projects[0], gateway_origin: 'http://127.0.0.1:80' }] }));
  await f.launch();
  const changed = await runtimeSql({ ...data, projects: [{ ...data.projects[0], gateway_origin: 'https://other.example.com' }] });
  assert.throws(() => f.sqlite.exec(changed[1]), /Stop active/);
});

test('progress UI waits for ready, submits once and stops polling terminal states', async () => {
  const elements = { '[role=status]': {}, '[data-launch-open]': { hidden: true, requestSubmit() { this.submits = (this.submits || 0) + 1; } }, '[data-launch-stop]': { hidden: false } };
  const panel = { dataset: { launchStatus: '/api/launches/id', starting: 'Starting', ready: 'Ready', stopped: 'Ended', error: 'Unavailable' }, querySelector: selector => elements[selector] };
  let next;
  const states = ['starting', 'ready'];
  runInNewContext(launchClient, { document: { querySelector: () => panel }, fetch: async () => ({ ok: true, json: async () => ({ state: states.shift() }) }), setTimeout: callback => { next = callback; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements['[role=status]'].textContent, 'Starting');
  assert.equal(elements['[data-launch-open]'].submits, undefined);
  const callback = next; next = null; await callback();
  assert.equal(elements['[data-launch-open]'].submits, 1);
  assert.equal(next, null);
  runInNewContext(launchClient, { document: { querySelector: () => panel }, fetch: async () => ({ ok: true, json: async () => ({ state: 'stopped' }) }), setTimeout: () => { throw new Error('must not poll terminal state'); } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements['[data-launch-stop]'].hidden, true);
});

test('WebSocket bridge forwards both directions and closes both peers on revoked access', async t => {
  class Socket extends EventTarget {
    sent = []; closed = false;
    accept() { this.accepted = true; }
    send(value) { this.sent.push(value); }
    close() { this.closed = true; }
  }
  const originalPair = globalThis.WebSocketPair, originalResponse = globalThis.Response;
  const client = new Socket(), server = new Socket(), upstream = new Socket();
  globalThis.WebSocketPair = class { constructor() { return { 0: client, 1: server }; } };
  globalThis.Response = class { constructor(body, options) { Object.assign(this, options); } };
  t.after(() => { globalThis.Response = originalResponse; if (originalPair) globalThis.WebSocketPair = originalPair; else delete globalThis.WebSocketPair; });
  let permitted = true;
  assert.equal(bridge(upstream, async () => permitted, 5).status, 101);
  upstream.dispatchEvent(new MessageEvent('message', { data: 'result' }));
  server.dispatchEvent(new MessageEvent('message', { data: 'input' }));
  assert.deepEqual(server.sent, ['result']); assert.deepEqual(upstream.sent, ['input']);
  permitted = false;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(server.closed, true); assert.equal(upstream.closed, true);
});
