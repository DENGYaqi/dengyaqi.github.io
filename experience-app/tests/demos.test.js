import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
import client from '../src/demos-client.js';
import { prepareMedia, checkMediaReferences, checkRetirements } from '../scripts/upload-private-gifs.mjs';

const projectId = '11111111-1111-4111-8111-111111111111';
const gifId = '22222222-2222-4222-8222-222222222222';
const posterId = '33333333-3333-4333-8333-333333333333';

test('media validation decodes GIF frames and static posters before accepting uploads', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-media-test-'));
  try {
    const gif = join(directory, 'demo.gif'), poster = join(directory, 'poster.png');
    await sharp(Buffer.from([255, 0, 0, 0, 0, 255]), { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } }).gif({ delay: [100, 100] }).toFile(gif);
    await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toFile(poster);
    const data = { media: [{ id: gifId, project_id: projectId, file: gif }, { id: posterId, project_id: projectId, file: poster }] };
    const prepared = await prepareMedia(data);
    assert.deepEqual(prepared.map(item => item.content_type), ['image/gif', 'image/png']);
    await assert.rejects(prepareMedia({ ...data, preserve_project_ids: [projectId] }), /preserved/);
    await assert.rejects(prepareMedia({ media: [data.media[0], data.media[0]] }), /Duplicate/);
    const valid = readFileSync(gif);
    writeFileSync(gif, valid.subarray(0, valid.length - 8));
    await assert.rejects(prepareMedia(data));
    writeFileSync(gif, 'GIF89a');
    await assert.rejects(prepareMedia(data));
    await sharp({ create: { width: 2561, height: 1, channels: 3, background: 'red' } }).png().toFile(poster);
    await assert.rejects(prepareMedia({ media: [data.media[1]] }), /2560/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('content switch rejects unknown media, cross-project references, reused IDs and protected projects', () => {
  const gif = { id: gifId, project_id: projectId, content_type: 'image/gif' };
  const poster = { id: posterId, project_id: projectId, content_type: 'image/png' };
  const data = { projects: [{ id: projectId, translations: { zh: { modules: [{ media_id: gifId, poster_id: posterId }] } } }] };
  checkMediaReferences(data, [gif, poster], [], []);
  assert.throws(() => checkMediaReferences(data, [gif], [], []), /poster/);
  assert.throws(() => checkMediaReferences(data, [gif, { ...poster, project_id: gifId }], [], [gifId]), /poster/);
  assert.throws(() => checkMediaReferences(data, [gif, poster], [gif], []), /new media ID/);
  assert.throws(() => checkMediaReferences({ ...data, preserve_project_ids: [projectId] }, [gif, poster], [], []), /preserved/);
  assert.throws(() => checkMediaReferences({}, [gif], [], []), /does not exist/);
});

test('retirement requires an intact backup, an exact database match, and no remaining references', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yaqi-retire-test-'));
  try {
    const file = join(directory, 'old.gif');
    writeFileSync(file, 'old media backup');
    const old = { id: gifId, project_id: projectId, object_key: `projects/${projectId}/gifs/${gifId}.gif`, backup_file: file, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') };
    const project = { id: projectId, translations: { zh: { modules: [] } } };
    const data = { projects: [project], retire_media: [old] };
    assert.deepEqual(checkRetirements(data, [old]), [old]);
    assert.throws(() => checkRetirements(data, [{ ...old, object_key: `${old.object_key}.changed` }]), /matches the database/);
    assert.throws(() => checkRetirements(data, []), /matches the database/);
    assert.throws(() => checkRetirements({ ...data, preserve_project_ids: [projectId] }, [old]), /unprotected/);
    assert.throws(() => checkRetirements({ ...data, projects: [] }, [old]), /replaced/);
    assert.throws(() => checkRetirements({ ...data, retire_media: [old, old] }), /unique/);
    assert.throws(() => checkRetirements({ ...data, retire_media: [{ ...old, object_key: `projects/${projectId}/../other.gif` }] }), /exact object key/);
    const other = { id: posterId, translations: JSON.stringify({ fr: { modules: [{ media_id: gifId }] } }) };
    assert.throws(() => checkRetirements(data, [old], [other]), /referenced/);
    assert.throws(() => checkRetirements({ ...data, media: [{ id: gifId }] }, [old]), /newly uploaded/);
    writeFileSync(file, 'changed backup');
    assert.throws(() => checkRetirements(data, [old]), /checksum mismatch/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('demo controls play on demand, stop others, restore poster and stop on close, errors or hidden page', () => {
  class Element extends EventTarget {
    hidden = true;
    attributes = new Map();
    classes = new Set();
    classList = { toggle: name => this.classes.has(name) ? (this.classes.delete(name), false) : (this.classes.add(name), true), remove: name => this.classes.delete(name) };
    setAttribute(key, value) { this.attributes.set(key, value); }
    removeAttribute(key) { this.attributes.delete(key); if (key === 'src') this.src = ''; }
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatchEvent(new Event('close')); }
    click() { this.dispatchEvent(new Event('click')); }
  }
  const sections = [1, 2].map(number => {
    const elements = Object.fromEntries(['.demo-preview', 'dialog', 'img', '.demo-play', '.demo-error', '.demo-size', '.demo-zoom', '.demo-close', '[data-demo-controls]'].map(key => [key, new Element()]));
    elements.dialog.querySelector = () => elements.img;
    elements['.demo-preview'].src = `/poster-${number}`;
    return { elements, dataset: { demo: `/gif-${number}`, poster: `/poster-${number}`, play: 'Play', stop: 'Stop' }, querySelector: key => elements[key], querySelectorAll: key => [elements[key]] };
  });
  const document = new Element();
  document.querySelectorAll = () => sections;
  document.hidden = false;
  runInNewContext(client, { document });
  const first = sections[0].elements, second = sections[1].elements;
  assert.equal(first['.demo-preview'].src, '/poster-1');
  assert.equal(first['[data-demo-controls]'].hidden, false);
  first['.demo-play'].click();
  assert.equal(first['.demo-preview'].src, '/gif-1');
  assert.equal(first['.demo-play'].attributes.get('aria-pressed'), 'true');
  second['.demo-play'].click();
  assert.equal(first['.demo-preview'].src, '/poster-1');
  first['.demo-zoom'].click();
  assert.equal(first.dialog.open, true);
  first['.demo-play'].click();
  assert.equal(first.img.src, '/gif-1');
  first['.demo-size'].click();
  assert.equal(first['.demo-size'].attributes.get('aria-pressed'), 'true');
  first['.demo-close'].click();
  assert.equal(first['.demo-preview'].src, '/poster-1');
  assert.equal(first.img.src, '');
  first['.demo-play'].click();
  first['.demo-preview'].dispatchEvent(new Event('error'));
  assert.equal(first['.demo-error'].hidden, false);
  assert.equal(first['.demo-preview'].src, '/poster-1');
  first['.demo-play'].click();
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(first['.demo-preview'].src, '/poster-1');
});
