import { readFile } from 'node:fs/promises';
import { validateConfig } from './config.mjs';

if (process.argv.length !== 3) throw new Error('Usage: node validate.mjs <private-config.json>');
const config = validateConfig(JSON.parse(await readFile(process.argv[2], 'utf8')));
const counts = { docker: 0, open: 0, native: 0, sample: 0, android: 0, unavailable: 0 };
for (const project of Object.values(config.projects)) counts[project.mode]++;
process.stdout.write(`Configuration valid: ${Object.entries(counts).map(([mode,count]) => `${count} ${mode}`).join(', ')}.\n`);
