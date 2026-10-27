import { boundedBody, changes, digest, now, publicOrigin, randomToken, readyRun, signature, tokenPattern, uuidPattern } from '../src/runtime-shared.js';

const security = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow' };
const cookie = (name, value, seconds) => `__Host-${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${seconds}`;
const readCookie = (request, name) => request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)__Host-${name}=([A-Za-z0-9_-]{43})(?:;|$)`))?.[1];
const reject = (status = 403) => new Response('在线体验不可用或已过期。请返回项目页重新进入。', { status, headers: { ...security, 'Content-Type': 'text/plain; charset=utf-8' } });
function redirect(location, cookies = []) {
  const headers = new Headers({ ...security, Location: location });
  for (const value of cookies) headers.append('Set-Cookie', value);
  return new Response(null, { status: 303, headers });
}
export async function accessFor(request, env) {
  const token = readCookie(request, 'demo');
  if (!token) return null;
  const access = await env.DB.prepare("SELECT * FROM runtime_access WHERE token_hash = ? AND kind = 'session' AND expires_at > ?").bind(await digest(token), now()).first();
  const run = access && await readyRun(env.DB, access.run_id);
  return run && access.session_hash === run.session_hash && run.gateway_origin === new URL(request.url).origin && run.project_id === env.PROJECT_ID ? { access, run } : null;
}
// Streams and WebSockets must not outlive revoked portal permissions.
export function guardedStream(body, valid, interval = 10000) {
  const reader = body.getReader();
  let timer, closed = false;
  const cleanup = () => { closed = true; clearInterval(timer); };
  return new ReadableStream({
    start(controller) {
      timer = setInterval(async () => {
        try { if (await valid()) return; } catch { /* Fail closed on database failure. */ }
        if (!closed) { cleanup(); controller.error(new Error('expired')); reader.cancel().catch(() => {}); }
      }, interval);
    },
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (closed) return;
        if (done) { cleanup(); controller.close(); } else controller.enqueue(value);
      } catch (error) { if (!closed) { cleanup(); controller.error(error); } }
    },
    cancel(reason) { cleanup(); return reader.cancel(reason); },
  });
}
export function bridge(upstream, valid, interval = 10000) {
  const pair = new WebSocketPair(), client = pair[0], socket = pair[1];
  socket.accept(); upstream.accept();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true; clearInterval(timer);
    for (const ws of [socket, upstream]) { try { ws.close(1000, 'Session ended'); } catch { /* Peer may already be closed. */ } }
  };
  const timer = setInterval(async () => { try { if (await valid()) return; } catch { /* Fail closed. */ } close(); }, interval);
  for (const [from, to] of [[socket, upstream], [upstream, socket]]) {
    from.addEventListener('message', event => { try { to.send(event.data); } catch { close(); } });
    from.addEventListener('close', close); from.addEventListener('error', close);
  }
  return new Response(null, { status: 101, webSocket: client, headers: security });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (env.DEMO_ENABLED !== 'true' || !publicOrigin(env.PORTAL_ORIGIN) || !publicOrigin(env.GATEWAY_ORIGIN) || url.origin !== env.GATEWAY_ORIGIN || env.PORTAL_ORIGIN === url.origin) return reject(503);
      if (url.pathname === '/__launch/start') {
        if (request.method !== 'GET') return reject(405);
        const id = url.searchParams.get('run'), lang = url.searchParams.get('lang');
        if (!uuidPattern.test(id) || !['zh', 'en', 'ja', 'fr'].includes(lang)) return reject(400);
        const run = await readyRun(env.DB, id);
        if (!run || run.gateway_origin !== url.origin || run.project_id !== env.PROJECT_ID) return reject();
        const state = randomToken();
        return redirect(`${env.PORTAL_ORIGIN}/${lang}/launch/${id}/authorize/?state=${state}`, [cookie('demo-state', state, 60)]);
      }
      if (url.pathname === '/__launch/exchange') {
        if (request.method !== 'GET') return reject(405);
        const code = url.searchParams.get('code'), state = url.searchParams.get('state');
        if (!tokenPattern.test(code) || !tokenPattern.test(state) || state !== readCookie(request, 'demo-state')) return reject();
        const codeHash = await digest(code), stateHash = await digest(state);
        const access = await env.DB.prepare("SELECT * FROM runtime_access WHERE token_hash = ? AND kind = 'code' AND state_hash = ? AND expires_at > ?").bind(codeHash, stateHash, now()).first();
        const run = access && await readyRun(env.DB, access.run_id);
        if (!run || run.gateway_origin !== url.origin || run.project_id !== env.PROJECT_ID || run.session_hash !== access.session_hash) return reject();
        const token = randomToken(), expiry = Math.min(now() + 1800, run.expires_at);
        const result = await env.DB.prepare("UPDATE runtime_access SET token_hash = ?, kind = 'session', expires_at = ?, state_hash = '' WHERE token_hash = ? AND kind = 'code' AND state_hash = ? AND expires_at > ?").bind(await digest(token), expiry, codeHash, stateHash, now()).run();
        if (!changes(result)) return reject();
        return redirect('/', [cookie('demo', token, expiry - now()), cookie('demo-state', '', 0)]);
      }
      if (url.pathname.startsWith('/__launch/')) return reject(404);
      const authorized = await accessFor(request, env);
      if (!authorized) return reject();
      const websocket = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
      if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(request.method)) return reject(405);
      if ((websocket || !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) && request.headers.get('Origin') !== url.origin) return reject();
      if (!publicOrigin(env.UPSTREAM_ORIGIN) || !env.ACCESS_CLIENT_ID || !env.ACCESS_CLIENT_SECRET || !tokenPattern.test(env.PROXY_SECRET)) return reject(503);
      let bytes;
      try { bytes = await boundedBody(request, 8 * 1024 * 1024); } catch { return reject(413); }
      const headers = new Headers(request.headers);
      for (const key of [...headers.keys()]) if (/^(?:cf-|x-forwarded-|x-demo-)/i.test(key) || ['host', 'forwarded', 'content-length'].includes(key.toLowerCase())) headers.delete(key);
      const appCookies = (headers.get('Cookie') || '').split(';').map(value => value.trim()).filter(value => value && !value.startsWith('__Host-demo=') && !value.startsWith('__Host-demo-state=')).join('; ');
      if (appCookies) headers.set('Cookie', appCookies); else headers.delete('Cookie');
      const deadline = Math.min(now() + 20, authorized.run.lease_until, authorized.run.expires_at);
      const targetPath = url.pathname + url.search, runtimeKey = authorized.run.runtime_key;
      headers.set('CF-Access-Client-Id', env.ACCESS_CLIENT_ID);
      headers.set('CF-Access-Client-Secret', env.ACCESS_CLIENT_SECRET);
      headers.set('X-Demo-Key', runtimeKey);
      headers.set('X-Demo-Deadline', String(deadline));
      headers.set('X-Demo-Signature', await signature(env.PROXY_SECRET, `${request.method}\n${targetPath}\n${runtimeKey}\n${deadline}\n${await digest(bytes)}`));
      const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 30000);
      let upstream;
      try { upstream = await fetch(env.UPSTREAM_ORIGIN + targetPath, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : bytes, redirect: 'manual', signal: abort.signal }); }
      finally { clearTimeout(timeout); }
      const valid = async () => env.DEMO_ENABLED === 'true' && Boolean(await accessFor(request, env));
      if (!await valid()) { await upstream.body?.cancel(); return reject(); }
      if (upstream.status === 101 && upstream.webSocket) return bridge(upstream.webSocket, valid);
      const output = new Headers(upstream.headers);
      for (const key of [...output.keys()]) if (/^(?:cf-|x-demo-|access-control-|report-to|nel)/i.test(key)) output.delete(key);
      const cookies = output.getSetCookie(); output.delete('Set-Cookie');
      for (const value of cookies) {
        if (/^__Host-demo(?:-state)?=/i.test(value)) continue;
        output.append('Set-Cookie', value.replace(/;\s*Domain=[^;]+/ig, '') + '; Secure');
      }
      if (output.has('Location')) {
        const location = new URL(output.get('Location'), url.origin);
        // Apps must be configured with their public origin; never redirect to a local address.
        if (location.origin !== url.origin) { await upstream.body?.cancel(); return reject(502); }
        output.set('Location', location.pathname + location.search + location.hash);
      }
      for (const [key, value] of Object.entries(security)) output.set(key, value);
      output.set('Content-Security-Policy', `${output.get('Content-Security-Policy') || ''}; frame-ancestors 'none'`);
      return new Response(upstream.body ? guardedStream(upstream.body, valid) : null, { status: upstream.status, headers: output });
    } catch { return reject(502); }
  },
};
