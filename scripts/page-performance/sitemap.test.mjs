import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { collectSitemapUrls } from './sitemap.mjs';

const URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://demo.example/en/home</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="https://demo.example/fr/home"/>
  </url>
  <url>
    <loc>https://demo.example/en/docs</loc>
  </url>
</urlset>
`;

describe('collectSitemapUrls', () => {
  let dir;

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('reads urlset loc tags and ignores hreflang alternates', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sm-'));
    const path = join(dir, 'sitemap.xml');
    await writeFile(path, URLSET);
    const urls = await collectSitemapUrls(path);
    assert.deepEqual(urls, ['https://demo.example/en/home', 'https://demo.example/en/docs']);
  });

  it('follows a sitemap index and resolves relative child paths', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sm-'));
    await mkdir(join(dir, 'sitemaps'));
    await writeFile(join(dir, 'sitemaps', 'home.xml'), URLSET);
    await writeFile(
      join(dir, 'sitemap-index.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>./sitemaps/home.xml</loc>
  </sitemap>
</sitemapindex>
`,
    );
    const urls = await collectSitemapUrls(join(dir, 'sitemap-index.xml'));
    assert.equal(urls.length, 2);
    assert.ok(urls.includes('https://demo.example/en/home'));
  });

  it('skips child sitemaps that miss include before fetching them', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sm-'));
    await mkdir(join(dir, 'sitemaps'));
    await writeFile(join(dir, 'sitemaps', 'en.xml'), URLSET);
    await writeFile(
      join(dir, 'sitemaps', 'fr.xml'),
      `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://demo.example/fr/home</loc></url></urlset>`,
    );
    await writeFile(
      join(dir, 'sitemap-index.xml'),
      `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>./sitemaps/en.xml</loc></sitemap>
  <sitemap><loc>./sitemaps/fr.xml</loc></sitemap>
</sitemapindex>
`,
    );
    const urls = await collectSitemapUrls(join(dir, 'sitemap-index.xml'), {
      include: ['/sitemaps/en\\.xml$'],
    });
    assert.deepEqual(urls, ['https://demo.example/en/home', 'https://demo.example/en/docs']);
  });

  it('does not recurse forever on a cyclic sitemap index', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sm-'));
    const index = join(dir, 'sitemap-index.xml');
    await writeFile(
      index,
      `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>./sitemap-index.xml</loc></sitemap>
</sitemapindex>
`,
    );
    const urls = await collectSitemapUrls(index);
    assert.deepEqual(urls, []);
  });

  it('dedupes repeated loc values', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sm-'));
    const path = join(dir, 'sitemap.xml');
    await writeFile(
      path,
      `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://demo.example/a</loc></url>
  <url><loc>https://demo.example/a</loc></url>
</urlset>
`,
    );
    const urls = await collectSitemapUrls(path);
    assert.deepEqual(urls, ['https://demo.example/a']);
  });
});
