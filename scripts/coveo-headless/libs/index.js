/**
 * Bundle @coveo/headless into a single browser ESM module.
 * Headless 3 no longer ships dist/browser; the site imports this file directly.
 * Regenerate after a version bump: npm install && node index.js
 */

import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// Installed only in this folder (`npm install` here) when regenerating the bundle. Root CI does not install it.
// eslint-disable-next-line import/no-unresolved
import esbuild from 'esbuild';

const dir = dirname(fileURLToPath(import.meta.url));
const outfile = join(dir, 'browser/headless.esm.js');

mkdirSync(join(dir, 'browser'), { recursive: true });

await esbuild.build({
  entryPoints: [join(dir, 'node_modules/@coveo/headless/dist/esm/index.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  outfile,
  banner: {
    js: '/* @coveo/headless browser bundle. Regenerate with: node index.js */',
  },
});
