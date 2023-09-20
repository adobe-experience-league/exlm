'use strict';

const path = require('path'),
  {lastItem} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  html = require(path.join(__dirname, 'html.js')),
  inject = require(path.join(__dirname, 'inject.js')),
  rewrite = require(path.join(__dirname, 'rewrite.js'));

function processFile (title, arg = '', type = '', section = '', lang = '', templates = new Map(), tier = '') {
  let result;

  if (type.length > 0) {
    const key = `docs-${type}_${lang}.html`,
      skey = `docs-${type.replace(/s$/, '')}_${lang}.html`,
      data = {
        type: section,
        tier,
        title: html(title),
        items: []
      };

    if (arg.length > 0) {
      const tmp = arg.split(/(?<=\n)\*/g),
        nth = tmp.length - 1;

      data.items = tmp.map((i, idx) => {
        let [ltitle, ltext] = i.split('\n'),
          lresult = '';

        if (type === 'tiles') {
          lresult = templates.get(skey)({
            title: ltitle.replace(/^.*\[|\].*$/g, ''),
            text: (ltext || '').length > 0 ? html(rewrite(ltext.trim().replace(/^\*\s/, ''), lang, 'landing')) : '',
            type: title.replace(/^##\s/g, ''),
            url: inject(ltitle.replace(/.*\(|\)$/g, ''), lang),
            last: tier === 'landing' && idx === nth && lastItem.includes(section)
          });
        } else if (type === 'lists') {
          lresult = templates.get(skey)({
            title: (ltitle || '').length > 0 ? html(rewrite(ltitle.trim().replace(/^\*\s/, ''), lang, 'landing')) : '',
            text: (ltext || '').length > 0 ? html(rewrite(ltext.trim().replace(/^\*\s/, ''), lang, 'landing')) : ''
          });
        } else if (type === 'breadcrumbs') {
          const lurl = (ltext || '').length > 0 ? rewrite(ltext.trim().replace(/^\*\s/, ''), lang, 'landing') : '';

          lresult = templates.get(skey)({
            text: (ltitle || '').length > 0 ? ltitle.trim().replace(/^\*\s/, '') : '',
            url: lurl
          });

          if (lurl.length === 0) {
            lresult = lresult.replace(' href=""', '').replace('<a', '<span').replace('</a', '</span').split('\n')[0];
          }
        } else if (type === 'topics') {
          const ltopic = ltitle.trim().replace(/^\*\s/, '');
          lresult = templates.get(skey)({
            topic: ltopic || '',
            url: '#'
          });
        } else if (type === 'levels') {
          const llevel = ltitle.trim().replace(/^\*\s/, '');
          lresult = templates.get(skey)({
            level: llevel || ''
          });
        }

        return lresult;
      }).map(i => i.trim()).join('\n');
    }

    result = templates.get(key)(data);
  } else {
    result = `<div class="passthru ${tier}">${html(rewrite(arg.trim().replace(/^\*\s/, ''), lang, 'landing'))}</div>`;
  }

  return result.length > 0 ? `${result}\n` : result;
}

module.exports = processFile;
