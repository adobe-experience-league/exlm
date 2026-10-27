import { mkdtemp, readFile, writeFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const version = process.argv[2] || '0.1.0-local';
if (!/^[\w.-]{1,32}$/.test(version))
  throw new Error('Bundle version must be 1-32 letters, digits, underscores, dots or hyphens');
const source = new URL('./header/', import.meta.url);
const staging = await mkdtemp(join(tmpdir(), 'exl-edge-header-'));
try {
  const manifest = JSON.parse(await readFile(new URL('bundle.json', source), 'utf8'));
  manifest['edgeworker-version'] = version;
  await writeFile(join(staging, 'bundle.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await Promise.all(['main.js', 'assembly.js'].map((file) => copyFile(new URL(file, source), join(staging, file))));
  await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
  const archive = resolve(fileURLToPath(new URL('./dist/header.tgz', import.meta.url)));
  execFileSync('tar', ['-czf', archive, '-C', staging, 'main.js', 'assembly.js', 'bundle.json']);
  console.log(`Created ${archive} (${version})`);
} finally {
  await rm(staging, { recursive: true });
}
