export const SESSION_SECONDS = 24 * 60 * 60;
export const PASSWORD_ITERATIONS = 600_000;
const PASSWORD_ROUNDS = 6;
const ROUND_ITERATIONS = PASSWORD_ITERATIONS / PASSWORD_ROUNDS;
const encoder = new TextEncoder();
const COOKIE = 'yaqi_session';
const FORM_COOKIE = 'yaqi_form';

const base64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unbase64 = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), char => char.charCodeAt(0));
const random = length => base64(crypto.getRandomValues(new Uint8Array(length)));
const equal = (a, b) => a.length === b.length && a.reduce((diff, byte, index) => diff | (byte ^ b[index]), 0) === 0;

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function newPassword() { return random(24); }

export async function hashPassword(password, salt = random(16)) {
  const saltBytes = unbase64(salt);
  let value = encoder.encode(password);
  for (let round = 0; round < PASSWORD_ROUNDS; round++) {
    const key = await crypto.subtle.importKey('raw', value, 'PBKDF2', false, ['deriveBits']);
    const roundSalt = new Uint8Array([...saltBytes, round]);
    value = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: roundSalt, iterations: ROUND_ITERATIONS }, key, 256));
  }
  return { salt, hash: `v2$${base64(value)}` };
}

export async function verifyPassword(password, account) {
  const result = await hashPassword(password, account?.password_salt || 'AAAAAAAAAAAAAAAAAAAAAA');
  return Boolean(account?.password_hash?.startsWith('v2$') && equal(unbase64(result.hash.slice(3)), unbase64(account.password_hash.slice(3))));
}

async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sessionFromRequest(request, db) {
  const token = request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{43})(?:;|$)`))?.[1];
  if (!token) return null;
  const row = await db.prepare('SELECT s.token_hash, s.csrf_token, s.expires_at, a.id, a.email, a.role FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND a.enabled = 1 AND s.expires_at > ?').bind(await digest(token), Math.floor(Date.now() / 1000)).first();
  return row || null;
}

export function cookieSecurity(request) {
  const url = new URL(request.url);
  if (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return '';
  return '; Secure';
}

export function formToken(request) {
  const old = request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${FORM_COOKIE}=([A-Za-z0-9_-]{43})(?:;|$)`))?.[1];
  const token = old || random(32);
  return { token, cookie: `${FORM_COOKIE}=${token}; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict${cookieSecurity(request)}` };
}

export function validFormToken(request, value) {
  const token = request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${FORM_COOKIE}=([A-Za-z0-9_-]{43})(?:;|$)`))?.[1];
  return Boolean(token && typeof value === 'string' && equal(encoder.encode(token), encoder.encode(value)));
}

export async function createSession(db, account, request = new Request('https://example.invalid')) {
  const token = random(32), csrf = random(32), expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  await db.prepare('INSERT INTO sessions (token_hash, account_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)').bind(await digest(token), account.id, csrf, expires).run();
  return { token, cookie: `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; SameSite=Lax${cookieSecurity(request)}` };
}

export async function revokeSession(db, session) {
  if (session) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.token_hash).run();
}

export const expiredCookie = request => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${cookieSecurity(request)}`;
export const validCsrf = (session, value) => Boolean(session && typeof value === 'string' && equal(encoder.encode(session.csrf_token), encoder.encode(value)));

export function safeNext(value, lang) {
  if (typeof value !== 'string' || value.length > 300 || value.includes('\\') || value.includes('//')) return `/${lang}/projects/`;
  if (/^\/(zh|en|ja|fr)\/(projects|experiences|admin)\/[A-Za-z0-9_/-]*$/.test(value) || /^\/media\/[0-9a-f-]{36}$/.test(value)) return value;
  return `/${lang}/projects/`;
}

export async function rateLimited(db, request, email) {
  const now = Math.floor(Date.now() / 1000), windowStart = now - 15 * 60;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  for (const [key, limit] of [[`ip:${ip}`, 30], [`email:${email}`, 5]]) {
    await db.prepare('INSERT INTO login_attempts (key, hits, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = CASE WHEN window_start < ? THEN 1 ELSE hits + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END').bind(key, now, windowStart, windowStart).run();
    const row = await db.prepare('SELECT hits FROM login_attempts WHERE key = ?').bind(key).first();
    if (row.hits > limit) return true;
  }
  return false;
}

export async function clearLoginAttempts(db, email) {
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(`email:${email}`).run();
}
