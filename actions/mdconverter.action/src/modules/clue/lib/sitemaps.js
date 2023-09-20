'use stirct';

const path = require('path'),
  keysort = require('keysort'),
  config = require(path.join(__dirname, '..', 'configs', 'config.json')),
  sitemap = require(path.join(__dirname, 'sitemap.js')),
  sitemapsSolutions = process.env.CL_SITEMAPS_SOLUTIONS === void 0 ? config.sitemapsSolutions : [...JSON.parse(process.env.CL_SITEMAPS_SOLUTIONS), ...config.sitemapsSolutions];

// the empty array in config.sitemapsSolutions is what triggers the build of sitemaps for all languages
// CL_SITEMAPS_SOLUTIONS triggers additional solution specific sitemaps.

async function sitemaps (store = {}, filtersKeys = [], configFilters = {}) {
  for (const [cfilename, cfiles] of sitemapsSolutions) {
    const pred = cfiles.length > 0 ? {Markdown: true, File: cfiles} : {Markdown: true},
      filename = cfilename.length > 0 ? `sitemap-${cfilename}` : 'sitemap',
      filter = new Function('i', `return ${filtersKeys.filter(i => (/Archived|Hide|Hold/).test(i) === false).reduce((a, v) => `${a}i.${v} === ${configFilters[v]} && `, '')}i.Archived !== true && i.Hide !== true && i.Hold !== true && 'Full Meta' in i && (/index\\: ('|")?(y|True|true)('|")?/).test(i['Full Meta']);`),
      recs = keysort(store.find(pred, true).filter(filter), 'URL');

    await sitemap(recs, config.sitemaps, false, filename);
    await sitemap(recs, config.sitemaps, true, filename);
  }
}

module.exports = sitemaps;
