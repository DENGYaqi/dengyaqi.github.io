import { validCsrf } from './auth.js';
import { now, publicOrigin, uuidPattern } from './runtime-shared.js';
import { issueLocalTicket } from './local-ticket.js';
import { localCopy } from './local-launch-copy.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const localEnabled = (env, session) => env.LOCAL_LAUNCH_ENABLED === 'true' && session?.role === 'admin';
export function localCatalog(env) {
  try {
    let catalog = JSON.parse(env.LOCAL_LAUNCH_CATALOG || '{}');
    if (catalog?.parts !== undefined) {
      if (Object.keys(catalog).length !== 1 || !Number.isInteger(catalog.parts) || catalog.parts < 1 || catalog.parts > 16) return {};
      const merged = {};
      for (let index=1;index<=catalog.parts;index++) {
        const part = JSON.parse(env[`LOCAL_LAUNCH_CATALOG_${index}`]);
        if (!part || Array.isArray(part) || typeof part !== 'object') return {};
        for (const [id,item] of Object.entries(part)) { if (Object.hasOwn(merged,id)) return {}; merged[id]=item; }
      }
      catalog = merged;
    }
    if (!catalog || Array.isArray(catalog) || typeof catalog !== 'object') return {};
    for (const [id,item] of Object.entries(catalog)) {
      if (!uuidPattern.test(id) || !item || !['web','desktop','android','sample','document','unavailable'].includes(item.kind) || (item.file_id && !uuidPattern.test(item.file_id)) || !item.note || !['zh','en','ja','fr'].every(lang => typeof item.note[lang] === 'string' && item.note[lang].length <= 600)) return {};
    }
    return catalog;
  } catch { return {}; }
}
export function localProjectEnabled(env, id) {
  try {
    const ids = JSON.parse(env.LOCAL_LAUNCH_PROJECT_IDS || '[]');
    const item = localCatalog(env)[id];
    return Array.isArray(ids) && ids.every(value => typeof value === 'string' && uuidPattern.test(value)) && ids.includes(id) && (!env.LOCAL_LAUNCH_CATALOG || !!item) && !['unavailable','document'].includes(item?.kind);
  } catch { return false; }
}
export function localLaunchPanel(id, session, lang, env) {
  const base = localCopy[lang], item = localCatalog(env)[id];
  const c = { ...base, start:base.kinds[item?.kind] || base.start, intro:item ? escape(item.note[lang]) : base.intro };
  if (item?.kind === 'document' && item.file_id) return `<section class="launch-panel"><h3>${base.kinds.document}</h3><p>${c.intro}</p><a href="/files/${item.file_id}">${base.kinds.document} ↗</a></section>`;
  if (!localProjectEnabled(env, id)) return `<section class="launch-panel"><h3>${c.title}</h3><p>${item ? c.intro : c.not_configured}</p></section>`;
  return `<section class="launch-panel" data-local-launch="/api/projects/${id}/local-launch" data-working="${c.working}" data-sent="${c.sent}" data-error="${c.error}" data-expired="${c.expired}"><h3>${c.title}</h3><p>${c.intro}</p><form method="post" action="/api/projects/${id}/local-launch"><input type="hidden" name="csrf" value="${escape(session.csrf_token)}"><input type="hidden" name="lang" value="${lang}"><button type="submit">${c.start} ↗</button></form><p role="status" aria-live="polite"></p><p><a data-local-retry hidden>${c.retry}</a></p><p><a href="/${lang}/local-launch/setup/">${c.setup}</a></p><p class="muted" data-local-help hidden>${c.help}</p></section>`;
}
export async function handleLocalLaunch(request, env, session, ui) {
  const url = new URL(request.url), setup = url.pathname.match(/^\/(zh|en|ja|fr)\/local-launch\/setup\/$/), launch = url.pathname.match(/^\/api\/projects\/([^/]+)\/local-launch$/);
  if (!setup && !launch) return null;
  const json = (data, status = 200) => ui.response(JSON.stringify(data), status, 'application/json; charset=utf-8');
  if (!session) return json({ error: 'unauthorized' }, 401);
  if (session.role !== 'admin') return json({ error: 'forbidden' }, 403);
  if (setup) {
    if (request.method !== 'GET') return json({ error: 'method' }, 405);
    const lang = setup[1], c = localCopy[lang];
    return ui.response(ui.page(lang, c.setup, `<section class="launch-panel"><h1>${c.setup}</h1><p>${c.instructions}</p><ol>${c.setupSteps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><p>${c.privacy}</p><p><a href="/${lang}/projects/">← ${c.back}</a></p></section>`, true, url.pathname, session.csrf_token));
  }
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!uuidPattern.test(launch[1])) return json({ error: 'invalid' }, 400);
  if (!localEnabled(env, session) || !env.LOCAL_LAUNCH_PRIVATE_KEY || !publicOrigin(env.LOCAL_LAUNCH_ISSUER)) return json({ error: 'unavailable' }, 503);
  let form;
  try { form = await ui.anonymousForm(request); } catch { return json({ error: 'invalid' }, 400); }
  if (!validCsrf(session, form.get('csrf')) || request.headers.get('Origin') !== url.origin) return json({ error: 'csrf' }, 403);
  const lang = form.get('lang') || 'zh';
  if (!localCopy[lang]) return json({ error: 'invalid' }, 400);
  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ? AND status = 'published'").bind(launch[1]).first();
  if (!project) return json({ error: 'not_found' }, 404);
  if (!localProjectEnabled(env, project.id)) return json({ error: 'not_configured' }, 409);
  const timestamp = now(), key = `local-launch:${session.id}`;
  await env.DB.prepare('INSERT INTO login_attempts (key,hits,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window_start <= ? THEN 1 ELSE hits+1 END, window_start=CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END').bind(key, timestamp, timestamp - 60, timestamp - 60).run();
  if ((await env.DB.prepare('SELECT hits FROM login_attempts WHERE key = ?').bind(key).first()).hits > 10) return json({ error: 'rate_limited' }, 429);
  let ticket;
  try { ticket = await issueLocalTicket(JSON.parse(env.LOCAL_LAUNCH_PRIVATE_KEY), project.id, lang, env.LOCAL_LAUNCH_ISSUER, timestamp); }
  catch { return json({ error: 'unavailable' }, 503); }
  return json({ uri: `yaqi-local://launch?ticket=${ticket}`, expires_at: timestamp + 60 });
}
