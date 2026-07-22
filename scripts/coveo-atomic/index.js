/**
 * Vendor @coveo/atomic browser CDN build into scripts/coveo-atomic
 * (same pattern as scripts/coveo-headless/libs).
 *
 * Usage:
 *   cd scripts/coveo-atomic
 *   npm install
 *   node index.js
 */
import fs from 'fs/promises';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));
const from = join(dir, 'node_modules/@coveo/atomic/dist/atomic');
const to = join(dir, 'cdn');

if (!existsSync(from)) {
  console.error('Missing @coveo/atomic. Run: npm install (in scripts/coveo-atomic)');
  process.exit(1);
}

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
await fs.cp(from, to, { recursive: true });
console.log('Copied', from, '->', to);
