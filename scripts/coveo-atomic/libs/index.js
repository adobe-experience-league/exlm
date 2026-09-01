// Vendor the Coveo Atomic distribution (plus the Headless/Bueno modules it depends on) under this
// folder so it can be self-hosted and served from the site instead of the Coveo CDN
// (https://static.cloud.coveo.com/).
//
// IMPORTANT — why this is not a plain `fs.cp` of the npm package:
// The npm `@coveo/atomic` `dist/atomic` build EXTERNALIZES `@coveo/headless` and `@coveo/bueno`
// (its chunks contain bare `import ... from "@coveo/headless"` specifiers meant to be resolved by a
// bundler / import map). Loaded directly in the browser those fail with
// `Failed to resolve module specifier "@coveo/headless"`. The CDN build is a DIFFERENT, fully
// self-contained variant, but it hardcodes ROOT-ABSOLUTE imports to sibling modules on the CDN
// host, e.g. `from"/headless/v3.13.0/headless.esm.js"` and `from"/bueno/v1.0.7/bueno.esm.js"`.
// Served from our origin those resolve to `localhost/headless/...` and 404. So we:
//   - Mirror the self-contained atomic JS (atomic.esm.js + every transitively-referenced p-*.js
//     chunk) from the CDN.
//   - Mirror every `/headless/v*/…esm.js` + `/bueno/v*/…esm.js` module those chunks reference,
//     preserving their CDN paths under this folder (./headless/…, ./bueno/…).
//   - Rewrite those root-absolute specifiers in every vendored file to point at the served copies
//     (SERVE_BASE below).
//   - Copy lang/*.json + assets/*.svg + themes/* — plain, version-pinned data (identical in either
//     build) — from the npm package, which is the authoritative file list.
//
// SERVE_BASE must match the URL path this `libs/` folder is served at. atomic resolves its own
// chunks/assets/lang relative to atomic.esm.js's URL (import.meta.url), so the ./atomic tree stays
// self-relative; only the cross-package headless/bueno specifiers are absolute and rewritten.
// To upgrade: bump @coveo/atomic in package.json, then `npm install && npm start`.

import fs from 'fs/promises';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

let dir;
try {
  dir = __dirname; // if commonjs, this will get current directory
} catch (e) {
  dir = dirname(fileURLToPath(import.meta.url)); // if esm, this will get current directory
}

const CDN_HOST = 'https://static.cloud.coveo.com';
const SERVE_BASE = '/scripts/coveo-atomic/libs'; // URL path this folder is served at

// Read the installed version straight from the package manifest (its `exports` map blocks
// require('@coveo/atomic/package.json')), then pin the CDN atomic mirror to the same version.
const { version } = JSON.parse(readFileSync(join(dir, '/node_modules/@coveo/atomic/package.json'), 'utf8'));

const from = join(dir, '/node_modules/@coveo/atomic/dist/atomic');
const atomicDir = join(dir, '/atomic');

const ensureDir = (d) => {
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true });
  }
};

// Fetch a text resource, returning null on a non-200 (some referenced names are never emitted).
const fetchText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
};

// Concurrency-limited map (the CDN mirror is hundreds of small files).
const mapLimited = async (items, limit, fn) => {
  const out = [];
  for (let i = 0; i < items.length; i += limit) {
    // eslint-disable-next-line no-await-in-loop
    out.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return out;
};

// Start clean so removed/renamed files never linger across upgrades.
await Promise.all(['atomic', 'headless', 'bueno'].map((f) => fs.rm(join(dir, f), { recursive: true, force: true })));
ensureDir(atomicDir);

// 1) Copy non-JS data folders (lang, assets, themes) from the npm package.
await Promise.all(
  ['lang', 'assets', 'themes'].map((folder) =>
    fs.cp(join(from, folder), join(atomicDir, folder), {
      recursive: true,
      filter: (src) => !src.endsWith('.map'),
    }),
  ),
);

// 2) Mirror the self-contained atomic JS from the CDN: crawl the transitive closure of chunks
//    starting at atomic.esm.js. Entry chunks are listed by bundle id in the manifest; shared
//    chunks are referenced as explicit ./p-*.js imports.
const CDN_ATOMIC = `${CDN_HOST}/atomic/v${version}/`;
const chunkRe = /p-[0-9a-f]{8}(?:\.entry)?\.js/g; // explicit .js / .entry.js references
const bundleRe = /"(p-[0-9a-f]{8})"/g; // manifest bundle ids -> <id>.entry.js
const seen = new Set();
let frontier = ['atomic.esm.js'];
const atomicTexts = [];

while (frontier.length) {
  const batch = frontier.filter((n) => !seen.has(n));
  batch.forEach((n) => seen.add(n));
  const next = new Set();
  const addRef = (name) => {
    if (!seen.has(name)) next.add(name);
  };
  // eslint-disable-next-line no-await-in-loop
  const results = await mapLimited(batch, 30, async (name) => {
    const text = await fetchText(CDN_ATOMIC + name);
    if (text) await fs.writeFile(join(atomicDir, name), text);
    return text;
  });
  results.filter(Boolean).forEach((text) => {
    atomicTexts.push(text);
    [...text.matchAll(chunkRe)].forEach((m) => addRef(m[0]));
    [...text.matchAll(bundleRe)].forEach((m) => addRef(`${m[1]}.entry.js`));
  });
  frontier = [...next];
}

// 3) Discover every root-absolute Headless/Bueno module the atomic chunks import, mirror each one
//    (single self-contained files — headless only imports bueno, bueno is a leaf), preserving its
//    CDN path under this folder.
const externalRe = /"(\/(?:headless|bueno)\/v[0-9.]+\/[^"]*\.esm\.js)"/g;
const externals = new Set();
atomicTexts.forEach((text) => {
  [...text.matchAll(externalRe)].forEach((m) => externals.add(m[1]));
});
const externalTexts = await mapLimited([...externals], 10, async (path) => {
  const text = await fetchText(CDN_HOST + path);
  if (!text) return null;
  const dest = join(dir, path); // path starts with /headless or /bueno
  ensureDir(dirname(dest));
  await fs.writeFile(dest, text);
  // headless variants pull in bueno via the same absolute scheme — capture those too.
  [...text.matchAll(externalRe)].forEach((m) => externals.add(m[1]));
  return path;
});

// 4) Rewrite the root-absolute /headless and /bueno specifiers in every vendored JS file to the
//    served location. Prefixing is unambiguous: they always appear as `"/headless/…` / `"/bueno/…`.
const rewrite = (text) =>
  text.replace(/"\/headless\//g, `"${SERVE_BASE}/headless/`).replace(/"\/bueno\//g, `"${SERVE_BASE}/bueno/`);

const jsFiles = [
  ...(await fs.readdir(atomicDir)).filter((f) => f.endsWith('.js')).map((f) => join(atomicDir, f)),
  ...[...externals].map((p) => join(dir, p)),
];
await mapLimited(jsFiles, 50, async (file) => {
  if (!existsSync(file)) return null;
  const text = await fs.readFile(file, 'utf8');
  const next = rewrite(text);
  if (next !== text) await fs.writeFile(file, next);
  return file;
});

// eslint-disable-next-line no-console
console.log(
  `Vendored Coveo Atomic v${version}: ${atomicTexts.length} atomic JS files + ${
    externalTexts.filter(Boolean).length
  } headless/bueno modules from CDN + lang/assets/themes from npm.`,
);
