'use strict';

const path = require('path'),
  fs = require('fs'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  inject = require(path.join(__dirname, 'inject.js')),
  registry = new Map();

function breadcrumbs (arg = '', lang = '', base = '', name = '', meta = {}) {
  const result = [],
    uri = base.length > 0 ? `/docs/${base}/${arg}` : `/docs/${arg}`,
    bgtitle = meta['breadcrumb-title'] || meta['user-guide-title'] || '',
    bgurl = meta['breadcrumb-url'] || '#';

  let data;

  if (registry.has(lang)) {
    data = registry.get(lang);
  } else {
    try {
      data = fs.readFileSync(path.join(__dirname, '..', 'clone', `landing-pages_${lang}`, 'breadcrumbs.json'), {encoding: 'utf8'});
      data = JSON.parse(data);
      registry.set(lang, data);
    } catch (err) {
      if (lang !== 'en' && registry.has('en')) {
        data = registry.get('en');
      } else {
        try {
          data = fs.readFileSync(path.join(__dirname, '..', 'clone', 'landing-pages_en', 'breadcrumbs.json'), {encoding: 'utf8'});
          data = JSON.parse(data);
          registry.set('en', data);
          registry.set(lang, data);
        } catch (err2) {
          log(`type=error, origin=breadcrumbs, language=en, message="${error(err2)}"`);
          data = null;
        }
      }
    }
  }

  if (arg.length > 0 && uri !== '/docs/home.md') {
    if (data !== null) {
      let x = arg,
        i = -1;

      do {
        if (++i === 0) {
          result.push(`* ${(base.length > 0 ? name || data['crumb-names'][x] : data['crumb-names'][x] || name) || ''}\n`);

          if (bgtitle.length > 0) {
            result.push(`* ${bgtitle}\n   ${bgurl !== '#' ? inject(bgurl, lang) : bgurl}`);
          }

          if (base.length > 0 && base in data['child-repos']) {
            x = data['child-repos'][base];
            result.push(`* ${data['crumb-names'][x]}\n   ${inject(`/docs/${x}`, lang)}`);
          }
        } else {
          result.push(`* ${data['crumb-names'][x]}\n   ${inject(`/docs/${x !== 'home.md' ? x : ''}`, lang)}`);
        }

        x = x in data['parent-pages'] ? data['parent-pages'][x] : x !== 'home.md' ? 'home.md' : null;
      } while (x !== null);
    }
  }

  return result.length > 0 ? result.reverse().join('\n').replace(/\.md/g, '.html') : '';
}

module.exports = breadcrumbs;
