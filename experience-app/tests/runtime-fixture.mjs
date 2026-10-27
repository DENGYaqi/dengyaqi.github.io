import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createSession, sessionFromRequest } from '../src/auth.js';
import { digest, now, randomToken } from '../src/runtime-shared.js';
import worker from '../src/worker.js';

export const projectId = '11111111-1111-4111-8111-111111111111';
export async function runtimeFixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const directory = new URL('../migrations/', import.meta.url);
  for (const name of readdirSync(directory).filter(name => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(name, directory), 'utf8'));
  const DB = {
    prepare(sql) {
      const statement = sqlite.prepare(sql); let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return statement.get(...args) || null; },
        async all() { return { results: statement.all(...args) }; },
        async run() { return { meta: { changes: statement.run(...args).changes } }; },
      };
    },
  };
  for (const [id, role] of [['owner', 'admin'], ['guest', 'viewer'], ['other', 'viewer']]) sqlite.prepare('INSERT INTO accounts (id,email,role,password_salt,password_hash,enabled,created_at) VALUES (?,?,?,?,?,1,0)').run(id, `${id}@example.com`, role, 'unused', 'unused');
  const sessions = {};
  for (const id of ['owner', 'guest', 'other']) {
    const login = await createSession(DB, { id });
    sessions[id] = { cookie: login.cookie.split(';')[0], ...await sessionFromRequest(new Request('https://portal.example.com', { headers: { Cookie: login.cookie } }), DB) };
  }
  const agentToken = randomToken();
  sqlite.prepare('INSERT INTO runtime_agents VALUES (?, ?, 1, ?)').run('local-demo', await digest(agentToken), now());
  function addProject(id, key = 'daniel') {
    const translations = Object.fromEntries(['zh','en','ja','fr'].map(lang => [lang, { title: `Demo ${lang}`, summary: 'Example', body: 'Example' }]));
    sqlite.prepare("INSERT INTO projects (id,status,sort_order,translations,experience_keys,education_keys,created_at,updated_at) VALUES (?,'published',0,?,'[]','[]','','')").run(id, JSON.stringify(translations));
    sqlite.prepare('INSERT INTO project_runtimes VALUES (?,?,?, ?,1,1800)').run(id, key, 'local-demo', key === 'daniel' ? 'https://demo.example.com' : `https://${key}.example.com`);
    sqlite.prepare('INSERT INTO project_runtime_grants VALUES (?,?,?)').run('guest', id, now() + 3600);
  }
  addProject(projectId);
  const env = { DB, LAUNCH_ENABLED: 'true' };
  async function call(path, options = {}, who = 'guest') {
    const session = sessions[who];
    const headers = { ...(session ? { Cookie: session.cookie } : {}), Origin: 'https://portal.example.com', ...options.headers };
    const request = new Request('https://portal.example.com' + path, { ...options, headers });
    return worker.fetch(request, env, {});
  }
  const post = (path, fields = {}, who = 'guest') => call(path, { method: 'POST', body: new URLSearchParams({ csrf: sessions[who]?.csrf_token || '', ...fields }) }, who);
  const agent = (path, body, token = agentToken) => call(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, null);
  async function launch(id = projectId) {
    const response = await post(`/api/projects/${id}/launch`);
    return { response, id: response.headers.get('Location')?.split('/')[3] };
  }
  async function ready() {
    const launchResult = await launch();
    const { job } = await (await agent('/api/runner/poll', { runs: [] })).json();
    await agent(`/api/runner/jobs/${job.id}/result`, { claim: job.claim, state: 'ready' });
    return { ...launchResult, job };
  }
  const gatewayEnv = { DB, DEMO_ENABLED: 'true', PORTAL_ORIGIN: 'https://portal.example.com', GATEWAY_ORIGIN: 'https://demo.example.com', PROJECT_ID: projectId, UPSTREAM_ORIGIN: 'https://tunnel.example.com', ACCESS_CLIENT_ID: 'test-id', ACCESS_CLIENT_SECRET: 'test-secret', PROXY_SECRET: randomToken() };
  return { sqlite, DB, env, gatewayEnv, sessions, agentToken, addProject, call, post, agent, launch, ready };
}
