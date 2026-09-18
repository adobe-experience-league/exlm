import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mapLimit } from './paths.mjs';

const DEFAULT_MAX_BYTES = 52_428_800;
const USER_AGENT = 'exlm-page-performance-demo/1.0';

function decodeXml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export function sitemapKind(xml) {
  if (/<sitemapindex[\s>]/i.test(xml)) return 'index';
  if (/<urlset[\s>]/i.test(xml)) return 'urlset';
  throw new Error('Document is not a sitemap urlset or sitemap index');
}

export function extractLocs(xml, kind) {
  const tag = kind === 'index' ? 'sitemap' : 'url';
  const blockRe = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const locs = [];
  let block;
  while ((block = blockRe.exec(xml))) {
    const loc = block[1].match(/<loc>\s*([^<]+)\s*<\/loc>/i);
    if (loc) locs.push(decodeXml(loc[1].trim()));
  }
  return locs;
}

export function resolveChild(parent, loc) {
  if (/^https?:\/\//i.test(loc) || loc.startsWith('file:')) return loc;
  if (/^https?:\/\//i.test(parent) || parent.startsWith('file:')) {
    return new URL(loc, parent).toString();
  }
  return resolve(dirname(parent), loc);
}

export function matchesFilters(value, include = [], exclude = []) {
  const includeRe = include.map((p) => new RegExp(p));
  const excludeRe = exclude.map((p) => new RegExp(p));
  if (includeRe.length && !includeRe.some((re) => re.test(value))) return false;
  if (excludeRe.some((re) => re.test(value))) return false;
  return true;
}

function assertAllowedHost(source, allowedHosts) {
  if (!/^https?:\/\//i.test(source)) return;
  if (!Array.isArray(allowedHosts) || allowedHosts.length === 0) return;
  const host = new URL(source).hostname;
  if (!allowedHosts.includes(host)) {
    throw new Error(`Host ${host} is not in allowedHosts`);
  }
}

async function readCapped(res, maxBytes, href) {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`Sitemap exceeds ${maxBytes} bytes: ${href}`);
  }
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error(`Sitemap exceeds ${maxBytes} bytes: ${href}`);
    return buf.toString('utf8');
  }
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error(`Sitemap exceeds ${maxBytes} bytes: ${href}`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function loadXml(source, { timeoutMs, maxBytes, allowedHosts }) {
  assertAllowedHost(source, allowedHosts);
  if (!/^https?:\/\//i.test(source) && !source.startsWith('file:')) {
    const xml = await readFile(source, 'utf8');
    if (Buffer.byteLength(xml, 'utf8') > maxBytes) {
      throw new Error(`Sitemap exceeds ${maxBytes} bytes: ${source}`);
    }
    return xml;
  }

  const href = source;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml,text/xml,*/*' },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${href}: HTTP ${res.status}`);
    if (res.url) assertAllowedHost(res.url, allowedHosts);
    return await readCapped(res, maxBytes, href);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Timed out fetching sitemap ${href} after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function collectFrom(source, options, pageSeen, docSeen) {
  if (docSeen.has(source)) return [];
  docSeen.add(source);
  const xml = await loadXml(source, options);
  const kind = sitemapKind(xml);
  if (kind === 'index') {
    const children = extractLocs(xml, 'index')
      .map((loc) => resolveChild(source, loc))
      .filter((child) => {
        if (/^https?:\/\//i.test(source) && (child.startsWith('file:') || child.startsWith('/'))) {
          return false;
        }
        return matchesFilters(child, options.include, options.exclude);
      });
    const nested = await mapLimit(children, options.sitemapConcurrency, (child) =>
      collectFrom(child, options, pageSeen, docSeen),
    );
    return nested.flat();
  }

  const urls = [];
  for (const loc of extractLocs(xml, 'urlset')) {
    if (!pageSeen.has(loc)) {
      pageSeen.add(loc);
      urls.push(loc);
    }
  }
  return urls;
}

export async function collectSitemapUrls(source, options = {}) {
  const timeoutMs = options.fetchTimeoutMs ?? 30_000;
  const maxBytes = options.maxSitemapBytes ?? DEFAULT_MAX_BYTES;
  const sitemapConcurrency = options.sitemapConcurrency ?? 4;
  const resolved = /^https?:\/\//i.test(source) || source.startsWith('file:') ? source : resolve(source);
  return collectFrom(
    resolved,
    {
      timeoutMs,
      maxBytes,
      sitemapConcurrency,
      include: options.include || [],
      exclude: options.exclude || [],
      allowedHosts: options.allowedHosts || [],
    },
    new Set(),
    new Set(),
  );
}

export function toFileUrl(path) {
  return pathToFileURL(path).toString();
}
