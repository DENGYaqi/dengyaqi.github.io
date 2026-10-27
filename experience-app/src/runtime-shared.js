export const now = () => Math.floor(Date.now() / 1000);
export const randomToken = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const changes = result => Number(result?.meta?.changes ?? result?.changes ?? 0);
export async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? new TextEncoder().encode(value) : value)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function publicOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password || url.port || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname) || /^[\d.]+$/.test(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
export async function boundedBody(request, limit = 16384) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
// This query is shared by the portal and isolated gateway. A login alone is not a grant.
export async function allowedRun(db, id) {
  return db.prepare(`SELECT r.*, p.gateway_origin, p.runtime_key FROM runtime_runs r
    JOIN project_runtimes p ON p.project_id = r.project_id AND p.enabled = 1
    JOIN projects j ON j.id = r.project_id AND j.status = 'published'
    JOIN runtime_agents a ON a.id = r.agent_id AND a.enabled = 1
    JOIN accounts u ON u.id = r.account_id AND u.enabled = 1
    JOIN sessions s ON s.token_hash = r.session_hash AND s.account_id = r.account_id
    JOIN project_runtime_grants g ON g.account_id = r.account_id AND g.project_id = r.project_id
    WHERE r.id = ? AND r.expires_at > ? AND s.expires_at > ? AND g.expires_at > ?`).bind(id, now(), now(), now()).first();
}
export async function readyRun(db, id) {
  const row = await allowedRun(db, id);
  return row?.state === 'ready' && row.lease_until > now() ? row : null;
}
export async function signature(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))), byte => byte.toString(16).padStart(2, '0')).join('');
}
