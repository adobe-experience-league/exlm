'use strict';

const path = require('path'),
  fs = require('fs'),
  align = require(path.join(__dirname, 'align.js')),
  html = require(path.join(__dirname, 'html.js')),
  rewrite = require(path.join(__dirname, 'rewrite.js'));

async function menu (dir = '', files = [], toc = '', base = '', lang = '', manifest = '') {
  const ltoc = files.filter(i => i === 'TOC.md')[0];
  let result,
    mresult = manifest instanceof Array ? '' : manifest;

  if (ltoc !== void 0) {
    const data = await fs.promises.readFile(path.join(dir, ltoc), {encoding: 'utf8'}),
      raw = align(rewrite(data.replace(/\(\/help/g, `(/docs/${base}`), lang, 'toc'), 'menu');

    result = html(raw);

    if (manifest.length > 0) {
      mresult = html(manifest);
    }
  } else {
    result = toc;
  }

  return [result, mresult];
}

module.exports = menu;
