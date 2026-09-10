import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function repoRootFrom(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), '../..');
}

export function resolveSitemapSource(sitemapUrl, root) {
  if (/^https?:\/\//i.test(sitemapUrl) || sitemapUrl.startsWith('file:')) return sitemapUrl;
  return resolve(root, sitemapUrl);
}

export async function mapLimit(items, limit, fn) {
  if (!items.length) return [];
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export function isMainModule(metaUrl, argv1) {
  if (!argv1) return false;
  return resolve(argv1) === fileURLToPath(metaUrl);
}

export function reportSlug(url, formFactor) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 12);
  return `${formFactor}-${hash}`;
}

export function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
