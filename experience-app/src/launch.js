import { validCsrf } from './auth.js';
import { launchCopy } from './launch-copy.js';
import { allowedRun, readyRun, boundedBody, changes, digest, now, publicOrigin, randomToken, tokenPattern, uuidPattern } from './runtime-shared.js';

const active = "('queued','starting','ready','stopping')";
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const csrfInput = session => `<input type="hidden" name="csrf" value="${escape(session.csrf_token)}">`;
const languageInput = lang => `<input type="hidden" name="lang" value="${lang}">`;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
const enabled = env => env.LAUNCH_ENABLED === 'true';

async function runtime(db, id, account) {
  return db.prepare(`SELECT p.*, a.enabled AS agent_enabled, a.last_seen, g.expires_at AS grant_expires
    FROM project_runtimes p JOIN projects j ON j.id = p.project_id AND j.status = 'published'
    JOIN runtime_agents a ON a.id = p.agent_id
    LEFT JOIN project_runtime_grants g ON g.project_id = p.project_id AND g.account_id = ?
    WHERE p.project_id = ?`).bind(account, id).first();
}
function availability(row) {
  if (!row?.enabled || !row.agent_enabled || !publicOrigin(row.gateway_origin)) return 'unavailable';
  if (!(row.grant_expires > now())) return 'denied';
  if (row.last_seen < now() - 30) return 'offline';
  return 'available';
}
export async function launchPanel(env, id, session, lang) {
  const c = launchCopy[lang];
  const state = enabled(env) ? availability(await runtime(env.DB, id, session.id)) : 'unavailable';
  return `<section class="launch-panel" aria-label="${c.title}"><h3>${c.title}</h3>${state === 'available' ? `<form method="post" action="/api/projects/${id}/launch" target="_blank" rel="noopener">${csrfInput(session)}${languageInput(lang)}<button type="submit">${c.start} ↗</button></form><p class="muted">${c.limit}</p>` : `<p class="muted">${c[state]}</p>`}</section>`;
}

async function sweep(db) {
  await db.prepare("DELETE FROM runtime_access WHERE expires_at <= ?").bind(now()).run();
  const rows = await db.prepare(`SELECT * FROM runtime_runs WHERE state IN ${active}`).all();
  for (const run of rows.results) {
    const valid = await allowedRun(db, run.id);
    if (!valid || (run.state === 'queued' && run.created_at < now() - 120) || (['starting', 'ready'].includes(run.state) && run.lease_until <= now())) {
      await db.prepare("UPDATE runtime_runs SET state = CASE WHEN state = 'queued' THEN 'failed' ELSE 'stopping' END, error_code = 'expired' WHERE id = ? AND state IN ('queued','starting','ready')").bind(run.id).run();
    }
  }
}

async function runner(request, env, path) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const bearer = request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  const agent = bearer && await env.DB.prepare('SELECT * FROM runtime_agents WHERE token_hash = ? AND enabled = 1').bind(await digest(bearer)).first();
  if (!agent) return json({ error: 'unauthorized' }, 401);
  let body;
  try {
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') throw new Error();
    body = JSON.parse(new TextDecoder().decode(await boundedBody(request)));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  } catch { return json({ error: 'invalid' }, 400); }
  await sweep(env.DB);
  if (path === '/api/runner/poll') {
    if (!Array.isArray(body.runs) || body.runs.length > 2 || body.runs.some(run => !uuidPattern.test(run.id) || !tokenPattern.test(run.claim))) return json({ error: 'invalid' }, 400);
    await env.DB.prepare('UPDATE runtime_agents SET last_seen = ? WHERE id = ?').bind(now(), agent.id).run();
    const leases = [];
    for (const item of body.runs) {
      const run = await env.DB.prepare('SELECT * FROM runtime_runs WHERE id = ? AND agent_id = ? AND claim_hash = ?').bind(item.id, agent.id, await digest(item.claim)).first();
      if (run && enabled(env) && ['starting', 'ready'].includes(run.state)) {
        const until = Math.min(now() + 30, run.expires_at);
        await env.DB.prepare('UPDATE runtime_runs SET lease_until = ? WHERE id = ?').bind(until, run.id).run();
        leases.push({ id: run.id, lease_until: until, stop: false });
      } else {
        if (run) await env.DB.prepare("UPDATE runtime_runs SET state = 'stopping' WHERE id = ? AND state IN ('starting','ready')").bind(run.id).run();
        leases.push({ id: item.id, stop: true });
      }
    }
    let job = null;
    if (enabled(env)) {
      const queued = await env.DB.prepare("SELECT r.*, p.runtime_key FROM runtime_runs r JOIN project_runtimes p ON p.project_id = r.project_id WHERE r.agent_id = ? AND r.state = 'queued' ORDER BY r.created_at LIMIT 1").bind(agent.id).first();
      if (queued) {
        const claim = randomToken(), lease = Math.min(now() + 30, queued.expires_at);
        const result = await env.DB.prepare("UPDATE runtime_runs SET state = 'starting', claim_hash = ?, lease_until = ? WHERE id = ? AND state = 'queued'").bind(await digest(claim), lease, queued.id).run();
        if (changes(result)) job = { id: queued.id, runtime_key: queued.runtime_key, claim, expires_at: queued.expires_at, lease_until: lease };
      }
    }
    return json({ job, leases });
  }
  const match = path.match(/^\/api\/runner\/jobs\/([0-9a-f-]+)\/result$/);
  if (!match || !uuidPattern.test(match[1]) || !tokenPattern.test(body.claim) || !['ready', 'failed', 'stopped'].includes(body.state)) return json({ error: 'invalid' }, 400);
  const run = await env.DB.prepare('SELECT * FROM runtime_runs WHERE id = ? AND agent_id = ? AND claim_hash = ?').bind(match[1], agent.id, await digest(body.claim)).first();
  if (!run) return json({ error: 'not_found' }, 404);
  if (body.state === 'ready' && (!enabled(env) || !['starting','ready'].includes(run.state) || run.lease_until <= now() || !await allowedRun(env.DB, run.id))) return json({ error: 'expired' }, 409);
  if (body.state !== 'ready' && !['starting', 'ready', 'stopping', body.state].includes(run.state)) return json({ error: 'state' }, 409);
  const error = ['health', 'profile', 'docker', 'expired'].includes(body.error) ? body.error : '';
  await env.DB.prepare('UPDATE runtime_runs SET state = ?, error_code = ? WHERE id = ?').bind(body.state, error, run.id).run();
  return json({ ok: true });
}

async function grantsPage(env, session, lang, ui) {
  const c = launchCopy[lang];
  const accounts = (await env.DB.prepare('SELECT id, email FROM accounts WHERE enabled = 1 ORDER BY email').all()).results;
  const projects = (await env.DB.prepare("SELECT p.project_id, j.translations FROM project_runtimes p JOIN projects j ON j.id = p.project_id WHERE j.status = 'published'").all()).results;
  const rows = (await env.DB.prepare('SELECT g.*, a.email, p.translations FROM project_runtime_grants g JOIN accounts a ON a.id = g.account_id JOIN projects p ON p.id = g.project_id ORDER BY a.email').all()).results;
  const title = row => JSON.parse(row.translations)[lang]?.title || row.project_id;
  const fields = (account, project) => `${csrfInput(session)}<input type="hidden" name="account_id" value="${escape(account)}"><input type="hidden" name="project_id" value="${escape(project)}">`;
  const form = projects.length ? `<form method="post">${csrfInput(session)}<input type="hidden" name="action" value="grant"><label>${c.account}<select name="account_id">${accounts.map(row => `<option value="${escape(row.id)}">${escape(row.email)}</option>`).join('')}</select></label><label>${c.project}<select name="project_id">${projects.map(row => `<option value="${row.project_id}">${escape(title(row))}</option>`).join('')}</select></label><label>${c.days}<input type="number" name="days" min="1" max="30" value="1" required></label><button>${c.grant}</button></form>` : `<p>${c.empty}</p>`;
  const list = rows.map(row => `<article class="admin-item"><div><strong>${escape(row.email)}</strong><p>${escape(title(row))}</p><time>${new Date(row.expires_at * 1000).toISOString()}</time></div><form method="post">${fields(row.account_id, row.project_id)}<input type="hidden" name="action" value="revoke"><button class="secondary">${c.revoke}</button></form></article>`).join('');
  return ui.response(ui.page(lang, c.grants, `<h1>${c.grants}</h1><section class="launch-panel">${form}</section>${list}`, true, `/${lang}/admin/runtime-grants/`, session.csrf_token));
}

export async function handleLaunch(request, env, session, ui) {
  const url = new URL(request.url), path = url.pathname;
  const api = /^\/api\/(?:projects\/[^/]+\/(?:runtime|launch)|launches\/[^/]+(?:\/(?:open|stop))?)$/.test(path);
  const progress = path.match(/^\/(zh|en|ja|fr)\/launch\/([0-9a-f-]+)\/(authorize\/)?$/);
  const admin = path.match(/^\/(zh|en|ja|fr)\/admin\/runtime-grants\/$/);
  if (path.startsWith('/api/runner/')) return runner(request, env, path);
  if (!api && !progress && !admin) return null;
  let lang = progress?.[1] || admin?.[1] || 'zh';
  if (!session) return api ? json({ error: 'unauthorized' }, 401) : ui.redirect(`/${lang}/login/?next=${encodeURIComponent(progress ? `/${lang}/launch/${progress[2]}/` : path)}`);
  let form;
  if (request.method === 'POST') {
    try { form = await ui.anonymousForm(request); } catch { return json({ error: 'invalid' }, 400); }
    if (!validCsrf(session, form.get('csrf')) || request.headers.get('Origin') !== url.origin) return json({ error: 'csrf' }, 403);
    if (['zh', 'en', 'ja', 'fr'].includes(form.get('lang'))) lang = form.get('lang');
  } else if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const c = launchCopy[lang];
  const fail = (key, status) => request.method === 'POST' ? ui.message(lang, c[key] || c.failed, status, session.csrf_token) : json({ error: key }, status);
  if (admin) {
    if (session.role !== 'admin') return fail('denied', 403);
    if (form) {
      const account = form.get('account_id'), project = form.get('project_id'), action = form.get('action'), days = Number(form.get('days'));
      if (!uuidPattern.test(project) || !['grant', 'revoke'].includes(action) || !await env.DB.prepare('SELECT id FROM accounts WHERE id = ? AND enabled = 1').bind(account).first() || !await env.DB.prepare('SELECT project_id FROM project_runtimes WHERE project_id = ?').bind(project).first()) return fail('invalid', 400);
      if (action === 'grant') {
        if (!Number.isInteger(days) || days < 1 || days > 30) return fail('invalid', 400);
        await env.DB.prepare('INSERT INTO project_runtime_grants (account_id, project_id, expires_at) VALUES (?, ?, ?) ON CONFLICT(account_id, project_id) DO UPDATE SET expires_at = excluded.expires_at').bind(account, project, now() + days * 86400).run();
      } else await env.DB.prepare('DELETE FROM project_runtime_grants WHERE account_id = ? AND project_id = ?').bind(account, project).run();
      await sweep(env.DB);
      return ui.redirect(path);
    }
    return grantsPage(env, session, lang, ui);
  }
  if (!enabled(env)) return fail('unavailable', 503);
  await sweep(env.DB);
  const project = path.match(/^\/api\/projects\/([^/]+)\/(runtime|launch)$/);
  if (project) {
    if (!uuidPattern.test(project[1])) return fail('invalid', 400);
    if (request.method !== (project[2] === 'launch' ? 'POST' : 'GET')) return json({ error: 'method' }, 405);
    const row = await runtime(env.DB, project[1], session.id), state = availability(row);
    if (project[2] === 'runtime') return json({ state });
    if (state !== 'available') return fail(state, state === 'denied' ? 403 : 503);
    const old = await env.DB.prepare(`SELECT * FROM runtime_runs WHERE project_id = ? AND state IN ${active}`).bind(project[1]).first();
    if (old) return old.session_hash === session.token_hash && old.state !== 'stopping' ? ui.redirect(`/${lang}/launch/${old.id}/`) : fail('busy', 409);
    const id = crypto.randomUUID(), timestamp = now();
    const result = await env.DB.prepare(`INSERT OR IGNORE INTO runtime_runs (id, project_id, account_id, session_hash, agent_id, state, slot, created_at, expires_at)
      SELECT ?, ?, ?, ?, ?, 'queued', candidate, ?, ? FROM (SELECT 1 AS candidate UNION ALL SELECT 2)
      WHERE candidate NOT IN (SELECT slot FROM runtime_runs WHERE state IN ${active})
      AND (SELECT COUNT(*) FROM runtime_runs WHERE account_id = ? AND created_at > ?) < 6 LIMIT 1`).bind(id, row.project_id, session.id, session.token_hash, row.agent_id, timestamp, Math.min(timestamp + row.duration_seconds, row.grant_expires, session.expires_at), session.id, timestamp - 3600).run();
    if (!changes(result)) {
      const duplicate = await env.DB.prepare(`SELECT id, session_hash FROM runtime_runs WHERE project_id = ? AND state IN ('queued','starting','ready')`).bind(row.project_id).first();
      if (duplicate?.session_hash === session.token_hash) return ui.redirect(`/${lang}/launch/${duplicate.id}/`);
      return fail(duplicate ? 'busy' : 'quota', duplicate ? 409 : 429);
    }
    return ui.redirect(`/${lang}/launch/${id}/`);
  }
  const match = path.match(/^\/api\/launches\/([^/]+)(?:\/(open|stop))?$/);
  const id = progress?.[2] || match?.[1];
  if (!uuidPattern.test(id)) return fail('invalid', 400);
  const run = await env.DB.prepare('SELECT * FROM runtime_runs WHERE id = ?').bind(id).first();
  if (!run || run.session_hash !== session.token_hash) return fail('denied', 404);
  if (match) {
    if (!match[2]) return request.method === 'GET' ? json({ id, state: run.state, expires_at: run.expires_at }) : json({ error: 'method' }, 405);
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    if (match[2] === 'stop') {
      await env.DB.prepare("UPDATE runtime_runs SET state = CASE WHEN state = 'queued' THEN 'stopped' ELSE 'stopping' END WHERE id = ? AND state IN ('queued','starting','ready')").bind(id).run();
      return ui.redirect(`/${lang}/launch/${id}/`);
    }
    const ready = await readyRun(env.DB, id);
    if (!ready || !publicOrigin(ready.gateway_origin)) return fail('expired', 409);
    return ui.redirect(`${ready.gateway_origin}/__launch/start?run=${id}&lang=${lang}`);
  }
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  if (progress[3]) {
    const state = url.searchParams.get('state'), ready = await readyRun(env.DB, id);
    if (!ready || !tokenPattern.test(state) || !publicOrigin(ready.gateway_origin)) return fail('expired', 403);
    const code = randomToken();
    await env.DB.prepare("INSERT INTO runtime_access (token_hash, run_id, session_hash, kind, state_hash, expires_at) VALUES (?, ?, ?, 'code', ?, ?)").bind(await digest(code), id, session.token_hash, await digest(state), Math.min(now() + 60, run.expires_at)).run();
    return ui.redirect(`${ready.gateway_origin}/__launch/exchange?code=${code}&state=${state}`);
  }
  const data = ['queued', 'starting', 'ready', 'stopping', 'stopped', 'failed'].map(state => `data-${state}="${escape(c[state])}"`).join(' ');
  const body = `<section class="launch-panel" data-launch-status="/api/launches/${id}" ${data} data-error="${escape(c.statusError)}"><h1>${c.title}</h1><p role="status" aria-live="polite">${c[run.state]}</p><p>${c.remaining} <time>${new Date(run.expires_at * 1000).toISOString()}</time></p><form data-launch-open hidden method="post" action="/api/launches/${id}/open">${csrfInput(session)}${languageInput(lang)}<button>${c.open}</button></form><form data-launch-stop method="post" action="/api/launches/${id}/stop">${csrfInput(session)}${languageInput(lang)}<button class="secondary">${c.stop}</button></form><p><a href="/${lang}/projects/${run.project_id}/">← ${c.back}</a></p></section><script src="/launch.js" defer></script>`;
  const response = ui.response(ui.page(lang, c.title, body, session.role === 'admin', path, session.csrf_token));
  const configured = await env.DB.prepare('SELECT gateway_origin FROM project_runtimes WHERE project_id = ?').bind(run.project_id).first();
  if (publicOrigin(configured?.gateway_origin)) response.headers.set('Content-Security-Policy', response.headers.get('Content-Security-Policy').replace("form-action 'self'", `form-action 'self' ${configured.gateway_origin}`));
  return response;
}
