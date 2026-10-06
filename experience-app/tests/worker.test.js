import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import experiences from '../src/experiences.json' with { type: 'json' };
import worker, { escapeHtml, isAdmin } from '../src/worker.js';
import { createSession, hashPassword, safeNext, sessionFromRequest, verifyPassword } from '../src/auth.js';

const id = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const fileId = '33333333-3333-4333-8333-333333333333';
const translations = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { title: `Title ${lang}`, summary: `Summary ${lang}`, body: `Body ${lang}` }]));
const storedPassword = await hashPassword('correct horse battery staple', 'AAAAAAAAAAAAAAAAAAAAAA');

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of ['0001_initial.sql', '0002_education.sql', '0003_accounts.sql', '0004_access_requests.sql', '0005_project_files.sql', '0006_work_experiences.sql', '0007_education_experiences.sql']) sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
  sqlite.prepare('INSERT INTO projects (id, status, sort_order, translations, experience_keys, education_keys, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?)').run(id, 'draft', JSON.stringify(translations), '["ai_rd_lead"]', '[]', '', '');
  sqlite.prepare('INSERT INTO educations (key, sort_order, translations) VALUES (?, 0, ?)').run('sample_school', JSON.stringify(Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { school: `Example school ${lang}`, degree: `Degree ${lang}`, date: '2017–2019', summary: `Summary ${lang}` }]))));
  const educationDetails = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { degree: `Private degree ${lang}`, study_mode: `Full-time ${lang}`, major: `Major ${lang}` }]));
  const educationProjects = [{ title: translationsTitle('Linked'), project_id: id }, { title: translationsTitle('Pending') }];
  sqlite.prepare('INSERT INTO education_experiences (key, details, projects) VALUES (?, ?, ?)').run('sample_school', JSON.stringify(educationDetails), JSON.stringify(educationProjects));
  sqlite.prepare('INSERT INTO media (id, project_id, object_key, content_type, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(imageId, id, `${id}/${imageId}`, 'image/png', '');
  sqlite.prepare('INSERT INTO project_files (id, project_id, object_key, download_name, byte_size, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fileId, id, `reports/${fileId}.pdf`, 'academic-report.pdf', 5, '');
  const workDescription = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, `Private work ${lang}`]));
  const workProjects = [{ title: translationsTitle('Linked'), project_id: id }, { title: translationsTitle('Pending') }];
  sqlite.prepare('INSERT INTO work_experiences (key, description, projects) VALUES (?, ?, ?)').run('ai_rd_lead', JSON.stringify(workDescription), JSON.stringify(workProjects));
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

function translationsTitle(value) { return Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, `${value} ${lang}`])); }

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
  for (const path of ['/zh/projects/', '/zh/projects/education/', '/zh/experiences/', '/zh/projects/work/ai_rd_lead/', '/zh/admin/accounts/', `/media/${imageId}`, `/files/${fileId}`]) {
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

test('academic PDF requires a session and a published project', async () => {
  const { env, sqlite } = fixture();
  const cookie = await loginCookie(env.DB, 'guest');
  assert.equal((await worker.fetch(request(`/files/${fileId}`, cookie), env, {})).status, 404);
  sqlite.prepare("UPDATE projects SET status = 'published' WHERE id = ?").run(id);
  const result = await worker.fetch(request(`/files/${fileId}`, cookie), env, {});
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('Content-Type'), 'application/pdf');
  assert.match(result.headers.get('Content-Disposition'), /attachment/);
  assert.equal((await worker.fetch(request(`/media/${imageId}`, cookie), env, {})).status, 200);
  assert.equal(safeNext(`/files/${fileId}`, 'zh'), `/files/${fileId}`);
});

test('login language menu matches the public site and keeps the selected work location', async () => {
  const { env } = fixture();
  const target = '/zh/projects/work/ai_rd_lead/';
  const login = await (await worker.fetch(request(`/zh/login/?next=${encodeURIComponent(target)}`), env, {})).text();
  assert.match(login, /<details class="language-menu"><summary[^>]*>中文<\/summary>/);
  assert.match(login, /href="\/en\/login\/\?next=%2Fen%2Fprojects%2Fwork%2Fai_rd_lead%2F"[^>]*>English<\/a>/);
  const apply = await (await worker.fetch(request(`/zh/request-access/?next=${encodeURIComponent(target)}`), env, {})).text();
  assert.match(apply, /href="\/ja\/request-access\/\?next=%2Fja%2Fprojects%2Fwork%2Fai_rd_lead%2F"[^>]*>日本語<\/a>/);
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
  const workRedirect = await worker.fetch(request(body.next, cookie), env, {});
  assert.equal(workRedirect.status, 303);
  assert.equal(workRedirect.headers.get('Location'), '/zh/experiences/#work-ai_rd_lead');
  assert.equal((await worker.fetch(request('/zh/admin/accounts/', cookie), env, {})).status, 403);
  assert.equal((await worker.fetch(request(`/${'zh'}/projects/${id}/`, cookie), env, {})).status, 404);
  sqlite.prepare("UPDATE projects SET status = 'published' WHERE id = ?").run(id);
  assert.equal((await worker.fetch(request(`/zh/projects/${id}/`, cookie), env, {})).status, 200);
  const session = await sessionFromRequest(request('/zh/projects/', cookie), DB);
  const privatePage = await worker.fetch(request('/zh/projects/', cookie), env, {});
  assert.match(privatePage.headers.get('Content-Security-Policy'), /form-action 'self' https:\/\/dengyaqi\.github\.io;/);
  const rejectedLogout = await worker.fetch(request('/zh/logout/', cookie, { method: 'POST', body: new URLSearchParams({ csrf: 'wrong' }) }), env, {});
  assert.equal(rejectedLogout.status, 403);
  assert.ok(await sessionFromRequest(request('/zh/projects/', cookie), DB));
  const signedOut = await worker.fetch(request('/zh/logout/', cookie, { method: 'POST', body: new URLSearchParams({ csrf: session.csrf_token }) }), env, {});
  assert.equal(signedOut.headers.get('Location'), 'https://dengyaqi.github.io/zh/about/');
  assert.match(signedOut.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal(await sessionFromRequest(request('/zh/projects/', cookie), DB), null);
  assert.equal((await worker.fetch(request('/zh/projects/', cookie), env, {})).status, 303);
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    const stale = await worker.fetch(request(`/${lang}/logout/`, cookie, { method: 'POST', body: new URLSearchParams() }), env, {});
    assert.equal(stale.status, 303);
    assert.equal(stale.headers.get('Location'), `https://dengyaqi.github.io/${lang}/about/`);
    assert.match(stale.headers.get('Set-Cookie'), /Max-Age=0/);
  }
});

test('visitor and admin navigation expose only their permitted destinations in all languages', async () => {
  const { env, DB, sqlite } = fixture();
  const adminCookie = await loginCookie(DB, 'owner');
  const viewerCookie = await loginCookie(DB, 'guest');
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    for (const [cookie, admin] of [[adminCookie, true], [viewerCookie, false]]) {
      const html = await (await worker.fetch(request(`/${lang}/projects/`, cookie), env, {})).text();
      for (const path of [`/${lang}/projects/`, `/${lang}/experiences/`, `/${lang}/projects/education/`]) assert.ok(html.includes(`href="${path}"`));
      assert.match(html, new RegExp(`<a href="/${lang}/experiences/">[^<]+</a><a href="/${lang}/projects/education/">[^<]+</a><a href="/${lang}/projects/">[^<]+</a>`));
      assert.ok(html.includes(`href="/${lang}/projects/">${{ zh: '其他项目', en: 'Other projects', ja: 'その他のプロジェクト', fr: 'Autres projets' }[lang]}</a>`));
      assert.ok(html.includes(`href="https://dengyaqi.github.io/${lang}/about/"`));
      assert.ok(html.includes(`action="/${lang}/logout/"`));
      assert.equal(html.includes(`href="/${lang}/admin/accounts/"`), admin);
      assert.equal(html.includes(`href="/${lang}/admin/requests/"`), admin);
      assert.ok(!html.includes(`href="/${lang}/admin/"`));
    }
  }
  sqlite.prepare("UPDATE projects SET status = 'published' WHERE id = ?").run(id);
  const detail = await (await worker.fetch(request(`/zh/projects/${id}/`, adminCookie), env, {})).text();
  assert.ok(!detail.includes(`/zh/admin/projects/${id}/edit/`));
});

test('retired content management routes return 404 without changing stored projects', async () => {
  const { env, DB, sqlite } = fixture();
  const adminCookie = await loginCookie(DB, 'owner');
  const viewerCookie = await loginCookie(DB, 'guest');
  const paths = ['/zh/admin/', '/zh/admin/projects/new/', `/zh/admin/projects/${id}/edit/`, `/zh/admin/projects/${id}/save/`, `/zh/admin/projects/${id}/publish/`, `/zh/admin/projects/${id}/unpublish/`, `/zh/admin/projects/${id}/delete/`, `/zh/admin/projects/${id}/images/`, `/zh/admin/images/${imageId}/delete/`];
  for (const path of paths) {
    for (const cookie of [undefined, adminCookie, viewerCookie]) {
      for (const method of ['GET', 'POST']) {
        const result = await worker.fetch(request(path, cookie, { method }), env, {});
        assert.equal(result.status, 404, `${method} ${path}`);
      }
    }
  }
  assert.equal(sqlite.prepare('SELECT status FROM projects WHERE id = ?').get(id).status, 'draft');
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
  assert.equal(safeNext(`/zh/projects/${id}/?from=education-sample_school`, 'zh'), `/zh/projects/${id}/?from=education-sample_school`);
  assert.equal(safeNext(`/zh/projects/${id}/?from=//attacker.test`, 'zh'), '/zh/projects/');
  const cookie = await loginCookie(DB, 'owner');
  const wrongCsrf = await worker.fetch(request('/zh/admin/accounts/', cookie, { method: 'POST', body: new URLSearchParams({ email: 'new@example.test', csrf: 'wrong' }) }), env, {});
  assert.equal(wrongCsrf.status, 403);
  const crossSite = await worker.fetch(request('/zh/logout/', cookie, { method: 'POST', headers: { Origin: 'https://attacker.test' }, body: new URLSearchParams({ csrf: 'wrong' }) }), env, {});
  assert.equal(crossSite.status, 403);
});

test('work timeline shows private copy and links only published projects in all languages', async () => {
  const { env, DB, sqlite } = fixture();
  const cookie = await loginCookie(DB, 'guest');
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    const all = await (await worker.fetch(request(`/${lang}/experiences/`, cookie), env, {})).text();
    assert.equal((all.match(/class="work-timeline-item"/g) || []).length, 6);
    assert.ok(all.includes(`Private work ${lang}`));
    assert.ok(all.includes(`Pending ${lang}`));
    assert.ok(!all.includes(`href="/${lang}/projects/${id}/"`));
    for (const item of experiences) {
      assert.ok(all.includes(`id="work-${item.key}"`));
      for (const path of [`/${lang}/projects/work/${item.key}/`, `/${lang}/experiences/${item.key}/`]) {
        const redirect = await worker.fetch(request(path, cookie), env, {});
        assert.equal(redirect.status, 303);
        assert.equal(redirect.headers.get('Location'), `/${lang}/experiences/#work-${item.key}`);
      }
    }
  }
  sqlite.prepare("UPDATE projects SET status = 'published' WHERE id = ?").run(id);
  const published = await (await worker.fetch(request('/zh/experiences/', cookie), env, {})).text();
  assert.ok(published.includes(`href="/zh/projects/${id}/?from=work-ai_rd_lead"`));
  assert.ok(!published.includes('href="/zh/projects/undefined/"'));
  assert.equal((await worker.fetch(request('/zh/projects/work/no_such_job/', cookie), env, {})).status, 404);
  assert.equal((await worker.fetch(request('/zh/experiences/no_such_job/', cookie), env, {})).status, 404);
});

test('education timeline shows private details and only published linked projects in all languages', async () => {
  const { env, DB, sqlite } = fixture();
  const cookie = await loginCookie(DB, 'guest');
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    const all = await (await worker.fetch(request(`/${lang}/projects/education/`, cookie), env, {})).text();
    assert.equal((all.match(/class="work-timeline-item"/g) || []).length, 1);
    assert.ok(all.includes(`Private degree ${lang}`));
    assert.ok(all.includes(`Full-time ${lang}`));
    assert.ok(all.includes(`Major ${lang}`));
    assert.ok(all.includes(`Pending ${lang}`));
    assert.ok(!all.includes(`Summary ${lang}`));
    assert.ok(!all.includes(`href="/${lang}/projects/${id}/"`));
    const school = await (await worker.fetch(request(`/${lang}/projects/education/sample_school/`, cookie), env, {})).text();
    assert.equal((school.match(/class="work-timeline-item"/g) || []).length, 1);
    assert.match(school, new RegExp(`href="/${lang === 'zh' ? 'en' : 'zh'}/projects/education/sample_school/"`));
  }
  sqlite.prepare("UPDATE projects SET status = 'published', education_keys = ? WHERE id = ?").run('["sample_school"]', id);
  const published = await (await worker.fetch(request('/zh/projects/education/', cookie), env, {})).text();
  assert.ok(published.includes(`href="/zh/projects/${id}/?from=education-sample_school"`));
  assert.equal((await worker.fetch(request('/zh/projects/education/no_school/', cookie), env, {})).status, 404);
});

test('project detail returns to the timeline it came from', async () => {
  const { env, DB, sqlite } = fixture();
  const cookie = await loginCookie(DB, 'guest');
  sqlite.prepare("UPDATE projects SET status = 'published', education_keys = ? WHERE id = ?").run('["sample_school"]', id);
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    for (const [source, expected, other] of [['work-ai_rd_lead', 'work/ai_rd_lead', 'education/sample_school'], ['education-sample_school', 'education/sample_school', 'work/ai_rd_lead']]) {
      const html = await (await worker.fetch(request(`/${lang}/projects/${id}/?from=${source}`, cookie), env, {})).text();
      assert.match(html, new RegExp(`<nav class="detail-back"[^>]*><a href="/${lang}/projects/${expected}/">`));
      assert.doesNotMatch(html, new RegExp(`<nav class="detail-back"[^>]*><a href="/${lang}/projects/${other}/">`));
      assert.ok(html.includes(`href="/${lang === 'zh' ? 'en' : 'zh'}/projects/${id}/?from=${source}"`));
    }
    const direct = await (await worker.fetch(request(`/${lang}/projects/${id}/`, cookie), env, {})).text();
    assert.match(direct, new RegExp(`<nav class="detail-back"[^>]*><a href="/${lang}/projects/work/ai_rd_lead/">`));
  }
  const login = await worker.fetch(request(`/zh/projects/${id}/?from=education-sample_school`), env, {});
  assert.equal(login.status, 303);
  assert.equal(login.headers.get('Location'), `/zh/login/?next=${encodeURIComponent(`/zh/projects/${id}/?from=education-sample_school`)}`);
});

test('GIF modules appear once per project and keep media access protected', async () => {
  const { env, DB, sqlite } = fixture();
  const gifId = '55555555-5555-4555-8555-555555555555';
  const content = structuredClone(translations);
  for (const lang of ['zh', 'en', 'ja', 'fr']) content[lang].modules = [{ title: `Browse ${lang}`, media_id: gifId }];
  sqlite.prepare('UPDATE projects SET status = ?, translations = ? WHERE id = ?').run('published', JSON.stringify(content), id);
  sqlite.prepare('INSERT INTO media (id, project_id, object_key, content_type, sort_order, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(gifId, id, `${id}/${gifId}.gif`, 'image/gif', '');
  const cookie = await loginCookie(DB, 'guest');
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    const html = await (await worker.fetch(request(`/${lang}/projects/${id}/`, cookie), env, {})).text();
    assert.ok(html.includes(`<h2>Browse ${lang}</h2><img src="/media/${gifId}"`));
    assert.equal((html.match(new RegExp(`/media/${gifId}`, 'g')) || []).length, 1);
    assert.ok(html.includes(`/media/${imageId}`));
  }
  assert.equal((await worker.fetch(request(`/media/${gifId}`), env, {})).status, 303);
  assert.equal((await worker.fetch(request(`/media/${gifId}`, cookie), env, {})).headers.get('Content-Type'), 'image/gif');
});

test('other projects lists only five standalone published projects in order', async () => {
  const { env, DB, sqlite } = fixture();
  const cookie = await loginCookie(DB, 'guest');
  sqlite.prepare("UPDATE projects SET status = 'published', education_keys = ? WHERE id = ?").run('["sample_school"]', id);
  const standaloneIds = Array.from({ length: 5 }, (_, index) => `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`);
  for (const [index, projectId] of standaloneIds.entries()) {
    const titles = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { title: `Other ${index + 1} ${lang}`, summary: `Standalone ${lang}`, body: `Private detail ${lang}` }]));
    sqlite.prepare('INSERT INTO projects (id, status, sort_order, translations, experience_keys, education_keys, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(projectId, 'published', index + 100, JSON.stringify(titles), '[]', '[]', '', '');
  }
  for (const lang of ['zh', 'en', 'ja', 'fr']) {
    const response = await worker.fetch(request(`/${lang}/projects/`, cookie), env, {});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal((html.match(/class="card other-project-card"/g) || []).length, 5);
    assert.ok(!html.includes(`href="/${lang}/projects/${id}/"`));
    assert.ok(!html.includes('class="overview-entry"'));
    assert.ok(html.indexOf(`Other 1 ${lang}`) < html.indexOf(`Other 5 ${lang}`));
    for (const projectId of standaloneIds) {
      assert.ok(html.includes(`href="/${lang}/projects/${projectId}/"`));
      const detail = await worker.fetch(request(`/${lang}/projects/${projectId}/`, cookie), env, {});
      assert.equal(detail.status, 200);
      const body = await detail.text();
      assert.ok(body.includes(`Private detail ${lang}`));
      assert.ok(body.includes(`href="/${lang}/projects/"`));
      assert.ok(!body.includes('github.com'));
    }
    assert.equal((await worker.fetch(request(`/${lang}/projects/`), env, {})).status, 303);
  }
});

test('private education import validates four-language fields and project links', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-education-import-test-'));
  const input = join(directory, 'private.json');
  const script = fileURLToPath(new URL('../scripts/import-private-content.mjs', import.meta.url));
  const item = { key: 'sample_school', details: Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { degree: 'Master', study_mode: 'Full-time', major: 'Computing' }])), projects: [{ title: translationsTitle('Project'), project_id: id }] };
  try {
    writeFileSync(input, JSON.stringify({ education_experiences: [item] }));
    assert.equal(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    item.projects[0].project_id = 'https://example.test';
    writeFileSync(input, JSON.stringify({ education_experiences: [item] }));
    assert.notEqual(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('private import accepts linked or standalone projects and requires four complete translations', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-import-test-'));
  const input = join(directory, 'private.json');
  const script = fileURLToPath(new URL('../scripts/import-private-content.mjs', import.meta.url));
  try {
    const item = { id, status: 'published', sort_order: 0, translations: structuredClone(translations), education_keys: [], experience_keys: ['ai_rd_lead'] };
    writeFileSync(input, JSON.stringify({ projects: [item] }));
    assert.equal(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    item.experience_keys = [];
    writeFileSync(input, JSON.stringify({ projects: [item] }));
    assert.equal(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    for (const lang of ['zh', 'en', 'ja', 'fr']) item.translations[lang].modules = [{ title: `Demo ${lang}`, media_id: imageId }];
    writeFileSync(input, JSON.stringify({ projects: [item] }));
    assert.equal(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    item.translations.fr.modules[0].media_id = id;
    writeFileSync(input, JSON.stringify({ projects: [item] }));
    assert.notEqual(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    item.translations.fr.modules[0].media_id = imageId;
    delete item.translations.fr.body;
    writeFileSync(input, JSON.stringify({ projects: [item] }));
    assert.notEqual(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('private GIF upload rejects non-GIF files before storage changes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-gif-import-test-'));
  const file = join(directory, 'fake.gif');
  const input = join(directory, 'private.json');
  try {
    writeFileSync(file, 'not a GIF');
    writeFileSync(input, JSON.stringify({ media: [{ id: imageId, project_id: id, file }] }));
    const script = fileURLToPath(new URL('../scripts/upload-private-gifs.mjs', import.meta.url));
    assert.notEqual(spawnSync(process.execPath, [script, input, '--local'], { encoding: 'utf8' }).status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('private work import validates four-language descriptions and project links', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-work-import-test-'));
  const input = join(directory, 'private.json');
  const script = fileURLToPath(new URL('../scripts/import-private-content.mjs', import.meta.url));
  const item = { key: 'ai_rd_lead', description: translationsTitle('Description'), projects: [{ title: translationsTitle('Project'), project_id: id }] };
  try {
    writeFileSync(input, JSON.stringify({ work_experiences: [item] }));
    assert.equal(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
    item.projects[0].project_id = 'https://example.test';
    writeFileSync(input, JSON.stringify({ work_experiences: [item] }));
    assert.notEqual(spawnSync(process.execPath, [script, input], { encoding: 'utf8' }).status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('password hashes and HTML escaping are safe', async () => {
  assert.equal(await verifyPassword('correct horse battery staple', { password_salt: storedPassword.salt, password_hash: storedPassword.hash }), true);
  assert.equal(await verifyPassword('wrong', { password_salt: storedPassword.salt, password_hash: storedPassword.hash }), false);
  assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});
