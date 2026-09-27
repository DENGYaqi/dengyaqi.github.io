import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { csrfToken, detectImage, escapeHtml, isAdmin, validCsrf, validatePublish } from '../src/worker.js';

const id = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const translations = Object.fromEntries(['zh', 'en', 'ja', 'fr'].map(lang => [lang, { title: `Title ${lang}`, summary: `Summary ${lang}`, body: `Body ${lang}` }]));
const row = { id, status: 'draft', sort_order: 0, translations: JSON.stringify(translations), experience_keys: '["ai_rd_lead"]', created_at: '', updated_at: '' };

function fixture() {
  const state = { row: { ...row }, media: { id: imageId, project_id: id, object_key: `${id}/${imageId}`, content_type: 'image/png', status: 'draft' }, objectReads: 0 };
  const DB = { prepare(sql) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() {
        if (sql.startsWith('SELECT m.*, p.status')) return values[0] === imageId ? { ...state.media, status: state.row.status } : null;
        if (sql.startsWith('SELECT * FROM projects WHERE id')) return values[0] === id ? state.row : null;
        return null;
      },
      async all() {
        if (sql.startsWith('SELECT * FROM projects')) return { results: [state.row] };
        if (sql.startsWith('SELECT * FROM media')) return { results: [state.media] };
        return { results: [] };
      },
    };
  } };
  const MEDIA = { async get() { state.objectReads++; return { body: new Blob(['image']).stream() }; } };
  return { state, env: { DB, MEDIA, ADMIN_EMAIL: 'owner@example.test', CSRF_SECRET: 'test-only-secret' } };
}
const visitor = { access: { async getIdentity() { return { email: 'guest@example.test' }; } } };
const admin = { access: { async getIdentity() { return { email: 'owner@example.test' }; } } };

test('authentication and admin are enforced before data access', async () => {
  const { env } = fixture();
  assert.equal((await worker.fetch(new Request('https://example.test/zh/projects/'), env, {})).status, 403);
  assert.equal((await worker.fetch(new Request('https://example.test/zh/admin/'), env, visitor)).status, 403);
  assert.equal((await worker.fetch(new Request('https://example.test/zh/admin/'), env, admin)).status, 200);
  assert.equal(isAdmin({ email: 'OWNER@example.test' }, env), true);
});

test('draft pages and media are hidden from invited viewers', async () => {
  const { env, state } = fixture();
  assert.equal((await worker.fetch(new Request(`https://example.test/zh/projects/${id}/`), env, visitor)).status, 404);
  assert.equal((await worker.fetch(new Request(`https://example.test/media/${imageId}`), env, visitor)).status, 404);
  assert.equal(state.objectReads, 0);
  assert.equal((await worker.fetch(new Request(`https://example.test/zh/projects/${id}/`), env, admin)).status, 200);
  state.row.status = 'published';
  assert.equal((await worker.fetch(new Request(`https://example.test/zh/projects/${id}/`), env, visitor)).status, 200);
  assert.equal((await worker.fetch(new Request(`https://example.test/media/${imageId}`), env, visitor)).status, 200);
  assert.equal(state.objectReads, 1);
});

test('publishing requires complete four-language content and an experience', () => {
  const item = { translations: structuredClone(translations), experience_keys: ['ai_rd_lead'] };
  assert.equal(validatePublish(item), true);
  item.translations.fr.body = '';
  assert.equal(validatePublish(item), false);
  item.translations.fr.body = 'Texte';
  item.experience_keys = [];
  assert.equal(validatePublish(item), false);
});

test('forms reject cross-user, expired and cross-site tokens', async () => {
  const secret = 'test-only-secret', now = 1_800_000_000_000;
  const token = await csrfToken(secret, 'owner@example.test', now);
  assert.equal(await validCsrf(secret, 'owner@example.test', token, now), true);
  assert.equal(await validCsrf(secret, 'other@example.test', token, now), false);
  assert.equal(await validCsrf(secret, 'owner@example.test', token, now + 7_201_000), false);
  const { env } = fixture();
  const denied = await worker.fetch(new Request('https://example.test/zh/admin/projects/', { method: 'POST', headers: { Origin: 'https://attacker.test' }, body: new URLSearchParams({ csrf: token }) }), env, admin);
  assert.equal(denied.status, 403);
});

test('only supported image signatures pass and text is escaped', () => {
  assert.equal(detectImage(new Uint8Array([0xff, 0xd8, 0xff])), 'image/jpeg');
  assert.equal(detectImage(new TextEncoder().encode('<script>')), null);
  assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});
