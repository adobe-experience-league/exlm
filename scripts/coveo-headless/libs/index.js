// copy folder recursively from ./node_modules/@coveo/headless/dist/browser to ./browser

import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

/**
 * Just a simple script to copy the headless browser ESM module to the browser folder
 * for use in browser as a module (instead of bundling it)
 * this is done here to ensure we get the module as is from NPM, and easy upgrade it in future
 */

let dir;
try {
  dir = __dirname; // if commonjs, this will get current directory
} catch (e) {
  dir = dirname(fileURLToPath(import.meta.url)); // if esm, this will get current directory
}

const from = join(dir, '/node_modules/@coveo/headless/dist/browser');
const to = join(dir, '/browser');

const ensureDir = (d) => {
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true });
  }
};

ensureDir(to);
await fs.cp(from, to, { recursive: true });
