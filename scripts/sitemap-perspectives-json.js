#!/usr/bin/env node
/**
 * Reads a sitemap XML file, keeps only <url> entries whose <loc> path contains
 * `/perspectives/`, and writes JSON: { "<pathname>": "<lastmod>", ... }.
 * Pathname keys are from the URL (no host), locale-neutral: /perspectives/...
 * (leading /{locale}/ is removed when the path is /{locale}/perspectives/...).
 *
 * By default, timestamps come from each page’s `<meta name="last-update">` (HTTPS GET
 * of the sitemap `<loc>` URL). Pass `--sitemap-lastmod-only` to use `<lastmod>` only
 * (no fetches). Date-only sitemap lastmod values are normalized to ISO 8601 UTC midnight
 * when that mode is used.
 *
 * Usage:
 *   node scripts/sitemap-perspectives-json.js <path-to-sitemap.xml> [--out <file.json>] [--sitemap-lastmod-only]
 *
 * Default output: alongside the input file, named <basename>.perspectives.json
 *
 * Note: `node scripts/fetch-url-to-file.js <sitemap-url> --out ./dir` also writes
 * this JSON next to the downloaded XML.
 */

import fs from 'fs';
import path from 'path';
import {
  hydratePerspectivesLastUpdateFromPages,
  parsePerspectivesFromSitemapXml,
  parsePerspectivesItemsFromSitemapXml,
  perspectivesJsonPathForXmlFile,
  sortedRecordFromHydratedItems,
  stringifyPerspectivesJson,
} from './sitemap-perspectives-lib.js';

function parseArgs(argv) {
  /** @type {{ input: string | null, outPath: string | null, sitemapLastmodOnly: boolean }} */
  const result = { input: null, outPath: null, sitemapLastmodOnly: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' || a === '-o') {
      const next = argv[i + 1];
      if (!next) throw new Error('Missing value for --out');
      result.outPath = path.resolve(next);
      i += 1;
    } else if (a === '--sitemap-lastmod-only') {
      result.sitemapLastmodOnly = true;
    } else if (!result.input && !a.startsWith('-')) {
      result.input = path.resolve(a);
    }
  }
  return result;
}

async function main() {
  let input;
  let outPath;
  let sitemapLastmodOnly;
  try {
    ({ input, outPath, sitemapLastmodOnly } = parseArgs(process.argv));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  if (!input) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: node scripts/sitemap-perspectives-json.js <path-to-sitemap.xml> [--out <file.json>] [--sitemap-lastmod-only]',
    );
    process.exit(1);
  }

  await fs.promises.access(input, fs.constants.R_OK);

  if (!outPath) {
    outPath = perspectivesJsonPathForXmlFile(input);
  }

  const xml = await fs.promises.readFile(input, 'utf8');

  let sorted;
  let count;
  if (sitemapLastmodOnly) {
    ({ sorted, count } = parsePerspectivesFromSitemapXml(xml));
  } else {
    const items = parsePerspectivesItemsFromSitemapXml(xml);
    count = items.length;
    // eslint-disable-next-line no-console
    console.log(`Fetching last-update meta for ${count} /perspectives/ URLs…`);
    const hydrated = await hydratePerspectivesLastUpdateFromPages(items);
    sorted = sortedRecordFromHydratedItems(hydrated);
  }

  await fs.promises.writeFile(outPath, stringifyPerspectivesJson(sorted), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (${count} /perspectives/ URLs from ${path.basename(input)})`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
