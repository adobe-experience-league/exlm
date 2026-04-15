#!/usr/bin/env node
/**
 * Fetches a URL (e.g. sitemap XML) and writes the response body to a file
 * derived from the hostname and path. For sitemap XML, also writes a
 * `{basename}.perspectives.json` next to the XML (see sitemap-perspectives-lib.js).
 *
 * Usage:
 *   node scripts/fetch-url-to-file.js <url> [--out <directory>] [--no-perspectives-json]
 *
 * Example:
 *   node scripts/fetch-url-to-file.js https://experienceleague.adobe.com/en/sitemap.xml --out ./downloads
 */

import fs from 'fs/promises';
import path from 'path';
import {
  parsePerspectivesFromSitemapXml,
  perspectivesJsonPathForXmlFile,
  stringifyPerspectivesJson,
} from './sitemap-perspectives-lib.js';

/** @param {string} urlString */
function urlToFilename(urlString) {
  const u = new URL(urlString);
  const host = u.hostname.replace(/\./g, '_');
  const pathPart =
    u.pathname === '/' || u.pathname === '' ? '' : u.pathname.replace(/^\//, '').replace(/\//g, '_').replace(/_+$/, '');
  let slug = pathPart ? `${host}_${pathPart}` : host;
  slug = slug.replace(/[<>:"|?*\\]/g, '_');
  const pathLast = pathPart ? pathPart.split('_').pop() || '' : '';
  const hasFileExtension = /\.[a-zA-Z0-9]{2,8}$/.test(pathLast);
  if (!hasFileExtension) {
    slug += '.xml';
  }
  return slug;
}

function parseArgs(argv) {
  /** @type {{ url: string | null, outDir: string, perspectivesJson: boolean }} */
  const result = { url: null, outDir: process.cwd(), perspectivesJson: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' || a === '-o') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --out');
      }
      result.outDir = path.resolve(next);
      i += 1;
    } else if (a === '--no-perspectives-json') {
      result.perspectivesJson = false;
    } else if (!result.url && !a.startsWith('-')) {
      result.url = a;
    }
  }
  return result;
}

async function main() {
  const { url, outDir, perspectivesJson } = parseArgs(process.argv);
  if (!url) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: node scripts/fetch-url-to-file.js <url> [--out <directory>] [--no-perspectives-json]',
    );
    process.exit(1);
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    // eslint-disable-next-line no-console
    console.error('Invalid URL:', url);
    process.exit(1);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    // eslint-disable-next-line no-console
    console.error('Only http(s) URLs are supported.');
    process.exit(1);
  }

  const res = await fetch(parsed.href, {
    redirect: 'follow',
    headers: { Accept: 'application/xml, text/xml, */*' },
  });

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const body = await res.text();
  const filename = urlToFilename(parsed.href);
  const outPath = path.join(outDir, filename);

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, body, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (${body.length} characters)`);

  if (perspectivesJson) {
    const { sorted, count } = parsePerspectivesFromSitemapXml(body);
    const jsonPath = perspectivesJsonPathForXmlFile(outPath);
    await fs.writeFile(jsonPath, stringifyPerspectivesJson(sorted), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Wrote ${jsonPath} (${count} /perspectives/ URLs)`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
