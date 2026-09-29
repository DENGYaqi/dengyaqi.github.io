import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hashPassword, newPassword, normalizeEmail } from '../src/auth.js';

const email = normalizeEmail(process.argv[2]);
const target = process.argv[3];
if (!email || !['--local', '--remote'].includes(target)) {
  console.error('Usage: node scripts/bootstrap-admin.mjs admin@example.com --local|--remote');
  process.exit(1);
}

const password = newPassword(), { salt, hash } = await hashPassword(password);
const quote = value => `'${value.replaceAll("'", "''")}'`;
const sql = `INSERT INTO accounts (id, email, role, password_salt, password_hash, enabled, created_at) VALUES (${quote(crypto.randomUUID())}, ${quote(email)}, 'admin', ${quote(salt)}, ${quote(hash)}, 1, ${Math.floor(Date.now() / 1000)});`;
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'yaqi-projects', target, '--command', sql], { stdio: 'inherit' });
if (result.error || result.status !== 0) {
  console.error('Admin account was not created. Apply the database migration first.');
  process.exit(1);
}
console.log(`Admin account: ${email}`);
console.log(`Initial password (shown once): ${password}`);
