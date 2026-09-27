import experiences from './experiences.json' with { type: 'json' };
import { copy, languages } from './i18n.js';
import style from './style.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
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
export const isAdmin = (identity, env) => Boolean(identity?.email && env.ADMIN_EMAIL && identity.email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase());

function response(body, status = 200, contentType = 'text/html; charset=utf-8') {
  return new Response(body, { status, headers: { ...headers, 'Content-Type': contentType } });
}
function redirect(path) {
  return new Response(null, { status: 303, headers: { ...headers, Location: path } });
}
function message(lang, text, status = 400) {
  return response(page(lang, text, `<div class="notice error">${escapeHtml(text)}</div><p><a href="/${lang}/projects/">${copy[lang].allProjects}</a></p>`), status);
}
function page(lang, title, body, admin = false, path = `/${lang}/projects/`) {
  const c = copy[lang];
  const langs = languages.map(code => `<a href="${url(path.replace(/^\/(zh|en|ja|fr)\//, `/${code}/`))}" lang="${code}"${code === lang ? ' class="active" aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} · ${c.site}</title><link rel="stylesheet" href="/style.css"></head><body><header><strong>${c.site}<span class="dot">.</span></strong><nav aria-label="${c.projects}"><a href="/${lang}/projects/">${c.projects}</a><a href="/${lang}/experiences/">${c.experiences}</a>${admin ? `<a href="/${lang}/admin/">${c.admin}</a>` : ''}<a href="${publicOrigin}/${lang}/about/">${c.back}</a><a href="/cdn-cgi/access/logout">${c.logout}</a></nav><div class="language" aria-label="${c.switchLanguage}">${langs}</div></header><main>${body}</main><footer>${c.site} · ${c.projects}</footer></body></html>`;
}
function projectFromRow(row) {
  return { ...row, translations: JSON.parse(row.translations), experience_keys: JSON.parse(row.experience_keys) };
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
  return Boolean(item.experience_keys?.length && languages.every(lang => {
    const value = tr(item, lang);
    return value.title?.trim() && value.summary?.trim() && value.body?.trim();
  }));
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
  return page(lang, isNew ? c.new : titleOf(item, lang), `<p class="eyebrow">${c.admin}</p><h1>${isNew ? c.new : escapeHtml(titleOf(item, lang))}</h1>${note ? `<div class="notice ${note === c.required || note === c.invalid ? 'error' : ''}">${escapeHtml(note)}</div>` : ''}${form}${controls}`, true, path);
}

function bytesToBase64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function mac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}
export async function csrfToken(secret, email, now = Date.now()) {
  if (!secret) throw new Error('CSRF_SECRET is missing');
  const timestamp = Math.floor(now / 1000);
  return `${timestamp}.${await mac(secret, `${email.toLowerCase()}:${timestamp}`)}`;
}
export async function validCsrf(secret, email, token, now = Date.now()) {
  if (!secret || !email || typeof token !== 'string') return false;
  const match = token.match(/^(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!match) return false;
  const age = Math.floor(now / 1000) - Number(match[1]);
  if (age < 0 || age > 7200) return false;
  const expected = await mac(secret, `${email.toLowerCase()}:${match[1]}`);
  const a = new TextEncoder().encode(match[2]), b = new TextEncoder().encode(expected);
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

export function detectImage(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

async function handlePost(env, lang, path, form, token) {
  const c = copy[lang], base = `/${lang}/admin/`;
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
  if (path === `/${lang}/projects/`) {
    const items = await projects(env.DB);
    return response(page(lang, c.projects, `<p class="eyebrow">${c.projects}</p><h1>${c.projects}</h1>${cards(items, lang, await coverMap(env.DB, items))}`, admin, path));
  }
  if (path === `/${lang}/experiences/`) {
    return response(page(lang, c.experiences, `<p class="eyebrow">${c.experiences}</p><h1>${c.experiences}</h1><div class="grid">${experiences.map(item => `<a class="card" href="/${lang}/experiences/${url(item.key)}/"><h3>${escapeHtml(experienceName(item, lang))}</h3><p>${escapeHtml(item.company[lang] || item.company.zh)}</p></a>`).join('')}</div>`, admin, path));
  }
  const expMatch = path.match(new RegExp(`^/${lang}/experiences/([a-z0-9_]+)/$`));
  if (expMatch) {
    const exp = experience(expMatch[1]);
    if (!exp) return message(lang, c.notFound, 404);
    const items = (await projects(env.DB)).filter(item => item.experience_keys.includes(exp.key));
    return response(page(lang, experienceName(exp, lang), `<p class="eyebrow">${c.experiences}</p><h1>${escapeHtml(experienceName(exp, lang))}</h1><p class="lead">${escapeHtml(exp.company[lang] || exp.company.zh)} · ${escapeHtml(typeof exp.date === 'object' ? exp.date[lang] || exp.date.zh : exp.date)}</p><p class="lead">${escapeHtml(exp.summary[lang] || exp.summary.zh)}</p><h2>${c.projects}</h2>${items.length ? cards(items, lang, await coverMap(env.DB, items)) : `<p class="muted">${c.experienceEmpty}</p>`}`, admin, path));
  }
  const detail = path.match(new RegExp(`^/${lang}/projects/(${ID})/$`));
  if (detail) {
    const item = await project(env.DB, detail[1]);
    if (!item || (item.status !== 'published' && !admin)) return message(lang, c.notFound, 404);
    const photos = await images(env.DB, item.id), t = tr(item, lang);
    const linked = item.experience_keys.map(key => experience(key)).filter(Boolean).map(exp => `<a class="tag" href="/${lang}/experiences/${url(exp.key)}/">${escapeHtml(experienceName(exp, lang))}</a>`).join('');
    const gallery = photos.length ? `<h2>${c.photos}</h2><div class="gallery">${photos.map(photo => `<a href="/media/${url(photo.id)}"><img src="/media/${url(photo.id)}" alt="${escapeHtml(t.title)}" loading="lazy"></a>`).join('')}</div>` : '';
    return response(page(lang, t.title || c.noTitle, `<p class="eyebrow">${c.projects}${item.status === 'draft' ? ` · ${c.draft}` : ''}</p><h1>${escapeHtml(t.title || c.noTitle)}</h1><p class="lead">${escapeHtml(t.summary)}</p><div>${linked}</div><section class="prose">${prettyBody(t.body)}</section>${gallery}${admin ? `<p><a class="button secondary" href="/${lang}/admin/projects/${item.id}/edit/">${c.edit}</a></p>` : ''}`, admin, path));
  }
  if (path.startsWith(`/${lang}/admin/`)) {
    if (!admin) return message(lang, c.adminOnly, 403);
    if (path === `/${lang}/admin/`) {
      const items = await projects(env.DB, true);
      return response(page(lang, c.admin, `<p class="eyebrow">${c.admin}</p><h1>${c.admin}</h1>${noticeFrom(requestUrl, lang)}<p><a class="button" href="/${lang}/admin/projects/new/">${c.new}</a></p><div class="panel">${items.length ? items.map(item => `<div class="admin-item"><div><strong>${escapeHtml(titleOf(item, lang))}</strong> <span class="tag">${item.status === 'published' ? c.published : c.draft}</span></div><a class="button secondary" href="/${lang}/admin/projects/${item.id}/edit/">${c.edit}</a></div>`).join('') : `<p>${c.noProjects}</p>`}</div>`, true, path));
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
      const identity = ctx.access && await ctx.access.getIdentity();
      if (!identity?.email) return response('Access required', 403, 'text/plain; charset=utf-8');
      const admin = isAdmin(identity, env), requestUrl = new URL(request.url), path = requestUrl.pathname;
      if (request.method === 'GET' && path === '/style.css') return response(style, 200, 'text/css; charset=utf-8');
      if (request.method === 'GET' && path === '/') return redirect('/zh/projects/');
      if (request.method === 'GET' && path === '/robots.txt') return response('User-agent: *\nDisallow: /\n', 200, 'text/plain; charset=utf-8');
      if (request.method === 'GET' && path.startsWith('/media/')) {
        const id = path.slice('/media/'.length);
        if (!isUuid(id)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const image = await env.DB.prepare('SELECT m.*, p.status FROM media m JOIN projects p ON p.id = m.project_id WHERE m.id = ?').bind(id).first();
        if (!image || (image.status !== 'published' && !admin)) return response('Not found', 404, 'text/plain; charset=utf-8');
        const object = await env.MEDIA.get(image.object_key);
        return object ? response(object.body, 200, image.content_type) : response('Not found', 404, 'text/plain; charset=utf-8');
      }
      const match = path.match(/^\/(zh|en|ja|fr)\//);
      if (!match) return response('Not found', 404, 'text/plain; charset=utf-8');
      const lang = match[1];
      if (request.method === 'GET') return handleGet(env, lang, path, admin, await csrfToken(env.CSRF_SECRET, identity.email), requestUrl);
      if (request.method === 'POST') {
        if (!admin) return message(lang, copy[lang].adminOnly, 403);
        const origin = request.headers.get('Origin');
        if (origin && origin !== requestUrl.origin) return message(lang, copy[lang].csrf, 403);
        const length = Number(request.headers.get('Content-Length') || 0);
        if (length > MAX_IMAGE_BYTES + 100000) return message(lang, copy[lang].invalid, 413);
        const form = await request.formData();
        if (!await validCsrf(env.CSRF_SECRET, identity.email, form.get('csrf'))) return message(lang, copy[lang].csrf, 403);
        return handlePost(env, lang, path, form, await csrfToken(env.CSRF_SECRET, identity.email));
      }
      return response('Method not allowed', 405, 'text/plain; charset=utf-8');
    } catch (error) {
      console.error(error);
      return response('Server error', 500, 'text/plain; charset=utf-8');
    }
  },
};
