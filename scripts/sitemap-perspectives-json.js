#!/usr/bin/env node
/**
 * Reads a sitemap XML file, keeps only <url> entries whose <loc> path contains
 * `/perspectives/`, and writes JSON: { "<pathname>": "<lastmod>", ... }.
 * Pathname keys are from the URL (no host), locale-neutral: /perspectives/...
 * (leading /{locale}/ is removed when the path is /{locale}/perspectives/...).
 * Date-only lastmod values (YYYY-MM-DD) are normalized to ISO 8601 UTC midnight
 * (e.g. 2024-07-18 → 2024-07-18T00:00:00.000Z) so the instant is explicit.
 *
 * Usage:
 *   node scripts/sitemap-perspectives-json.js <path-to-sitemap.xml> [--out <file.json>]
 *
 * Default output: alongside the input file, named <basename>.perspectives.json
 *
 * Note: `node scripts/fetch-url-to-file.js <sitemap-url> --out ./dir` also writes
 * this JSON next to the downloaded XML.
 */

import fs from 'fs';
import path from 'path';
import {
  parsePerspectivesFromSitemapXml,
  perspectivesJsonPathForXmlFile,
  stringifyPerspectivesJson,
} from './sitemap-perspectives-lib.js';

function parseArgs(argv) {
  /** @type {{ input: string | null, outPath: string | null }} */
  const result = { input: null, outPath: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' || a === '-o') {
      const next = argv[i + 1];
      if (!next) throw new Error('Missing value for --out');
      result.outPath = path.resolve(next);
      i += 1;
    } else if (!result.input && !a.startsWith('-')) {
      result.input = path.resolve(a);
    }
  }
  return result;
}

async function main() {
  let input;
  let outPath;
  try {
    ({ input, outPath } = parseArgs(process.argv));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  if (!input) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: node scripts/sitemap-perspectives-json.js <path-to-sitemap.xml> [--out <file.json>]',
    );
    process.exit(1);
  }

  await fs.promises.access(input, fs.constants.R_OK);

  if (!outPath) {
    outPath = perspectivesJsonPathForXmlFile(input);
  }

  const xml = await fs.promises.readFile(input, 'utf8');
  const { sorted, count } = parsePerspectivesFromSitemapXml(xml);

  await fs.promises.writeFile(outPath, stringifyPerspectivesJson(sorted), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (${count} /perspectives/ URLs from ${path.basename(input)})`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
