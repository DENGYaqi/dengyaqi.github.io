import experiences from './experiences.json' with { type: 'json' };
import { copy, languages } from './i18n.js';
import style from './style.js';
import glossaryClient from './glossary-client.js';
import { clearLoginAttempts, createSession, expiredCookie, formToken, hashPassword, newPassword, normalizeEmail, rateLimited, revokeSession, safeNext, sessionFromRequest, validCsrf, validFormToken, verifyPassword } from './auth.js';

const MAX_ANONYMOUS_FORM_BYTES = 16 * 1024;
const ID = '[0-9a-f-]{36}';
const publicOrigin = 'https://dengyaqi.github.io';
const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Security-Policy': `default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; form-action 'self' ${publicOrigin}; base-uri 'none'; frame-ancestors 'none'`,
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
};

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const url = value => escapeHtml(value);
const tr = (project, lang) => project.translations?.[lang] ?? {};
const titleOf = (project, lang) => tr(project, lang).title || copy[lang].noTitle;
const isUuid = value => new RegExp(`^${ID}$`).test(value);
export const isAdmin = account => account?.role === 'admin';

function response(body, status = 200, contentType = 'text/html; charset=utf-8', cookie) {
  return new Response(body, { status, headers: { ...headers, 'Content-Type': contentType, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
}
function redirect(path, cookie) {
  return new Response(null, { status: 303, headers: { ...headers, Location: path, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
}
function message(lang, text, status = 400, token = '') {
  return response(page(lang, text, `<div class="notice error">${escapeHtml(text)}</div><p><a href="/${lang}/projects/">${copy[lang].allProjects}</a></p>`, false, `/${lang}/projects/`, token), status);
}
const languageLabels = {
  zh: ['中文', '中文'], en: ['EN', 'English'], ja: ['日本語', '日本語'], fr: ['FR', 'Français'],
};
function languageMenu(lang, hrefFor) {
  const options = languages.map(code => `<a href="${url(hrefFor(code))}" lang="${code}"${code === lang ? ' class="active" aria-current="page"' : ''}>${languageLabels[code][1]}</a>`).join('');
  return `<details class="language-menu"><summary aria-label="${copy[lang].switchLanguage}">${languageLabels[lang][0]}</summary><div class="language-options">${options}</div></details>`;
}
function page(lang, title, body, admin = false, path = `/${lang}/projects/`, token = '') {
  const c = copy[lang];
  const langs = languageMenu(lang, code => path.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`));
  const logoutForm = token ? `<form method="post" action="/${lang}/logout/">${hiddenCsrf(token)}<button class="nav-logout" type="submit">${c.logout}</button></form>` : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body><header><strong>${c.site}<span class="dot">.</span></strong><nav aria-label="${c.projects}"><a href="/${lang}/experiences/">${c.experiences}</a><a href="/${lang}/projects/education/">${c.education}</a><a href="/${lang}/projects/">${c.otherProjects}</a>${admin ? `<a href="/${lang}/admin/accounts/">${c.auth.accounts}</a><a href="/${lang}/admin/requests/">${requestsCopy[lang].adminTitle}</a>` : ''}<a href="${publicOrigin}/${lang}/about/">${c.back}</a>${logoutForm}</nav><div class="language" aria-label="${c.switchLanguage}">${langs}</div></header><main>${body}</main><footer>${c.site} · ${c.projects}</footer></body></html>`;
}

const requestsCopy = {
  zh: { link: '申请查看', title: '申请查看项目', intro: '留下邮箱和申请理由。审核后，我会自行通过邮件发送账号和密码。', reason: '申请理由', send: '提交申请', received: '申请已收到。审核后会通过邮件联系你。', backLogin: '返回登录', invalid: '请填写有效邮箱及 1–1000 字的申请理由。', adminTitle: '查看申请', pending: '待处理', approved: '已批准', dismissed: '未通过', approve: '批准并生成密码', dismiss: '标记不通过', empty: '暂无申请。', source: '申请来源', when: '申请时间' },
  en: { link: 'Request access', title: 'Request project access', intro: 'Leave your email and reason. If approved, I will email your account and password myself.', reason: 'Reason for requesting access', send: 'Send request', received: 'Request received. I will contact you by email after review.', backLogin: 'Back to sign in', invalid: 'Enter a valid email and a reason of 1–1000 characters.', adminTitle: 'Access requests', pending: 'Pending', approved: 'Approved', dismissed: 'Declined', approve: 'Approve and generate password', dismiss: 'Decline', empty: 'No requests yet.', source: 'Requested page', when: 'Requested at' },
  ja: { link: '閲覧を申請', title: 'プロジェクトの閲覧申請', intro: 'メールアドレスと申請理由を入力してください。承認後、アカウントとパスワードをメールでお送りします。', reason: '申請理由', send: '申請する', received: '申請を受け付けました。審査後にメールでご連絡します。', backLogin: 'ログインに戻る', invalid: '有効なメールアドレスと1～1000文字の理由を入力してください。', adminTitle: '閲覧申請', pending: '審査中', approved: '承認済み', dismissed: '却下', approve: '承認してパスワードを発行', dismiss: '却下する', empty: '申請はありません。', source: '申請元', when: '申請日時' },
  fr: { link: 'Demander l’accès', title: 'Demander l’accès aux projets', intro: 'Indiquez votre e-mail et votre motif. Après validation, je vous enverrai moi-même vos identifiants.', reason: 'Motif de la demande', send: 'Envoyer la demande', received: 'Demande reçue. Je vous contacterai par e-mail après examen.', backLogin: 'Retour à la connexion', invalid: 'Saisissez un e-mail valide et un motif de 1 à 1000 caractères.', adminTitle: 'Demandes d’accès', pending: 'En attente', approved: 'Approuvée', dismissed: 'Refusée', approve: 'Approuver et créer un mot de passe', dismiss: 'Refuser', empty: 'Aucune demande.', source: 'Page demandée', when: 'Date de demande' },
};

function loginPage(lang, next, csrf, error = '') {
  const c = copy[lang], a = c.auth;
  const languagesNav = languageMenu(lang, code => `/${code}/login/?next=${encodeURIComponent(next.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}`);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${a.title} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body class="login-page"><header><strong>${c.site}<span class="dot">.</span></strong><div class="language">${languagesNav}</div></header><main><div class="login-panel"><p class="eyebrow">${c.projects}</p><h1>${a.title}</h1><p class="muted">${a.intro}</p>${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}<form method="post" action="/${lang}/login/"><input type="hidden" name="next" value="${url(next)}">${hiddenCsrf(csrf)}<div class="field"><label for="email">${a.email}</label><input id="email" name="email" type="email" autocomplete="username" maxlength="254" required></div><div class="field"><label for="password">${a.password}</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><button type="submit">${a.submit}</button></form><p><a href="/${lang}/request-access/?next=${encodeURIComponent(next)}">${requestsCopy[lang].link}</a></p><p><a href="${publicOrigin}/${lang}/about/">← ${c.back}</a></p></div></main></body></html>`;
}

function requestPage(lang, next, csrf, error = '', done = false) {
  const c = copy[lang], a = requestsCopy[lang];
  const languagesNav = languageMenu(lang, code => `/${code}/request-access/?next=${encodeURIComponent(next.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}`);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${a.title} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body class="login-page"><header><strong>${c.site}<span class="dot">.</span></strong><div class="language">${languagesNav}</div></header><main><div class="login-panel"><p class="eyebrow">${c.projects}</p><h1>${a.title}</h1><p class="muted">${a.intro}</p>${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}${done ? `<div class="notice" role="status">${a.received}</div>` : `<form method="post" action="/${lang}/request-access/"><input type="hidden" name="next" value="${url(next)}">${hiddenCsrf(csrf)}<div class="field"><label for="email">${c.auth.email}</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="field"><label for="reason">${a.reason}</label><textarea id="reason" name="reason" maxlength="1000" required></textarea></div><button type="submit">${a.send}</button></form>`}<p><a href="/${lang}/login/?next=${encodeURIComponent(next)}">← ${a.backLogin}</a></p><p><a href="${publicOrigin}/${lang}/about/">← ${c.back}</a></p></div></main></body></html>`;
}
function projectFromRow(row) {
  return { ...row, translations: JSON.parse(row.translations), experience_keys: JSON.parse(row.experience_keys), education_keys: JSON.parse(row.education_keys ?? '[]') };
}
async function educations(db) {
  const rows = await db.prepare('SELECT * FROM educations ORDER BY sort_order, key').all();
  return rows.results.map(row => ({ ...row, translations: JSON.parse(row.translations) }));
}
async function projects(db) {
  const rows = await db.prepare("SELECT * FROM projects WHERE status = 'published' ORDER BY sort_order, created_at DESC").all();
  return rows.results.map(projectFromRow);
}
async function workEntries(db) {
  const rows = await db.prepare('SELECT * FROM work_experiences').all();
  return new Map(rows.results.map(row => [row.key, { description: JSON.parse(row.description), projects: JSON.parse(row.projects) }]));
}
async function educationEntries(db) {
  const rows = await db.prepare('SELECT * FROM education_experiences').all();
  return new Map(rows.results.map(row => [row.key, { details: JSON.parse(row.details), projects: JSON.parse(row.projects) }]));
}
async function project(db, id) {
  if (!isUuid(id)) return null;
  const row = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return row && projectFromRow(row);
}
async function images(db, projectId) {
  const rows = await db.prepare('SELECT * FROM media WHERE project_id = ? ORDER BY sort_order, created_at').bind(projectId).all();
  return rows.results;
}
async function projectFiles(db, projectId) {
  const rows = await db.prepare('SELECT id, download_name FROM project_files WHERE project_id = ? ORDER BY created_at, id').bind(projectId).all();
  return rows.results;
}
function experience(key) { return experiences.find(item => item.key === key); }
function experienceName(item, lang) { return item.title[lang] || item.title.zh; }
function educationName(item, lang) { return item.translations[lang]?.school || item.translations.zh?.school || item.key; }
function cards(items, lang) {
  const c = copy[lang];
  if (!items.length) return `<p class="muted">${c.empty}</p>`;
  return `<div class="grid other-projects">${items.map(item => `<a class="card other-project-card" href="/${lang}/projects/${url(item.id)}/"><div class="eyebrow">${c.open} →</div><h2>${escapeHtml(titleOf(item, lang))}</h2><p>${escapeHtml(tr(item, lang).summary)}</p></a>`).join('')}</div>`;
}
function prettyBody(text) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean).map(part => `<p>${escapeHtml(part)}</p>`).join('');
}

async function otherProjectsPage(db, lang) {
  const c = copy[lang];
  const items = (await projects(db)).filter(item => !item.experience_keys.length && !item.education_keys.length);
  return `<div class="work-hero"><span class="work-label">OTHER PROJECTS</span><h1>${c.otherProjects}</h1></div><section aria-label="${c.otherProjects}">${cards(items, lang)}</section>`;
}

async function workTimeline(db, lang) {
  const c = copy[lang];
  const details = await workEntries(db);
  const published = new Map((await projects(db)).map(item => [item.id, item]));
  const cards = experiences.map(item => {
    const content = details.get(item.key);
    const description = content?.description?.[lang] || item.summary[lang] || item.summary.zh;
    const date = typeof item.date === 'object' ? item.date[lang] || item.date.zh : item.date;
    const tags = (item.tags || []).map(tag => `<span class="work-tag">${escapeHtml(tag)}</span>`).join('');
    const projectList = (content?.projects || []).map(project => {
      const linked = published.get(project.project_id)?.experience_keys.includes(item.key);
      const title = escapeHtml(project.title[lang] || project.title.zh);
      return `<li>${linked ? `<a href="/${lang}/projects/${url(project.project_id)}/?from=work-${url(item.key)}">${title}<span>${c.open} →</span></a>` : `<div>${title}<span class="work-pending">${c.pending}</span></div>`}</li>`;
    }).join('');
    return `<article id="work-${url(item.key)}" class="work-timeline-item"><div class="work-timeline-card"><div class="work-heading"><div><h2>${escapeHtml(experienceName(item, lang))}</h2><p class="work-company">${escapeHtml(item.company[lang] || item.company.zh)}</p></div><span class="work-date">${escapeHtml(date)}</span></div><p class="work-description">${escapeHtml(description)}</p><div class="work-tags">${tags}</div>${projectList ? `<div class="work-projects"><h3>${c.relatedProjects}</h3><ul>${projectList}</ul></div>` : ''}</div></article>`;
  }).join('');
  return `<div class="work-hero"><span class="work-label">EXPERIENCE</span><h1>${c.experiences}</h1></div><section class="work-timeline" aria-label="${c.experiences}">${cards}</section>`;
}

async function educationTimeline(db, lang, focus) {
  const c = copy[lang];
  const schools = await educations(db);
  const entries = focus ? schools.filter(item => item.key === focus) : schools;
  if (!entries.length) return null;
  const details = await educationEntries(db);
  const published = new Map((await projects(db)).map(item => [item.id, item]));
  const cards = entries.map(item => {
    const content = details.get(item.key);
    const fields = content?.details?.[lang] || content?.details?.zh;
    const date = item.translations[lang]?.date || item.translations.zh?.date || '';
    const projectList = (content?.projects || []).map(project => {
      const linked = published.get(project.project_id)?.education_keys.includes(item.key);
      const title = escapeHtml(project.title[lang] || project.title.zh);
      return `<li>${linked ? `<a href="/${lang}/projects/${url(project.project_id)}/?from=education-${url(item.key)}">${title}<span>${c.open} →</span></a>` : `<div>${title}<span class="work-pending">${c.pending}</span></div>`}</li>`;
    }).join('');
    const facts = fields ? `<p class="education-facts"><span>${c.degreeLabel}${escapeHtml(fields.degree)}</span><span>${c.studyModeLabel}${escapeHtml(fields.study_mode)}</span><span>${c.majorLabel}${escapeHtml(fields.major)}</span></p>` : '';
    return `<article class="work-timeline-item"><div class="work-timeline-card"><div class="work-heading"><h2>${escapeHtml(educationName(item, lang))}</h2><span class="work-date">${escapeHtml(date)}</span></div>${facts}${projectList ? `<div class="work-projects"><h3>${c.relatedProjects}</h3><ul>${projectList}</ul></div>` : ''}</div></article>`;
  }).join('');
  return `<div class="work-hero"><span class="work-label">EDUCATION</span><h1>${c.education}</h1></div><section class="work-timeline" aria-label="${c.education}">${cards || `<p class="muted">${c.educationEmpty}</p>`}</section>`;
}

function hiddenCsrf(token) { return `<input type="hidden" name="csrf" value="${url(token)}">`; }
function adminForm(action, token, label, variant = '') { return `<form method="post" action="${url(action)}">${hiddenCsrf(token)}<button${variant ? ` class="${variant}"` : ''} type="submit">${escapeHtml(label)}</button></form>`; }
async function anonymousForm(request) {
  const type = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/x-www-form-urlencoded') throw new Error('content_type');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body_missing');
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_ANONYMOUS_FORM_BYTES) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  return new URLSearchParams(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
}
async function requestLimited(db, request, email) {
  const now = Math.floor(Date.now() / 1000), threshold = now - 3600;
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  for (const [key, limit] of [[`request-ip:${ip}`, 10], [`request-email:${email}`, 3]]) {
    await db.prepare('INSERT INTO login_attempts (key, hits, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = CASE WHEN window_start < ? THEN 1 ELSE hits + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END').bind(key, now, threshold, threshold).run();
    if ((await db.prepare('SELECT hits FROM login_attempts WHERE key = ?').bind(key).first()).hits > limit) return true;
  }
  return false;
}
async function requestsPage(db, lang, token, password = '') {
  const a = requestsCopy[lang], c = copy[lang];
  const rows = await db.prepare('SELECT * FROM access_requests ORDER BY CASE status WHEN \'pending\' THEN 0 ELSE 1 END, created_at DESC LIMIT 100').all();
  const notice = password ? `<div class="notice" role="status"><strong>${c.auth.initialPassword}</strong><p><code>${escapeHtml(password)}</code></p><p>${c.auth.copyNow}</p></div>` : '';
  const list = rows.results.map(item => `<div class="admin-item"><div><strong>${escapeHtml(item.email)}</strong> <span class="tag">${a[item.status]}</span><p>${escapeHtml(item.reason)}</p><p class="muted">${a.when}: ${escapeHtml(new Date(item.created_at * 1000).toLocaleString(lang))} · ${a.source}: <a href="${url(safeNext(item.target_path, lang))}">${escapeHtml(item.target_path)}</a></p></div>${item.status === 'pending' ? `<div class="actions">${adminForm(`/${lang}/admin/requests/${item.id}/approve/`, token, a.approve)}${adminForm(`/${lang}/admin/requests/${item.id}/dismiss/`, token, a.dismiss, 'secondary')}</div>` : ''}</div>`).join('');
  return page(lang, a.adminTitle, `<h1>${a.adminTitle}</h1>${notice}<div class="panel">${list || `<p class="muted">${a.empty}</p>`}</div>`, true, `/${lang}/admin/requests/`, token);
}
async function accountsPage(db, lang, token, issuedPassword = '') {
  const c = copy[lang], a = c.auth;
  const rows = await db.prepare("SELECT id, email, enabled FROM accounts WHERE role = 'viewer' ORDER BY created_at DESC").all();
  const notice = issuedPassword ? `<div class="notice" role="status"><strong>${a.initialPassword}</strong><p><code>${escapeHtml(issuedPassword)}</code></p><p>${a.copyNow}</p></div>` : '';
  const list = rows.results.map(account => `<div class="admin-item"><div><strong>${escapeHtml(account.email)}</strong> <span class="tag">${account.enabled ? a.enabled : a.disabled}</span></div><div class="actions">${adminForm(`/${lang}/admin/accounts/${account.id}/reset/`, token, a.reset, 'secondary')}${adminForm(`/${lang}/admin/accounts/${account.id}/${account.enabled ? 'disable' : 'enable'}/`, token, account.enabled ? a.disable : a.enable, account.enabled ? 'danger' : 'secondary')}</div></div>`).join('');
  return page(lang, a.accounts, `<h1>${a.accounts}</h1>${notice}<form method="post" action="/${lang}/admin/accounts/" class="panel"><div class="field"><label for="email">${a.email}</label><input id="email" name="email" type="email" maxlength="254" required></div>${hiddenCsrf(token)}<button type="submit">${a.create}</button></form><div class="panel">${list || `<p class="muted">${a.noAccounts}</p>`}</div>`, true, `/${lang}/admin/accounts/`, token);
}
async function handlePost(env, lang, path, form, token) {
  const c = copy[lang], base = `/${lang}/admin/`;
  const requestAction = path.match(new RegExp(`^/${lang}/admin/requests/(${ID})/(approve|dismiss)/$`));
  if (requestAction) {
    const item = await env.DB.prepare("SELECT * FROM access_requests WHERE id = ? AND status = 'pending'").bind(requestAction[1]).first();
    if (!item) return message(lang, c.notFound, 404);
    const now = Math.floor(Date.now() / 1000);
    if (requestAction[2] === 'dismiss') {
      await env.DB.prepare("UPDATE access_requests SET status = 'dismissed', handled_at = ? WHERE id = ? AND status = 'pending'").bind(now, item.id).run();
      return redirect(`${base}requests/`);
    }
    const password = newPassword(), { salt, hash } = await hashPassword(password);
    const existing = await env.DB.prepare('SELECT id, role FROM accounts WHERE email = ?').bind(item.email).first();
    if (existing?.role === 'admin') return message(lang, c.invalid, 409);
    if (existing) {
      await env.DB.prepare('UPDATE accounts SET password_salt = ?, password_hash = ?, enabled = 1 WHERE id = ?').bind(salt, hash, existing.id).run();
      await env.DB.prepare('DELETE FROM sessions WHERE account_id = ?').bind(existing.id).run();
    } else {
      await env.DB.prepare('INSERT INTO accounts (id, email, role, password_salt, password_hash, enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(crypto.randomUUID(), item.email, 'viewer', salt, hash, now).run();
    }
    await env.DB.prepare("UPDATE access_requests SET status = 'approved', handled_at = ? WHERE id = ? AND status = 'pending'").bind(now, item.id).run();
    return response(await requestsPage(env.DB, lang, token, password));
  }
  if (path === `${base}accounts/`) {
    const email = normalizeEmail(form.get('email'));
    if (!email) return message(lang, c.invalid);
    const existing = await env.DB.prepare('SELECT id FROM accounts WHERE email = ?').bind(email).first();
    if (existing) return message(lang, c.auth.accountExists);
    const password = newPassword(), { salt, hash } = await hashPassword(password);
    await env.DB.prepare('INSERT INTO accounts (id, email, role, password_salt, password_hash, enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(crypto.randomUUID(), email, 'viewer', salt, hash, Math.floor(Date.now() / 1000)).run();
    return response(await accountsPage(env.DB, lang, token, password));
  }
  const accountAction = path.match(new RegExp(`^/${lang}/admin/accounts/(${ID})/(reset|disable|enable)/$`));
  if (accountAction) {
    const account = await env.DB.prepare("SELECT id FROM accounts WHERE id = ? AND role = 'viewer'").bind(accountAction[1]).first();
    if (!account) return message(lang, c.notFound, 404);
    if (accountAction[2] === 'reset') {
      const password = newPassword(), { salt, hash } = await hashPassword(password);
      await env.DB.prepare('UPDATE accounts SET password_salt = ?, password_hash = ? WHERE id = ?').bind(salt, hash, account.id).run();
      await env.DB.prepare('DELETE FROM sessions WHERE account_id = ?').bind(account.id).run();
      return response(await accountsPage(env.DB, lang, token, password));
    }
    await env.DB.prepare('UPDATE accounts SET enabled = ? WHERE id = ?').bind(accountAction[2] === 'enable' ? 1 : 0, account.id).run();
    if (accountAction[2] === 'disable') await env.DB.prepare('DELETE FROM sessions WHERE account_id = ?').bind(account.id).run();
    return redirect(`${base}accounts/`);
  }
  return message(lang, c.notFound, 404);
}

async function handleGet(env, lang, path, admin, token, source) {
  const c = copy[lang];
  const workFocus = path.match(new RegExp(`^/${lang}/projects/work/([a-z0-9_]+)/$`));
  const schoolFocus = path.match(new RegExp(`^/${lang}/projects/education/([a-z0-9_]+)/$`));
  const expMatch = path.match(new RegExp(`^/${lang}/experiences/([a-z0-9_]+)/$`));
  const workKey = workFocus?.[1] || expMatch?.[1];
  if (workKey) return experience(workKey) ? redirect(`/${lang}/experiences/#work-${workKey}`) : message(lang, c.notFound, 404);
  if (path === `/${lang}/experiences/`) return response(page(lang, c.experiences, await workTimeline(env.DB, lang), admin, path, token));
  if (path === `/${lang}/projects/education/` || schoolFocus) {
    const body = await educationTimeline(env.DB, lang, schoolFocus?.[1]);
    return body ? response(page(lang, c.education, body, admin, path, token)) : message(lang, c.notFound, 404);
  }
  if (path === `/${lang}/projects/`) {
    return response(page(lang, c.otherProjects, await otherProjectsPage(env.DB, lang), admin, path, token));
  }
  const detail = path.match(new RegExp(`^/${lang}/projects/(${ID})/$`));
  if (detail) {
    const item = await project(env.DB, detail[1]);
    if (!item || (item.status !== 'published' && !admin)) return message(lang, c.notFound, 404);
    const photos = await images(env.DB, item.id), files = await projectFiles(env.DB, item.id), t = tr(item, lang);
    const schools = await educations(env.DB);
    const workLinks = item.experience_keys.map(key => experience(key)).filter(Boolean).map(exp => ({ key: exp.key, href: `/${lang}/projects/work/${url(exp.key)}/`, label: experienceName(exp, lang) }));
    const educationLinks = item.education_keys.map(key => schools.find(school => school.key === key)).filter(Boolean).map(school => ({ key: school.key, href: `/${lang}/projects/education/${url(school.key)}/`, label: educationName(school, lang) }));
    const linked = [...workLinks, ...educationLinks].map(link => `<a class="tag" href="${link.href}">${escapeHtml(link.label)}</a>`).join('');
    const photosById = new Map(photos.map(photo => [photo.id, photo]));
    const modules = (Array.isArray(t.modules) ? t.modules : []).filter(module => photosById.get(module.media_id)?.content_type === 'image/gif');
    const moduleIds = new Set(modules.map(module => module.media_id));
    const demonstrations = modules.map(module => `<section class="project-module"><h2>${escapeHtml(module.title)}</h2><img src="/media/${url(module.media_id)}" alt="${escapeHtml(module.title)}" loading="lazy"></section>`).join('');
    const otherPhotos = photos.filter(photo => !moduleIds.has(photo.id));
    const gallery = otherPhotos.length ? `<h2>${c.photos}</h2><div class="gallery">${otherPhotos.map(photo => `<a href="/media/${url(photo.id)}"><img src="/media/${url(photo.id)}" alt="${escapeHtml(t.title)}" loading="lazy"></a>`).join('')}</div>` : '';
    const downloads = files.length ? `<section><h2>${c.downloads}</h2><ul>${files.map(file => `<li><a href="/files/${url(file.id)}">${escapeHtml(file.download_name)}</a></li>`).join('')}</ul></section>` : '';
    const selectedWork = source?.startsWith('work-') && workLinks.find(link => link.key === source.slice(5));
    const selectedEducation = source?.startsWith('education-') && educationLinks.find(link => link.key === source.slice(10));
    const destination = selectedWork || selectedEducation || workLinks[0] || educationLinks[0];
    const backHref = destination?.href || `/${lang}/projects/`;
    const backLabel = selectedEducation || (!selectedWork && !workLinks.length && educationLinks.length) ? c.backToEducation : destination ? c.backToWork : c.otherProjects;
    const backLink = `<a href="${backHref}">← ${backLabel}</a>`;
    const back = `<nav class="detail-back" aria-label="${c.projects}">${backLink}</nav>`;
    const topBack = `<nav class="detail-back detail-back-top" aria-label="${c.projects}">${backLink}${item.status === 'draft' ? `<span class="tag">${c.draft}</span>` : ''}</nav>`;
    const currentPath = selectedWork || selectedEducation ? `${path}?from=${source}` : path;
    return response(page(lang, t.title || c.noTitle, `${topBack}<h1>${escapeHtml(t.title || c.noTitle)}</h1><p class="lead">${escapeHtml(t.summary)}</p><div>${linked}</div><section class="prose" data-glossary-url="/${lang}/projects/${url(item.id)}/glossary/">${prettyBody(t.body)}</section>${demonstrations}${gallery}${downloads}${back}<script src="/glossary.js" defer></script>`, admin, currentPath, token));
  }
  if (path === `/${lang}/admin/requests/` || path === `/${lang}/admin/accounts/`) {
    if (!admin) return message(lang, c.adminOnly, 403);
    if (path === `/${lang}/admin/requests/`) return response(await requestsPage(env.DB, lang, token));
    return response(await accountsPage(env.DB, lang, token));
  }
  return message(lang, c.notFound, 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const requestUrl = new URL(request.url), path = requestUrl.pathname;
      if (request.method === 'GET' && path === '/style.css') return response(style, 200, 'text/css; charset=utf-8');
      if (request.method === 'GET' && path === '/glossary.js') return response(glossaryClient, 200, 'text/javascript; charset=utf-8');
      if (request.method === 'GET' && path === '/robots.txt') return response('User-agent: *\nDisallow: /\n', 200, 'text/plain; charset=utf-8');
      if (request.method === 'GET' && path === '/') return redirect('/zh/projects/');
      const match = path.match(/^\/(zh|en|ja|fr)\//);
      const lang = match?.[1] || 'zh';
      const glossaryMatch = match && path.match(new RegExp(`^/${lang}/projects/(${ID})/glossary/$`));
      if (match && (path === `/${lang}/admin/` || path.startsWith(`/${lang}/admin/projects/`) || path.startsWith(`/${lang}/admin/images/`))) {
        return response('Not found', 404, 'text/plain; charset=utf-8');
      }
      const session = await sessionFromRequest(request, env.DB);
      if (path === `/${lang}/login/`) {
        const next = safeNext(request.method === 'GET' ? requestUrl.searchParams.get('next') : null, lang);
        if (request.method === 'GET') {
          if (session) return redirect(next);
          const csrf = formToken(request);
          return response(loginPage(lang, next, csrf.token), 200, 'text/html; charset=utf-8', csrf.cookie);
        }
        if (request.method !== 'POST') return response('Method not allowed', 405, 'text/plain; charset=utf-8');
        const csrf = formToken(request);
        let form;
        try { form = await anonymousForm(request); } catch (error) {
          console.warn('login form rejected:', error.message);
          return response(loginPage(lang, next, csrf.token, copy[lang].csrf), 400, 'text/html; charset=utf-8', csrf.cookie);
        }
        const target = safeNext(form.get('next'), lang);
        if (!validFormToken(request, form.get('csrf'))) {
          console.warn('login form rejected: csrf');
          return response(loginPage(lang, target, csrf.token, copy[lang].csrf), 403, 'text/html; charset=utf-8', csrf.cookie);
        }
        const email = normalizeEmail(form.get('email'));
        const password = String(form.get('password') || '');
        if (!email || !password || password.length > 1024) return response(loginPage(lang, target, csrf.token, copy[lang].auth.failed), 401);
        if (await rateLimited(env.DB, request, email)) return response(loginPage(lang, target, csrf.token, copy[lang].auth.limited), 429);
        const account = await env.DB.prepare('SELECT * FROM accounts WHERE email = ? AND enabled = 1').bind(email).first();
        if (!await verifyPassword(password, account)) return response(loginPage(lang, target, csrf.token, copy[lang].auth.failed), 401);
        await clearLoginAttempts(env.DB, email);
        const { cookie } = await createSession(env.DB, account, request);
        return redirect(target, cookie);
      }
      if (path === `/${lang}/request-access/`) {
        const next = safeNext(request.method === 'GET' ? requestUrl.searchParams.get('next') : null, lang);
        const csrf = formToken(request);
        if (request.method === 'GET') return response(requestPage(lang, next, csrf.token), 200, 'text/html; charset=utf-8', csrf.cookie);
        if (request.method !== 'POST') return response('Method not allowed', 405, 'text/plain; charset=utf-8');
        let form;
        try { form = await anonymousForm(request); } catch (error) {
          console.warn('access request form rejected:', error.message);
          return response(requestPage(lang, next, csrf.token, copy[lang].csrf), 400, 'text/html; charset=utf-8', csrf.cookie);
        }
        const target = safeNext(form.get('next'), lang);
        if (!validFormToken(request, form.get('csrf'))) {
          console.warn('access request form rejected: csrf');
          return response(requestPage(lang, target, csrf.token, copy[lang].csrf), 403, 'text/html; charset=utf-8', csrf.cookie);
        }
        const email = normalizeEmail(form.get('email'));
        const reason = String(form.get('reason') || '').trim();
        if (!email || !reason || [...reason].length > 1000) return response(requestPage(lang, target, csrf.token, requestsCopy[lang].invalid), 400);
        if (!await requestLimited(env.DB, request, email)) {
          await env.DB.prepare("INSERT OR IGNORE INTO access_requests (id, email, reason, target_path, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").bind(crypto.randomUUID(), email, reason, target, Math.floor(Date.now() / 1000)).run();
        }
        return response(requestPage(lang, target, csrf.token, '', true), 200, 'text/html; charset=utf-8', csrf.cookie);
      }
      if (path === `/${lang}/logout/` && request.method === 'POST') {
        if (!session) return redirect(`${publicOrigin}/${lang}/about/`, expiredCookie(request));
        let form;
        try { form = await anonymousForm(request); } catch { return response('Bad request', 400, 'text/plain; charset=utf-8'); }
        if (!validCsrf(session, form.get('csrf'))) return message(lang, copy[lang].csrf, 403, session.csrf_token);
        await revokeSession(env.DB, session);
        return redirect(`${publicOrigin}/${lang}/about/`, expiredCookie(request));
      }
      if (!session) {
        if (glossaryMatch) return response('{"error":"unauthorized"}', 401, 'application/json; charset=utf-8');
        const next = safeNext(path + requestUrl.search, lang);
        return redirect(`/${lang}/login/?next=${encodeURIComponent(next)}`);
      }
      const admin = isAdmin(session);
      if (request.method === 'GET' && glossaryMatch) {
        const rows = await env.DB.prepare('SELECT p.status, g.key, g.translations FROM projects p LEFT JOIN project_glossary_terms pg ON pg.project_id = p.id LEFT JOIN glossary_terms g ON g.key = pg.term_key WHERE p.id = ? ORDER BY g.key').bind(glossaryMatch[1]).all();
        if (!rows.results.length || (rows.results[0].status !== 'published' && !admin)) return response('{"error":"not_found"}', 404, 'application/json; charset=utf-8');
        const terms = rows.results.filter(row => row.key).map(row => {
          const translated = JSON.parse(row.translations)[lang];
          return { key: row.key, text: translated.text, definition: translated.definition };
        });
        return response(JSON.stringify({ terms }), 200, 'application/json; charset=utf-8');
      }
      if (request.method === 'GET' && path.startsWith('/media/')) {
        const id = path.slice('/media/'.length);
        if (!isUuid(id)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const image = await env.DB.prepare('SELECT m.*, p.status FROM media m JOIN projects p ON p.id = m.project_id WHERE m.id = ?').bind(id).first();
        if (!image || (image.status !== 'published' && !admin)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const object = await env.MEDIA.get(image.object_key);
        return object ? response(object.body, 200, image.content_type) : response('Not found', 404, 'text/plain; charset=utf-8');
      }
      if (request.method === 'GET' && path.startsWith('/files/')) {
        const id = path.slice('/files/'.length);
        if (!isUuid(id)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const file = await env.DB.prepare('SELECT f.*, p.status FROM project_files f JOIN projects p ON p.id = f.project_id WHERE f.id = ?').bind(id).first();
        if (!file || (file.status !== 'published' && !admin)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const object = await env.MEDIA.get(file.object_key);
        if (!object) return response('Not found', 404, 'text/plain; charset=utf-8');
        const name = file.download_name.replace(/[^A-Za-z0-9._-]/g, '_');
        return new Response(object.body, { status: 200, headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Content-Length': String(file.byte_size) } });
      }
      if (!match) return response('Not found', 404, 'text/plain; charset=utf-8');
      if (request.method === 'GET') return handleGet(env, lang, path, admin, session.csrf_token, requestUrl.searchParams.get('from'));
      if (request.method === 'POST') {
        const accountAction = new RegExp(`^/${lang}/admin/accounts/${ID}/(reset|disable|enable)/$`);
        const requestAction = new RegExp(`^/${lang}/admin/requests/${ID}/(approve|dismiss)/$`);
        if (path !== `/${lang}/admin/accounts/` && !accountAction.test(path) && !requestAction.test(path)) return message(lang, copy[lang].notFound, 404);
        if (!admin) return message(lang, copy[lang].adminOnly, 403);
        let form;
        try { form = await anonymousForm(request); } catch { return message(lang, copy[lang].invalid, 400); }
        if (!validCsrf(session, form.get('csrf'))) return message(lang, copy[lang].csrf, 403);
        return handlePost(env, lang, path, form, session.csrf_token);
      }
      return response('Method not allowed', 405, 'text/plain; charset=utf-8');
    } catch (error) {
      console.error(error);
      return response('Server error', 500, 'text/plain; charset=utf-8');
    }
  },
};
