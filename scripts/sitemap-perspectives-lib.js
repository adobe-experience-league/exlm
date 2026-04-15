/**
 * Shared logic: extract /perspectives/ URLs from sitemap XML into a sorted JSON object.
 */

import path from 'path';

const PATH_SUBSTRING = '/perspectives/';
const LASTMOD_DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/;

/**
 * Sitemap date-only lastmod has no timezone; normalize to UTC midnight (GMT+0).
 * @param {string} raw
 */
function normalizeLastmodUtc(raw) {
  const s = raw.trim();
  if (LASTMOD_DATE_ONLY.test(s)) {
    return `${s}T00:00:00.000Z`;
  }
  return s;
}

/**
 * Paths like /en/perspectives/foo → /perspectives/foo.
 * @param {string} pathname
 */
function pathnameKeyWithoutLocalePrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[1] === 'perspectives') {
    return `/${parts.slice(1).join('/')}`;
  }
  return pathname;
}

/** @param {string} block */
function parseUrlBlock(block) {
  const locMatch = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/);
  const lastmodMatch = block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/);
  if (!locMatch) return null;
  const loc = locMatch[1].trim();
  if (!loc.includes(PATH_SUBSTRING)) return null;
  if (!lastmodMatch) return null;
  let urlObj;
  try {
    urlObj = new URL(loc);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(urlObj.protocol)) return null;
  const rawPath = urlObj.pathname || '/';
  const pathname = pathnameKeyWithoutLocalePrefix(rawPath);
  const lastmod = normalizeLastmodUtc(lastmodMatch[1]);
  return { pathname, lastmod };
}

/**
 * @param {string} xml
 * @returns {{ sorted: Record<string, string>, count: number }}
 */
export function parsePerspectivesFromSitemapXml(xml) {
  /** @type {Record<string, string>} */
  const out = {};
  const urlBlockRe = /<url[^>]*>[\s\S]*?<\/url>/gi;
  const blocks = xml.match(urlBlockRe);
  if (blocks) {
    blocks.forEach((block) => {
      const parsed = parseUrlBlock(block);
      if (parsed) {
        const { pathname, lastmod } = parsed;
        out[pathname] = lastmod;
      }
    });
  }

  const sortedKeys = Object.keys(out).sort();
  const sorted = /** @type {Record<string, string>} */ ({});
  sortedKeys.forEach((k) => {
    sorted[k] = out[k];
  });

  return { sorted, count: sortedKeys.length };
}

/**
 * @param {Record<string, string>} sorted
 */
export function stringifyPerspectivesJson(sorted) {
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

/**
 * Default JSON path next to an XML file: foo.xml → foo.perspectives.json
 * @param {string} xmlFilePath
 */
export function perspectivesJsonPathForXmlFile(xmlFilePath) {
  const base = path.basename(xmlFilePath, path.extname(xmlFilePath));
  return path.join(path.dirname(xmlFilePath), `${base}.perspectives.json`);
}
