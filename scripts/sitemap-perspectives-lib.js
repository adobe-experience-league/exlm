/**
 * Shared logic: extract /perspectives/ URLs from sitemap XML into a sorted JSON object.
 * By default, timestamps are read from each page’s `<meta name="last-update">` via HTTPS
 * (see hydratePerspectivesLastUpdateFromPages). Use sitemap `<lastmod>` only when skipping
 * hydration (e.g. --sitemap-lastmod-only).
 */

import path from 'path';

const PATH_SUBSTRING = '/perspectives/';
const LASTMOD_DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/;

const DEFAULT_FETCH_USER_AGENT = 'exlm-sitemap-perspectives/1.0 (+https://github.com/adobe-experience-league/exlm)';

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
 * Coerce meta last-update strings (ISO, JS Date strings with optional trailing parenthetical, etc.) to UTC ISO-8601.
 * @param {string} raw
 * @returns {string | null} null if not parseable as a date
 */
export function normalizeLastUpdateToIsoUtc(raw) {
  const trimmed = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
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
  const pageUrl = locMatch[1].trim();
  if (!pageUrl.includes(PATH_SUBSTRING)) return null;
  if (!lastmodMatch) return null;
  let urlObj;
  try {
    urlObj = new URL(pageUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(urlObj.protocol)) return null;
  const rawPath = urlObj.pathname || '/';
  const pathname = pathnameKeyWithoutLocalePrefix(rawPath);
  const sitemapLastmod = normalizeLastmodUtc(lastmodMatch[1]);
  return { pathname, pageUrl, sitemapLastmod };
}

/**
 * Raw HTML from GET <loc>; same content as “view source” for static head metadata.
 * @param {string} html
 * @returns {string | null}
 */
export function extractLastUpdateMetaFromHtml(html) {
  const nameFirst = html.match(/<meta\s[^>]*\bname=["']last-update["'][^>]*\bcontent=["']([^"']*)["']/i);
  if (nameFirst?.[1] != null) return nameFirst[1].trim() || null;
  const contentFirst = html.match(/<meta\s[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']last-update["']/i);
  if (contentFirst?.[1] != null) return contentFirst[1].trim() || null;
  return null;
}

/**
 * @param {string} xml
 * @returns {Array<{ pathname: string, pageUrl: string, sitemapLastmod: string }>}
 */
export function parsePerspectivesItemsFromSitemapXml(xml) {
  /** @type {Record<string, { pageUrl: string, sitemapLastmod: string }>} */
  const byPath = {};
  const urlBlockRe = /<url[^>]*>[\s\S]*?<\/url>/gi;
  const blocks = xml.match(urlBlockRe);
  if (blocks) {
    blocks.forEach((block) => {
      const parsed = parseUrlBlock(block);
      if (parsed) {
        byPath[parsed.pathname] = { pageUrl: parsed.pageUrl, sitemapLastmod: parsed.sitemapLastmod };
      }
    });
  }
  return Object.entries(byPath).map(([pathname, v]) => ({
    pathname,
    pageUrl: v.pageUrl,
    sitemapLastmod: v.sitemapLastmod,
  }));
}

/**
 * @param {Array<{ pathname: string, lastmod: string }>} items
 * @returns {Record<string, string>}
 */
export function sortedRecordFromPathnameLastmod(items) {
  /** @type {Record<string, string>} */
  const out = {};
  items.forEach(({ pathname, lastmod }) => {
    out[pathname] = lastmod;
  });
  const sortedKeys = Object.keys(out).sort();
  const sorted = /** @type {Record<string, string>} */ ({});
  sortedKeys.forEach((k) => {
    sorted[k] = out[k];
  });
  return sorted;
}

/**
 * @typedef {{ pathname: string, pageUrl: string, sitemapLastmod: string }} PerspectiveSitemapItem
 * @typedef {{ pathname: string, pageUrl: string, sitemapLastmod: string, lastmod: string }} HydratedPerspectiveItem
 */

/**
 * Fetch each perspective page and prefer `<meta name="last-update">`; fall back to sitemap lastmod.
 * @param {PerspectiveSitemapItem[]} items
 * @param {{ concurrency?: number, userAgent?: string }} [options]
 * @returns {Promise<HydratedPerspectiveItem[]>}
 */
export async function hydratePerspectivesLastUpdateFromPages(items, options = {}) {
  const concurrency = Math.max(1, options.concurrency ?? 6);
  const userAgent = options.userAgent ?? DEFAULT_FETCH_USER_AGENT;

  /** @type {HydratedPerspectiveItem[]} */
  const hydrated = [];

  /**
   * @param {PerspectiveSitemapItem} item
   * @returns {Promise<HydratedPerspectiveItem>}
   */
  async function fetchOne(item) {
    try {
      const res = await fetch(item.pageUrl, {
        redirect: 'follow',
        headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'User-Agent': userAgent },
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn(`[perspectives] ${item.pathname}: HTTP ${res.status} (using sitemap lastmod)`);
        return { ...item, lastmod: item.sitemapLastmod };
      }
      const html = await res.text();
      const raw = extractLastUpdateMetaFromHtml(html);
      if (raw == null) {
        // eslint-disable-next-line no-console
        console.warn(`[perspectives] ${item.pathname}: missing meta last-update (using sitemap lastmod)`);
        return { ...item, lastmod: item.sitemapLastmod };
      }
      const iso = normalizeLastUpdateToIsoUtc(raw);
      if (iso == null) {
        // eslint-disable-next-line no-console
        console.warn(`[perspectives] ${item.pathname}: invalid last-update "${raw}" (using sitemap lastmod)`);
        return { ...item, lastmod: item.sitemapLastmod };
      }
      return { ...item, lastmod: iso };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`[perspectives] ${item.pathname}: ${msg} (using sitemap lastmod)`);
      return { ...item, lastmod: item.sitemapLastmod };
    }
  }

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    // eslint-disable-next-line no-await-in-loop -- batched concurrency cap
    const done = await Promise.all(batch.map((item) => fetchOne(item)));
    hydrated.push(...done);
  }

  return hydrated;
}

/**
 * Build sorted JSON map pathname → lastmod (from hydrated items).
 * @param {HydratedPerspectiveItem[]} items
 */
export function sortedRecordFromHydratedItems(items) {
  return sortedRecordFromPathnameLastmod(items.map(({ pathname, lastmod }) => ({ pathname, lastmod })));
}

/**
 * @param {string} xml
 * @returns {{ sorted: Record<string, string>, count: number }}
 */
export function parsePerspectivesFromSitemapXml(xml) {
  const items = parsePerspectivesItemsFromSitemapXml(xml);
  const sorted = sortedRecordFromPathnameLastmod(
    items.map(({ pathname, sitemapLastmod }) => ({ pathname, lastmod: sitemapLastmod })),
  );
  return { sorted, count: items.length };
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
