import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../../.github/workflows/pages-deploy.yml', import.meta.url), 'utf8');
const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('blog validation runs before the Pages build', () => {
  const check = workflow.search(/^\s+run: ruby scripts\/check-blog\.rb\s*$/m);
  const build = workflow.indexOf('run: bundle exec jekyll b');
  const upload = workflow.indexOf('uses: actions/upload-pages-artifact');
  assert.ok(check >= 0 && check < build && build < upload);
});

test('Worker deployment checks before release', () => {
  assert.deepEqual(scripts.deploy.split(' && '), ['npm run check', 'node scripts/check-deploy.mjs', 'wrangler deploy']);
  assert.match(scripts.check, /node --test && wrangler deploy --dry-run/);
});
