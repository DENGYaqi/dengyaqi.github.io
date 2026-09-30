import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import worker, { detectImage, escapeHtml, isAdmin, validatePublish } from '../src/worker.js';
import { createSession, hashPassword, safeNext, sessionFromRequest, verifyPassword } from '../src/auth.js';

const id = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const translations = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { title: `Title ${lang}`, summary: `Summary ${lang}`, body: `Body ${lang}` }]));
const storedPassword = await hashPassword('correct horse battery staple', 'AAAAAAAAAAAAAAAAAAAAAA');

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of ['0001_initial.sql', '0002_education.sql', '0003_accounts.sql', '0004_access_requests.sql']) sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
  sqlite.prepare('INSERT INTO projects (id, status, sort_order, translations, experience_keys, education_keys, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?)').run(id, 'draft', JSON.stringify(translations), '["ai_rd_lead"]', '[]', '', '');
  sqlite.prepare('INSERT INTO educations (key, sort_order, translations) VALUES (?, 0, ?)').run('sample_school', JSON.stringify(Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { school: `Example school ${lang}`, degree: `Degree ${lang}`, date: '2017–2019', summary: `Summary ${lang}` }]))));
  sqlite.prepare('INSERT INTO media (id, project_id, object_key, content_type, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(imageId, id, `${id}/${imageId}`, 'image/png', '');
  for (const [accountId, email, role] of [['owner', 'owner@example.test', 'admin'], ['guest', 'guest@example.test', 'viewer']]) {
    sqlite.prepare('INSERT INTO accounts (id, email, role, password_salt, password_hash, enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, 0)').run(accountId, email, role, storedPassword.salt, storedPassword.hash);
  }
  const DB = {
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return stmt.get(...args) || null; },
        async all() { return { results: stmt.all(...args) }; },
        async run() { return stmt.run(...args); },
      };
    },
    async batch(statements) { return Promise.all(statements.map(statement => statement.run())); },
  };
  const state = { reads: 0 };
  const MEDIA = { async get() { state.reads++; return { body: new Blob(['image']).stream() }; } };
  return { sqlite, DB, env: { DB, MEDIA }, state };
}

async function loginCookie(DB, accountId) {
  const { cookie } = await createSession(DB, { id: accountId });
  return cookie.split(';')[0];
}
const request = (path, cookie, options = {}) => new Request(`https://example.test${path}`, { ...options, headers: { ...(cookie ? { Cookie: cookie } : {}), ...options.headers } });
async function anonymousFormState(env, path = '/zh/login/') {
  const result = await worker.fetch(request(path), env, {});
  const cookie = result.headers.get('Set-Cookie').split(';')[0];
  const csrf = (await result.text()).match(/name="csrf" value="([^"]+)"/)[1];
  return { cookie, csrf };
}

test('login page and every private content path require a site session', async () => {
  const { env, state } = fixture();
  for (const path of ['/zh/projects/', '/zh/projects/education/', '/zh/admin/', `/media/${imageId}`]) {
    const result = await worker.fetch(request(path), env, {});
    assert.equal(result.status, 303);
    assert.match(result.headers.get('Location'), /^\/zh\/login\/\?next=/);
  }
  assert.equal(state.reads, 0);
  const page = await (await worker.fetch(request('/zh/login/?next=%2Fzh%2Fprojects%2Fwork%2Fai_rd_lead%2F'), env, {})).text();
  assert.match(page, /登录查看项目/);
  assert.match(page, /返回公开网站/);
  assert.doesNotMatch(page, /Cloudflare Access/);
  assert.equal((await worker.fetch(request('/style.css'), env, {})).status, 200);
});

test('language menu matches the public site and keeps the selected work location', async () => {
  const { env, DB } = fixture();
  const target = '/zh/projects/work/ai_rd_lead/';
  const login = await (await worker.fetch(request(`/zh/login/?next=${encodeURIComponent(target)}`), env, {})).text();
  assert.match(login, /<details class="language-menu"><summary[^>]*>中文<\/summary>/);
  assert.match(login, /href="\/en\/login\/\?next=%2Fen%2Fprojects%2Fwork%2Fai_rd_lead%2F"[^>]*>English<\/a>/);
  const apply = await (await worker.fetch(request(`/zh/request-access/?next=${encodeURIComponent(target)}`), env, {})).text();
  assert.match(apply, /href="\/ja\/request-access\/\?next=%2Fja%2Fprojects%2Fwork%2Fai_rd_lead%2F"[^>]*>日本語<\/a>/);
  const cookie = await loginCookie(DB, 'owner');
  const projects = await (await worker.fetch(request(target, cookie), env, {})).text();
  assert.match(projects, /href="\/fr\/projects\/work\/ai_rd_lead\/"[^>]*>Français<\/a>/);
});

test('password login preserves target, limits role, and logout returns to the public site', async () => {
  const { env, sqlite, DB } = fixture();
  const { cookie: formCookie, csrf } = await anonymousFormState(env);
  const body = { email: 'guest@example.test', password: 'correct horse battery staple', next: '/zh/projects/work/ai_rd_lead/', csrf };
  const failed = await worker.fetch(request('/zh/login/', formCookie, { method: 'POST', headers: { Origin: 'null' }, body: new URLSearchParams({ ...body, password: 'wrong' }) }), env, {});
  assert.equal(failed.status, 401);
  const signedIn = await worker.fetch(request('/zh/login/', formCookie, { method: 'POST', headers: { Origin: 'null' }, body: new URLSearchParams(body) }), env, {});
  assert.equal(signedIn.status, 303);
  assert.equal(signedIn.headers.get('Location'), body.next);
  assert.match(signedIn.headers.get('Set-Cookie'), /HttpOnly; SameSite=Lax; Secure/);
  const cookie = signedIn.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await worker.fetch(request(body.next, cookie), env, {})).status, 200);
  assert.equal((await worker.fetch(request('/zh/admin/', cookie), env, {})).status, 403);
  assert.equal((await worker.fetch(request(`/${'zh'}/projects/${id}/`, cookie), env, {})).status, 404);
  sqlite.prepare("UPDATE projects SET status = 'published' WHERE id = ?").run(id);
  assert.equal((await worker.fetch(request(`/zh/projects/${id}/`, cookie), env, {})).status, 200);
  const session = await sessionFromRequest(request('/zh/projects/', cookie), DB);
  const signedOut = await worker.fetch(request('/zh/logout/', cookie, { method: 'POST', body: new URLSearchParams({ csrf: session.csrf_token }) }), env, {});
  assert.equal(signedOut.headers.get('Location'), 'https://dengyaqi.github.io/zh/about/');
  assert.match(signedOut.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await worker.fetch(request('/zh/projects/', cookie), env, {})).status, 303);
});

test('admin creates, resets and disables individual visitor accounts', async () => {
  const { env, DB, sqlite } = fixture();
  const cookie = await loginCookie(DB, 'owner');
  const session = await sessionFromRequest(request('/zh/admin/accounts/', cookie), DB);
  assert.equal(isAdmin(session), true);
  const post = (path, fields) => worker.fetch(request(path, cookie, { method: 'POST', headers: { Origin: 'https://example.test' }, body: new URLSearchParams({ csrf: session.csrf_token, ...fields }) }), env, {});
  const created = await post('/zh/admin/accounts/', { email: 'new@example.test' });
  assert.equal(created.status, 200);
  assert.match(await created.text(), /初始密码/);
  const account = sqlite.prepare('SELECT * FROM accounts WHERE email = ?').get('new@example.test');
  assert.ok(account);
  assert.equal((await worker.fetch(request('/zh/admin/accounts/', await loginCookie(DB, 'guest')), env, {})).status, 403);
  const oldCookie = await loginCookie(DB, account.id);
  assert.equal((await post(`/zh/admin/accounts/${account.id}/reset/`, {})).status, 200);
  assert.equal((await worker.fetch(request('/zh/projects/', oldCookie), env, {})).status, 303);
  const resetCookie = await loginCookie(DB, account.id);
  assert.equal((await post(`/zh/admin/accounts/${account.id}/disable/`, {})).status, 303);
  assert.equal((await worker.fetch(request('/zh/projects/', resetCookie), env, {})).status, 303);
  assert.equal(sqlite.prepare('SELECT enabled FROM accounts WHERE id = ?').get(account.id).enabled, 0);
});

test('visitor can request access and admin can approve or dismiss without exposing accounts', async () => {
  const { env, DB, sqlite } = fixture();
  const target = '/zh/projects/work/ai_rd_lead/';
  const { cookie, csrf } = await anonymousFormState(env, `/zh/request-access/?next=${encodeURIComponent(target)}`);
  const submit = (email, reason) => worker.fetch(request('/zh/request-access/', cookie, { method: 'POST', headers: { Origin: 'null' }, body: new URLSearchParams({ email, reason, next: target, csrf }) }), env, {});
  assert.equal((await submit('applicant@example.test', 'Review my experience')).status, 200);
  assert.equal((await submit('applicant@example.test', 'Again')).status, 200);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM access_requests WHERE email = 'applicant@example.test'").get().n, 1);
  assert.equal(sqlite.prepare('SELECT target_path FROM access_requests WHERE email = ?').get('applicant@example.test').target_path, target);
  const adminCookie = await loginCookie(DB, 'owner');
  const adminSession = await sessionFromRequest(request('/zh/admin/requests/', adminCookie), DB);
  assert.match(await (await worker.fetch(request('/zh/admin/requests/', adminCookie), env, {})).text(), /Review my experience/);
  const requestId = sqlite.prepare('SELECT id FROM access_requests WHERE email = ?').get('applicant@example.test').id;
  const approve = await worker.fetch(request(`/zh/admin/requests/${requestId}/approve/`, adminCookie, { method: 'POST', body: new URLSearchParams({ csrf: adminSession.csrf_token }) }), env, {});
  assert.equal(approve.status, 200);
  assert.match(await approve.text(), /初始密码/);
  assert.equal(sqlite.prepare('SELECT status FROM access_requests WHERE id = ?').get(requestId).status, 'approved');
  assert.ok(sqlite.prepare('SELECT id FROM accounts WHERE email = ?').get('applicant@example.test'));
  const second = await submit('another@example.test', 'Another reason');
  assert.equal(second.status, 200);
  const otherId = sqlite.prepare('SELECT id FROM access_requests WHERE email = ?').get('another@example.test').id;
  assert.equal((await worker.fetch(request(`/zh/admin/requests/${otherId}/dismiss/`, adminCookie, { method: 'POST', body: new URLSearchParams({ csrf: adminSession.csrf_token }) }), env, {})).status, 303);
  assert.equal(sqlite.prepare('SELECT status FROM access_requests WHERE id = ?').get(otherId).status, 'dismissed');
  assert.equal((await worker.fetch(request('/zh/admin/requests/', await loginCookie(DB, 'guest')), env, {})).status, 403);
});

test('approving an existing visitor request revokes old sessions', async () => {
  const { env, DB, sqlite } = fixture();
  const oldCookie = await loginCookie(DB, 'guest');
  const { cookie, csrf } = await anonymousFormState(env, '/zh/request-access/');
  const submitted = await worker.fetch(request('/zh/request-access/', cookie, { method: 'POST', body: new URLSearchParams({ email: 'guest@example.test', reason: 'Please restore access', csrf }) }), env, {});
  assert.equal(submitted.status, 200);
  const adminCookie = await loginCookie(DB, 'owner');
  const adminSession = await sessionFromRequest(request('/zh/admin/requests/', adminCookie), DB);
  const item = sqlite.prepare('SELECT id FROM access_requests WHERE email = ?').get('guest@example.test');
  const approved = await worker.fetch(request(`/zh/admin/requests/${item.id}/approve/`, adminCookie, { method: 'POST', body: new URLSearchParams({ csrf: adminSession.csrf_token }) }), env, {});
  assert.equal(approved.status, 200);
  assert.equal((await worker.fetch(request('/zh/projects/', oldCookie), env, {})).status, 303);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM accounts WHERE email = ?').get('guest@example.test').n, 1);
});

test('anonymous forms enforce their token and accept a 1000-character Chinese reason', async () => {
  const { env, sqlite } = fixture();
  const state = await anonymousFormState(env, '/zh/request-access/');
  const reason = '申'.repeat(1000);
  const fields = { email: 'long@example.test', reason, csrf: state.csrf };
  assert.equal((await worker.fetch(request('/zh/request-access/', null, { method: 'POST', body: new URLSearchParams(fields) }), env, {})).status, 403);
  assert.equal((await worker.fetch(request('/zh/request-access/', state.cookie, { method: 'POST', body: new URLSearchParams(fields) }), env, {})).status, 200);
  assert.equal(sqlite.prepare('SELECT length(reason) AS n FROM access_requests WHERE email = ?').get('long@example.test').n, 1000);
  assert.equal((await worker.fetch(request('/zh/request-access/', state.cookie, { method: 'POST', body: new URLSearchParams({ ...fields, reason: reason + '申' }) }), env, {})).status, 400);
});

test('local preview cookies work on loopback HTTP while public cookies stay secure', async () => {
  const { DB } = fixture();
  const local = await createSession(DB, { id: 'guest' }, new Request('http://127.0.0.1:8787/zh/login/'));
  const remote = await createSession(DB, { id: 'guest' }, new Request('https://example.test/zh/login/'));
  assert.doesNotMatch(local.cookie, /; Secure/);
  assert.match(remote.cookie, /; Secure/);
});

test('login throttling, CSRF and unsafe redirects are rejected', async () => {
  const { env, DB } = fixture();
  const { cookie: formCookie, csrf } = await anonymousFormState(env);
  for (let i = 0; i < 5; i++) assert.equal((await worker.fetch(request('/zh/login/', formCookie, { method: 'POST', body: new URLSearchParams({ email: 'guest@example.test', password: 'wrong', csrf }) }), env, {})).status, 401);
  assert.equal((await worker.fetch(request('/zh/login/', formCookie, { method: 'POST', body: new URLSearchParams({ email: 'guest@example.test', password: 'wrong', csrf }) }), env, {})).status, 429);
  assert.equal(safeNext('//attacker.test/', 'zh'), '/zh/projects/');
  assert.equal(safeNext('/zh/projects/work/ai_rd_lead/', 'zh'), '/zh/projects/work/ai_rd_lead/');
  const cookie = await loginCookie(DB, 'owner');
  const wrongCsrf = await worker.fetch(request('/zh/admin/accounts/', cookie, { method: 'POST', body: new URLSearchParams({ email: 'new@example.test', csrf: 'wrong' }) }), env, {});
  assert.equal(wrongCsrf.status, 403);
  const crossSite = await worker.fetch(request('/zh/logout/', cookie, { method: 'POST', headers: { Origin: 'https://attacker.test' }, body: new URLSearchParams({ csrf: 'wrong' }) }), env, {});
  assert.equal(crossSite.status, 403);
});

test('focused routes and publishing rules still work', async () => {
  const { env, DB, sqlite } = fixture();
  sqlite.prepare("UPDATE projects SET status = 'published', education_keys = ? WHERE id = ?").run('["sample_school"]', id);
  const cookie = await loginCookie(DB, 'guest');
  const work = await (await worker.fetch(request('/zh/projects/work/senior_software_engineer_isoftstone/', cookie), env, {})).text();
  assert.match(work, /overview-entry focused/);
  assert.ok(work.indexOf('资深软件开发工程师') < work.indexOf('AI 研发主管'));
  const school = await (await worker.fetch(request('/zh/projects/education/sample_school/', cookie), env, {})).text();
  assert.ok(school.indexOf('<section id="education">') < school.indexOf('<section id="work">'));
  assert.match(school, /href="\/en\/projects\/education\/sample_school\/"/);
  const item = { translations: structuredClone(translations), experience_keys: ['ai_rd_lead'] };
  assert.equal(validatePublish(item), true);
  item.experience_keys = [];
  assert.equal(validatePublish(item), false);
  item.education_keys = ['sample_school'];
  assert.equal(validatePublish(item), true);
});

test('password hashes, image signatures and HTML escaping are safe', async () => {
  assert.equal(await verifyPassword('correct horse battery staple', { password_salt: storedPassword.salt, password_hash: storedPassword.hash }), true);
  assert.equal(await verifyPassword('wrong', { password_salt: storedPassword.salt, password_hash: storedPassword.hash }), false);
  assert.equal(detectImage(new Uint8Array([0xff, 0xd8, 0xff])), 'image/jpeg');
  assert.equal(detectImage(new TextEncoder().encode('<script>')), null);
  assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});
