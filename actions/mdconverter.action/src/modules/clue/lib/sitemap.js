'use strict';

const path = require('path'),
  fs = require('fs').promises,
  keysort = require('keysort'),
  error = require(path.join(__dirname, 'error.js')),
  meta = require(path.join(__dirname, 'meta.js')),
  {languages} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  log = require(path.join(__dirname, 'log.js')),
  fpPath = path.join(__dirname, '..', 'docs'),
  domain = 'https://experienceleague.adobe.com';

async function sitemap (args, create = true, xml = false, filename = 'sitemap') {
  const results = [],
    fp = path.join(fpPath, `${filename}-lang.txt`);

  if (xml === false) {
    for (const lang of languages) {
      const fn = fp.replace('lang', lang),
        result = args.map(i => `${i.URL.startsWith(domain) ? i.URL : `${domain}${i.URL}`}${encodeURIComponent(`?lang=${lang}`)}`).sort().join('\n');

      results.push({filename: fn, sitemap: result, xml});

      if (create) {
        try {
          await fs.writeFile(fn, `${result}\n`, {encoding: 'utf8'});
          log(`type=sitemap, created=true, file=${fn}`);
        } catch (err) {
          log(`type=error, origin=sitemap, created=false, file=${fn}, message="${error(err)}"`);
        }
      }
    }
  } else {
    for (const lang of languages) {
      const fn = fp.replace('lang', lang).replace('.txt', '.xml'),
        result = keysort(args.map(i => {
          const url = new URL(`${i.URL.startsWith(domain) ? i.URL : `${domain}${i.URL}`}`);

          url.searchParams.set('lang', lang);
          i.full_url = url.href;

          return i;
        }), 'full_url').map(i => {
          const lmeta = meta(i['Full Meta'] || '', i.Solution, lang, true, true),
            date = new Date(i['Updated UTC'] || i['Added UTC']),
            month = (date.getMonth() + 1).toString().padStart(2, '0'),
            day = date.getDate().toString().padStart(2, '0');

          return `  <url>
    <loc>${i.full_url}</loc>
    <lastmod>${lmeta['last-update'] || `${date.getFullYear()}-${month}-${day}`}</lastmod>
    <changefreq>${lmeta.changefreq || 'weekly'}</changefreq>
    <priority>${lmeta.priority || '0.8'}</priority>
  </url>`;
        }).join('\n');

      results.push({filename: fn, sitemap: result, xml});

      if (create) {
        const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${result}
</urlset>
`;

        try {
          await fs.writeFile(fn, output, {encoding: 'utf8'});
          log(`type=sitemap, created=true, file=${fn}`);
        } catch (err) {
          log(`type=error, origin=sitemap, created=false, file=${fn}, message="${error(err)}"`);
        }
      }
    }
  }

  return results;
}

module.exports = sitemap;
