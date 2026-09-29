import experiences from './experiences.json' with { type: 'json' };
import { copy, languages } from './i18n.js';
import style from './style.js';
import { clearLoginAttempts, createSession, expiredCookie, formToken, hashPassword, newPassword, normalizeEmail, rateLimited, revokeSession, safeNext, sessionFromRequest, validCsrf, validFormToken, verifyPassword } from './auth.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_ANONYMOUS_FORM_BYTES = 16 * 1024;
const ID = '[0-9a-f-]{36}';
const publicOrigin = 'https://dengyaqi.github.io';
const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
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
function message(lang, text, status = 400) {
  return response(page(lang, text, `<div class="notice error">${escapeHtml(text)}</div><p><a href="/${lang}/projects/">${copy[lang].allProjects}</a></p>`), status);
}
function page(lang, title, body, admin = false, path = `/${lang}/projects/`, token = '') {
  const c = copy[lang];
  const langs = languages.map(code => `<a href="${url(path.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}" lang="${code}"${code === lang ? ' class="active" aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body><header><strong>${c.site}<span class="dot">.</span></strong><nav aria-label="${c.projects}"><a href="/${lang}/projects/">${c.projects}</a><a href="/${lang}/experiences/">${c.experiences}</a><a href="/${lang}/projects/education/">${c.education}</a>${admin ? `<a href="/${lang}/admin/">${c.admin}</a><a href="/${lang}/admin/accounts/">${c.auth.accounts}</a><a href="/${lang}/admin/requests/">${requestsCopy[lang].adminTitle}</a>` : ''}<a href="${publicOrigin}/${lang}/about/">${c.back}</a><form method="post" action="/${lang}/logout/">${token ? hiddenCsrf(token) : ''}<button class="nav-logout" type="submit">${c.logout}</button></form></nav><div class="language" aria-label="${c.switchLanguage}">${langs}</div></header><main>${body}</main><footer>${c.site} · ${c.projects}</footer></body></html>`;
}

const requestsCopy = {
  zh: { link: '申请查看', title: '申请查看项目', intro: '留下邮箱和申请理由。审核后，我会自行通过邮件发送账号和密码。', reason: '申请理由', send: '提交申请', received: '申请已收到。审核后会通过邮件联系你。', backLogin: '返回登录', invalid: '请填写有效邮箱及 1–1000 字的申请理由。', adminTitle: '查看申请', pending: '待处理', approved: '已批准', dismissed: '未通过', approve: '批准并生成密码', dismiss: '标记不通过', empty: '暂无申请。', source: '申请来源', when: '申请时间' },
  en: { link: 'Request access', title: 'Request project access', intro: 'Leave your email and reason. If approved, I will email your account and password myself.', reason: 'Reason for requesting access', send: 'Send request', received: 'Request received. I will contact you by email after review.', backLogin: 'Back to sign in', invalid: 'Enter a valid email and a reason of 1–1000 characters.', adminTitle: 'Access requests', pending: 'Pending', approved: 'Approved', dismissed: 'Declined', approve: 'Approve and generate password', dismiss: 'Decline', empty: 'No requests yet.', source: 'Requested page', when: 'Requested at' },
  ja: { link: '閲覧を申請', title: 'プロジェクトの閲覧申請', intro: 'メールアドレスと申請理由を入力してください。承認後、アカウントとパスワードをメールでお送りします。', reason: '申請理由', send: '申請する', received: '申請を受け付けました。審査後にメールでご連絡します。', backLogin: 'ログインに戻る', invalid: '有効なメールアドレスと1～1000文字の理由を入力してください。', adminTitle: '閲覧申請', pending: '審査中', approved: '承認済み', dismissed: '却下', approve: '承認してパスワードを発行', dismiss: '却下する', empty: '申請はありません。', source: '申請元', when: '申請日時' },
  fr: { link: 'Demander l’accès', title: 'Demander l’accès aux projets', intro: 'Indiquez votre e-mail et votre motif. Après validation, je vous enverrai moi-même vos identifiants.', reason: 'Motif de la demande', send: 'Envoyer la demande', received: 'Demande reçue. Je vous contacterai par e-mail après examen.', backLogin: 'Retour à la connexion', invalid: 'Saisissez un e-mail valide et un motif de 1 à 1000 caractères.', adminTitle: 'Demandes d’accès', pending: 'En attente', approved: 'Approuvée', dismissed: 'Refusée', approve: 'Approuver et créer un mot de passe', dismiss: 'Refuser', empty: 'Aucune demande.', source: 'Page demandée', when: 'Date de demande' },
};

function loginPage(lang, next, csrf, error = '') {
  const c = copy[lang], a = c.auth;
  const languagesNav = languages.map(code => `<a href="/${code}/login/?next=${encodeURIComponent(next.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}"${code === lang ? ' class="active"' : ''}>${code.toUpperCase()}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${a.title} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body class="login-page"><header><strong>${c.site}<span class="dot">.</span></strong><div class="language">${languagesNav}</div></header><main><div class="login-panel"><p class="eyebrow">${c.projects}</p><h1>${a.title}</h1><p class="muted">${a.intro}</p>${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}<form method="post" action="/${lang}/login/"><input type="hidden" name="next" value="${url(next)}">${hiddenCsrf(csrf)}<div class="field"><label for="email">${a.email}</label><input id="email" name="email" type="email" autocomplete="username" maxlength="254" required></div><div class="field"><label for="password">${a.password}</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><button type="submit">${a.submit}</button></form><p><a href="/${lang}/request-access/?next=${encodeURIComponent(next)}">${requestsCopy[lang].link}</a></p><p><a href="${publicOrigin}/${lang}/about/">← ${c.back}</a></p></div></main></body></html>`;
}

function requestPage(lang, next, csrf, error = '', done = false) {
  const c = copy[lang], a = requestsCopy[lang];
  const languagesNav = languages.map(code => `<a href="/${code}/request-access/?next=${encodeURIComponent(next.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}"${code === lang ? ' class="active"' : ''}>${code.toUpperCase()}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${a.title} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body class="login-page"><header><strong>${c.site}<span class="dot">.</span></strong><div class="language">${languagesNav}</div></header><main><div class="login-panel"><p class="eyebrow">${c.projects}</p><h1>${a.title}</h1><p class="muted">${a.intro}</p>${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}${done ? `<div class="notice" role="status">${a.received}</div>` : `<form method="post" action="/${lang}/request-access/"><input type="hidden" name="next" value="${url(next)}">${hiddenCsrf(csrf)}<div class="field"><label for="email">${c.auth.email}</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="field"><label for="reason">${a.reason}</label><textarea id="reason" name="reason" maxlength="1000" required></textarea></div><button type="submit">${a.send}</button></form>`}<p><a href="/${lang}/login/?next=${encodeURIComponent(next)}">← ${a.backLogin}</a></p><p><a href="${publicOrigin}/${lang}/about/">← ${c.back}</a></p></div></main></body></html>`;
}
function projectFromRow(row) {
  return { ...row, translations: JSON.parse(row.translations), experience_keys: JSON.parse(row.experience_keys), education_keys: JSON.parse(row.education_keys ?? '[]') };
}
async function educations(db) {
  const rows = await db.prepare('SELECT * FROM educations ORDER BY sort_order, key').all();
  return rows.results.map(row => ({ ...row, translations: JSON.parse(row.translations) }));
}
async function projects(db, includeDrafts = false) {
  const query = includeDrafts ? 'SELECT * FROM projects ORDER BY sort_order, created_at DESC' : "SELECT * FROM projects WHERE status = 'published' ORDER BY sort_order, created_at DESC";
  const rows = await db.prepare(query).all();
  return rows.results.map(projectFromRow);
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
function experience(key) { return experiences.find(item => item.key === key); }
function experienceName(item, lang) { return item.title[lang] || item.title.zh; }
function educationName(item, lang) { return item.translations[lang]?.school || item.translations.zh?.school || item.key; }
function cards(items, lang, covers = new Map()) {
  const c = copy[lang];
  if (!items.length) return `<p class="muted">${c.empty}</p>`;
  return `<div class="grid">${items.map(item => `<a class="card" href="/${lang}/projects/${url(item.id)}/">${covers.get(item.id) ? `<img src="/media/${url(covers.get(item.id))}" alt="${escapeHtml(titleOf(item, lang))}">` : ''}<div class="eyebrow">${c.open}</div><h3>${escapeHtml(titleOf(item, lang))}</h3><p>${escapeHtml(tr(item, lang).summary)}</p></a>`).join('')}</div>`;
}
async function coverMap(db, items) {
  const map = new Map();
  for (const item of items) {
    const image = await db.prepare('SELECT id FROM media WHERE project_id = ? ORDER BY sort_order, created_at LIMIT 1').bind(item.id).first();
    if (image) map.set(item.id, image.id);
  }
  return map;
}
function noticeFrom(urlObject, lang) {
  const key = urlObject.searchParams.get('notice');
  return Object.hasOwn(copy[lang], key) ? `<div class="notice" role="status">${escapeHtml(copy[lang][key])}</div>` : '';
}
function prettyBody(text) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean).map(part => `<p>${escapeHtml(part)}</p>`).join('');
}

export function validatePublish(item) {
  return Boolean((item.experience_keys?.length || item.education_keys?.length) && languages.every(lang => {
    const value = tr(item, lang);
    return value.title?.trim() && value.summary?.trim() && value.body?.trim();
  }));
}
async function overview(db, lang, focus = {}) {
  const c = copy[lang], items = await projects(db), schools = await educations(db), covers = await coverMap(db, items);
  if (focus.work && !experience(focus.work)) return null;
  if (focus.school && !schools.some(item => item.key === focus.school)) return null;
  const work = [...experiences].sort((a, b) => Number(b.key === focus.work) - Number(a.key === focus.work));
  const education = [...schools].sort((a, b) => Number(b.key === focus.school) - Number(a.key === focus.school));
  const workSection = `<section id="work"><h2>${c.experiences}</h2>${work.map(exp => `<article class="panel overview-entry${exp.key === focus.work ? ' focused' : ''}"><h3><a href="/${lang}/projects/work/${url(exp.key)}/">${escapeHtml(experienceName(exp, lang))}</a></h3><p class="muted">${escapeHtml(exp.company[lang] || exp.company.zh)} · ${escapeHtml(typeof exp.date === 'object' ? exp.date[lang] || exp.date.zh : exp.date)}</p><p>${escapeHtml(exp.summary[lang] || exp.summary.zh)}</p>${cards(items.filter(item => item.experience_keys.includes(exp.key)), lang, covers)}</article>`).join('')}</section>`;
  const educationSection = `<section id="education"><h2>${c.education}</h2>${education.length ? education.map(item => { const details = item.translations[lang] || item.translations.zh || {}; return `<article class="panel overview-entry${item.key === focus.school ? ' focused' : ''}"><h3><a href="/${lang}/projects/education/${url(item.key)}/">${escapeHtml(educationName(item, lang))}</a></h3><p class="muted">${escapeHtml(details.degree)}${details.date ? ` · ${escapeHtml(details.date)}` : ''}</p><p>${escapeHtml(details.summary)}</p>${cards(items.filter(project => project.education_keys.includes(item.key)), lang, covers)}</article>`; }).join('') : `<p class="muted">${c.educationEmpty}</p>`}</section>`;
  return `<p class="eyebrow">${c.projects}</p><h1>${c.projects}</h1><nav class="section-links" aria-label="${c.projects}"><a href="#work">${c.experiences}</a><a href="#education">${c.education}</a></nav>${focus.school || focus.education ? educationSection + workSection : workSection + educationSection}`;
}

function parseProjectForm(form) {
  const keys = form.getAll('experience_key').map(String);
  const allowed = new Set(experiences.map(item => item.key));
  if (keys.some(key => !allowed.has(key))) throw new Error('invalid experience');
  const translations = {};
  for (const lang of languages) {
    const title = String(form.get(`${lang}_title`) || '').trim();
    const summary = String(form.get(`${lang}_summary`) || '').trim();
    const body = String(form.get(`${lang}_body`) || '').trim();
    if (title.length > 180 || summary.length > 700 || body.length > 20000) throw new Error('text too long');
    translations[lang] = { title, summary, body };
  }
  const order = Number(form.get('sort_order') || 0);
  if (!Number.isSafeInteger(order) || order < -100000 || order > 100000) throw new Error('invalid order');
  return { translations, experience_keys: [...new Set(keys)], sort_order: order };
}

function editorFields(item, lang) {
  const c = copy[lang];
  return `<div class="field"><label for="sort_order">${c.order}</label><input id="sort_order" name="sort_order" type="number" min="-100000" max="100000" value="${escapeHtml(item.sort_order ?? 0)}"></div><fieldset><legend>${c.related}</legend>${experiences.map(exp => `<label class="check"><input type="checkbox" name="experience_key" value="${url(exp.key)}"${item.experience_keys?.includes(exp.key) ? ' checked' : ''}>${escapeHtml(experienceName(exp, lang))} · ${escapeHtml(exp.company[lang] || exp.company.zh)}</label>`).join('')}</fieldset>${languages.map(code => { const t = tr(item, code); return `<fieldset lang="${code}"><legend>${code.toUpperCase()}</legend><div class="field"><label for="${code}_title">${c.title}</label><input id="${code}_title" name="${code}_title" type="text" maxlength="180" value="${escapeHtml(t.title)}"></div><div class="field"><label for="${code}_summary">${c.summary}</label><textarea id="${code}_summary" name="${code}_summary" maxlength="700">${escapeHtml(t.summary)}</textarea></div><div class="field"><label for="${code}_body">${c.body}</label><textarea id="${code}_body" name="${code}_body" class="body" maxlength="20000">${escapeHtml(t.body)}</textarea></div></fieldset>`; }).join('')}`;
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
  return page(lang, a.adminTitle, `<p class="eyebrow">${c.admin}</p><h1>${a.adminTitle}</h1>${notice}<div class="panel">${list || `<p class="muted">${a.empty}</p>`}</div>`, true, `/${lang}/admin/requests/`, token);
}
async function accountsPage(db, lang, token, issuedPassword = '') {
  const c = copy[lang], a = c.auth;
  const rows = await db.prepare("SELECT id, email, enabled FROM accounts WHERE role = 'viewer' ORDER BY created_at DESC").all();
  const notice = issuedPassword ? `<div class="notice" role="status"><strong>${a.initialPassword}</strong><p><code>${escapeHtml(issuedPassword)}</code></p><p>${a.copyNow}</p></div>` : '';
  const list = rows.results.map(account => `<div class="admin-item"><div><strong>${escapeHtml(account.email)}</strong> <span class="tag">${account.enabled ? a.enabled : a.disabled}</span></div><div class="actions">${adminForm(`/${lang}/admin/accounts/${account.id}/reset/`, token, a.reset, 'secondary')}${adminForm(`/${lang}/admin/accounts/${account.id}/${account.enabled ? 'disable' : 'enable'}/`, token, account.enabled ? a.disable : a.enable, account.enabled ? 'danger' : 'secondary')}</div></div>`).join('');
  return page(lang, a.accounts, `<p class="eyebrow">${c.admin}</p><h1>${a.accounts}</h1>${notice}<form method="post" action="/${lang}/admin/accounts/" class="panel"><div class="field"><label for="email">${a.email}</label><input id="email" name="email" type="email" maxlength="254" required></div>${hiddenCsrf(token)}<button type="submit">${a.create}</button></form><div class="panel">${list || `<p class="muted">${a.noAccounts}</p>`}</div>`, true, `/${lang}/admin/accounts/`, token);
}
async function editor(db, item, lang, token, note = '') {
  const c = copy[lang], isNew = !item.id, path = isNew ? `/${lang}/admin/projects/new/` : `/${lang}/admin/projects/${item.id}/edit/`;
  const form = `<form method="post" action="/${lang}/admin/projects/${isNew ? '' : `${item.id}/save/`}">${hiddenCsrf(token)}${editorFields(item, lang)}<button type="submit">${c.save}</button></form>`;
  let controls = '';
  if (!isNew) {
    controls = `<div class="panel"><div class="actions">${item.status === 'published' ? adminForm(`/${lang}/admin/projects/${item.id}/unpublish/`, token, c.unpublish, 'secondary') : adminForm(`/${lang}/admin/projects/${item.id}/publish/`, token, c.publish)}<a class="button secondary" href="/${lang}/projects/${item.id}/">${c.view}</a></div>${!validatePublish(item) ? `<p class="muted">${c.required}</p>` : ''}</div>`;
    const photos = await images(db, item.id);
    controls += `<h2>${c.photos}</h2><div class="panel">${photos.length ? photos.map((photo, index) => `<div class="photo-admin"><img src="/media/${url(photo.id)}" alt="${escapeHtml(titleOf(item, lang))}"><span>${c.cover}${index + 1}</span><form method="post" action="/${lang}/admin/images/${photo.id}/order/">${hiddenCsrf(token)}<label for="order-${photo.id}">${c.imageOrder}</label><input id="order-${photo.id}" name="sort_order" type="number" min="-100000" max="100000" value="${photo.sort_order}" required><button type="submit">${c.save}</button></form>${adminForm(`/${lang}/admin/images/${photo.id}/delete/`, token, c.removePhoto, 'danger')}</div>`).join('') : `<p class="muted">${c.noImage}</p>`}<form method="post" action="/${lang}/admin/projects/${item.id}/images/" enctype="multipart/form-data">${hiddenCsrf(token)}<label class="field" for="image">${c.upload}</label><input id="image" type="file" name="image" accept="image/jpeg,image/png,image/webp" required> <button type="submit">${c.upload}</button></form></div>`;
    controls += `<details class="panel"><summary>${c.remove}</summary><p>${c.confirmRemove}</p>${adminForm(`/${lang}/admin/projects/${item.id}/delete/`, token, c.remove, 'danger')}</details>`;
  }
  return page(lang, isNew ? c.new : titleOf(item, lang), `<p class="eyebrow">${c.admin}</p><h1>${isNew ? c.new : escapeHtml(titleOf(item, lang))}</h1>${note ? `<div class="notice ${note === c.required || note === c.invalid ? 'error' : ''}">${escapeHtml(note)}</div>` : ''}${form}${controls}`, true, path, token);
}

export function detectImage(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
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
  if (path === `${base}projects/`) {
    let fields;
    try { fields = parseProjectForm(form); } catch { return message(lang, c.invalid); }
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO projects (id, status, sort_order, translations, experience_keys, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, 'draft', fields.sort_order, JSON.stringify(fields.translations), JSON.stringify(fields.experience_keys), now, now).run();
    return redirect(`${base}projects/${id}/edit/?notice=saved`);
  }
  const save = path.match(new RegExp(`^/${lang}/admin/projects/(${ID})/save/$`));
  if (save) {
    const item = await project(env.DB, save[1]);
    if (!item) return message(lang, c.notFound, 404);
    let fields;
    try { fields = parseProjectForm(form); } catch { return message(lang, c.invalid); }
    const next = { ...item, ...fields };
    // A published project must stay complete; withdraw it before removing any required field.
    if (item.status === 'published' && !validatePublish(next)) return response(await editor(env.DB, next, lang, token, c.required), 400);
    await env.DB.prepare('UPDATE projects SET sort_order = ?, translations = ?, experience_keys = ?, updated_at = ? WHERE id = ?').bind(fields.sort_order, JSON.stringify(fields.translations), JSON.stringify(fields.experience_keys), new Date().toISOString(), item.id).run();
    return redirect(`${base}projects/${item.id}/edit/?notice=saved`);
  }
  const action = path.match(new RegExp(`^/${lang}/admin/projects/(${ID})/(publish|unpublish|delete|images)/$`));
  if (action) {
    const item = await project(env.DB, action[1]);
    if (!item) return message(lang, c.notFound, 404);
    if (action[2] === 'publish') {
      if (!validatePublish(item)) return response(await editor(env.DB, item, lang, token, c.required), 400);
      await env.DB.prepare("UPDATE projects SET status = 'published', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), item.id).run();
      return redirect(`${base}projects/${item.id}/edit/?notice=live`);
    }
    if (action[2] === 'unpublish') {
      await env.DB.prepare("UPDATE projects SET status = 'draft', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), item.id).run();
      return redirect(`${base}projects/${item.id}/edit/?notice=hidden`);
    }
    if (action[2] === 'delete') {
      await env.DB.prepare("UPDATE projects SET status = 'draft' WHERE id = ?").bind(item.id).run();
      const photos = await images(env.DB, item.id);
      for (const photo of photos) await env.MEDIA.delete(photo.object_key);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM media WHERE project_id = ?').bind(item.id),
        env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(item.id),
      ]);
      return redirect(`${base}?notice=deleted`);
    }
    const file = form.get('image');
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES) return message(lang, c.invalid);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImage(bytes);
    if (!type) return message(lang, c.invalid);
    const id = crypto.randomUUID(), objectKey = `${item.id}/${id}`;
    const last = await env.DB.prepare('SELECT MAX(sort_order) AS value FROM media WHERE project_id = ?').bind(item.id).first();
    const sortOrder = (last?.value ?? 0) + 1;
    await env.MEDIA.put(objectKey, bytes, { httpMetadata: { contentType: type } });
    try {
      await env.DB.prepare('INSERT INTO media (id, project_id, object_key, content_type, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, item.id, objectKey, type, sortOrder, new Date().toISOString()).run();
    } catch (error) { await env.MEDIA.delete(objectKey); throw error; }
    return redirect(`${base}projects/${item.id}/edit/?notice=imageAdded`);
  }
  const imageAction = path.match(new RegExp(`^/${lang}/admin/images/(${ID})/(order|delete)/$`));
  if (imageAction) {
    const photo = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(imageAction[1]).first();
    if (!photo) return message(lang, c.notFound, 404);
    if (imageAction[2] === 'order') {
      const order = Number(form.get('sort_order'));
      if (!Number.isSafeInteger(order) || order < -100000 || order > 100000) return message(lang, c.invalid);
      await env.DB.prepare('UPDATE media SET sort_order = ? WHERE id = ?').bind(order, photo.id).run();
      return redirect(`${base}projects/${photo.project_id}/edit/?notice=imageOrdered`);
    }
    await env.MEDIA.delete(photo.object_key);
    await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(photo.id).run();
    return redirect(`${base}projects/${photo.project_id}/edit/?notice=imageRemoved`);
  }
  return message(lang, c.notFound, 404);
}

async function handleGet(env, lang, path, admin, token, requestUrl) {
  const c = copy[lang];
  const workFocus = path.match(new RegExp(`^/${lang}/projects/work/([a-z0-9_]+)/$`));
  const schoolFocus = path.match(new RegExp(`^/${lang}/projects/education/([a-z0-9_]+)/$`));
  if (path === `/${lang}/projects/` || path === `/${lang}/projects/education/` || workFocus || schoolFocus) {
    const body = await overview(env.DB, lang, { work: workFocus?.[1], school: schoolFocus?.[1], education: path === `/${lang}/projects/education/` });
    return body ? response(page(lang, c.projects, body, admin, path, token)) : message(lang, c.notFound, 404);
  }
  if (path === `/${lang}/experiences/`) {
    return response(page(lang, c.experiences, `<p class="eyebrow">${c.experiences}</p><h1>${c.experiences}</h1><div class="grid">${experiences.map(item => `<a class="card" href="/${lang}/experiences/${url(item.key)}/"><h3>${escapeHtml(experienceName(item, lang))}</h3><p>${escapeHtml(item.company[lang] || item.company.zh)}</p></a>`).join('')}</div>`, admin, path, token));
  }
  const expMatch = path.match(new RegExp(`^/${lang}/experiences/([a-z0-9_]+)/$`));
  if (expMatch) {
    const exp = experience(expMatch[1]);
    if (!exp) return message(lang, c.notFound, 404);
    const items = (await projects(env.DB)).filter(item => item.experience_keys.includes(exp.key));
    return response(page(lang, experienceName(exp, lang), `<p class="eyebrow">${c.experiences}</p><h1>${escapeHtml(experienceName(exp, lang))}</h1><p class="lead">${escapeHtml(exp.company[lang] || exp.company.zh)} · ${escapeHtml(typeof exp.date === 'object' ? exp.date[lang] || exp.date.zh : exp.date)}</p><p class="lead">${escapeHtml(exp.summary[lang] || exp.summary.zh)}</p><h2>${c.projects}</h2>${items.length ? cards(items, lang, await coverMap(env.DB, items)) : `<p class="muted">${c.experienceEmpty}</p>`}`, admin, path, token));
  }
  const detail = path.match(new RegExp(`^/${lang}/projects/(${ID})/$`));
  if (detail) {
    const item = await project(env.DB, detail[1]);
    if (!item || (item.status !== 'published' && !admin)) return message(lang, c.notFound, 404);
    const photos = await images(env.DB, item.id), t = tr(item, lang);
    const schools = await educations(env.DB);
    const linked = item.experience_keys.map(key => experience(key)).filter(Boolean).map(exp => `<a class="tag" href="/${lang}/projects/work/${url(exp.key)}/">${escapeHtml(experienceName(exp, lang))}</a>`).join('') + item.education_keys.map(key => schools.find(school => school.key === key)).filter(Boolean).map(school => `<a class="tag" href="/${lang}/projects/education/${url(school.key)}/">${escapeHtml(educationName(school, lang))}</a>`).join('');
    const gallery = photos.length ? `<h2>${c.photos}</h2><div class="gallery">${photos.map(photo => `<a href="/media/${url(photo.id)}"><img src="/media/${url(photo.id)}" alt="${escapeHtml(t.title)}" loading="lazy"></a>`).join('')}</div>` : '';
    return response(page(lang, t.title || c.noTitle, `<p class="eyebrow">${c.projects}${item.status === 'draft' ? ` · ${c.draft}` : ''}</p><h1>${escapeHtml(t.title || c.noTitle)}</h1><p class="lead">${escapeHtml(t.summary)}</p><div>${linked}</div><section class="prose">${prettyBody(t.body)}</section>${gallery}${admin ? `<p><a class="button secondary" href="/${lang}/admin/projects/${item.id}/edit/">${c.edit}</a></p>` : ''}`, admin, path, token));
  }
  if (path.startsWith(`/${lang}/admin/`)) {
    if (!admin) return message(lang, c.adminOnly, 403);
    if (path === `/${lang}/admin/requests/`) return response(await requestsPage(env.DB, lang, token));
    if (path === `/${lang}/admin/accounts/`) return response(await accountsPage(env.DB, lang, token));
    if (path === `/${lang}/admin/`) {
      const items = await projects(env.DB, true);
      return response(page(lang, c.admin, `<p class="eyebrow">${c.admin}</p><h1>${c.admin}</h1>${noticeFrom(requestUrl, lang)}<p><a class="button" href="/${lang}/admin/projects/new/">${c.new}</a></p><div class="panel">${items.length ? items.map(item => `<div class="admin-item"><div><strong>${escapeHtml(titleOf(item, lang))}</strong> <span class="tag">${item.status === 'published' ? c.published : c.draft}</span></div><a class="button secondary" href="/${lang}/admin/projects/${item.id}/edit/">${c.edit}</a></div>`).join('') : `<p>${c.noProjects}</p>`}</div>`, true, path, token));
    }
    if (path === `/${lang}/admin/projects/new/`) return response(await editor(env.DB, { translations: {}, experience_keys: [], sort_order: 0 }, lang, token));
    const edit = path.match(new RegExp(`^/${lang}/admin/projects/(${ID})/edit/$`));
    if (edit) {
      const item = await project(env.DB, edit[1]);
      if (!item) return message(lang, c.notFound, 404);
      return response(await editor(env.DB, item, lang, token, c[requestUrl.searchParams.get('notice')] || ''));
    }
  }
  return message(lang, c.notFound, 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const requestUrl = new URL(request.url), path = requestUrl.pathname;
      if (request.method === 'GET' && path === '/style.css') return response(style, 200, 'text/css; charset=utf-8');
      if (request.method === 'GET' && path === '/robots.txt') return response('User-agent: *\nDisallow: /\n', 200, 'text/plain; charset=utf-8');
      if (request.method === 'GET' && path === '/') return redirect('/zh/projects/');
      const match = path.match(/^\/(zh|en|ja|fr)\//);
      const lang = match?.[1] || 'zh';
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
        let form;
        try { form = await anonymousForm(request); } catch { return response('Bad request', 400, 'text/plain; charset=utf-8'); }
        if (!validCsrf(session, form.get('csrf'))) return message(lang, copy[lang].csrf, 403);
        await revokeSession(env.DB, session);
        return redirect(`${publicOrigin}/${lang}/about/`, expiredCookie(request));
      }
      if (!session) {
        const next = safeNext(path, lang);
        return redirect(`/${lang}/login/?next=${encodeURIComponent(next)}`);
      }
      const admin = isAdmin(session);
      if (request.method === 'GET' && path.startsWith('/media/')) {
        const id = path.slice('/media/'.length);
        if (!isUuid(id)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const image = await env.DB.prepare('SELECT m.*, p.status FROM media m JOIN projects p ON p.id = m.project_id WHERE m.id = ?').bind(id).first();
        if (!image || (image.status !== 'published' && !admin)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const object = await env.MEDIA.get(image.object_key);
        return object ? response(object.body, 200, image.content_type) : response('Not found', 404, 'text/plain; charset=utf-8');
      }
      if (!match) return response('Not found', 404, 'text/plain; charset=utf-8');
      if (request.method === 'GET') return handleGet(env, lang, path, admin, session.csrf_token, requestUrl);
      if (request.method === 'POST') {
        if (!admin) return message(lang, copy[lang].adminOnly, 403);
        const length = Number(request.headers.get('Content-Length') || 0);
        if (length > MAX_IMAGE_BYTES + 100000) return message(lang, copy[lang].invalid, 413);
        const form = await request.formData();
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
