'use strict';

const path = require('path'),
  escape = require(path.join(__dirname, 'escape.js')),
  inject = require(path.join(__dirname, 'inject.js')),
  struct = require(path.join(__dirname, 'struct.js'));

function link (arg = '', lang = 'en', manifest = false, strip = false, puri = '') {
  let result;

  if (manifest && (/^(\+|\*)/).test(arg)) {
    result = `+ <div class="section">${arg.replace(/^(\+|\*)\s/, '')}</div>`;
  } else {
    const uri = arg.replace(/(^.*\(|=?")|(\)|"$)/g, '');
    let luri = uri;

    if ((/^(\/|https:\/\/experienceleague(\.corp)?\.adobe\.com\/|[^\/http(s)?:\/\/]+)/).test(luri) && luri.includes('.md')) {
      luri = luri.replace('.md', '.html');
    }

    result = arg.replace(uri, inject(luri, lang, strip, puri));
  }

  return result;
}

function rewrite (arg = '', lang = '', type = 'main', base = '', strip = true, uri = '') {
  let result;

  if (type === 'main' || type === 'landing') {
    result = struct(arg).body;

    if (type === 'main') {
      result = result.replace(/(\(|"|')\/help\//g, `$1/docs/${base}/`);
    } else {
      (result.match(/(?<=\]\().*(?=\))/g) || []).filter(i => (/^[^(h|\/)]/).test(i)).forEach(i => {
        result = result.replace(i, `/docs/${i}`);
      });
    }

    const rn = arg.includes('\r\n'),
      ttmp = result.split(/(?<!`)`{3,3}(?!`)/g).filter((i, idx) => idx % 2 === 0).join(rn ? '\r\n' : '\n'),
      sskip = ttmp.match(/`[^`\n]+`/g) || [],
      tmp = sskip.reduce((a, v) => a.replace(v, ''), ttmp),
      urls = tmp.match(/(="|\()(http|\.\.\/|\/)[^\[\)"]+("|\))/g) || [];

    urls.forEach(i => {
      const n = link(i, lang, false, strip, uri);

      if (i !== n) {
        result = result.replace(new RegExp(escape(i), 'g'), n);
      }
    });
  } else if (type === 'toc' || type === 'manifest') {
    const manifest = type === 'manifest',
      lines = arg.replace(/^\#.*\n\n/, '').trim().replace(/\s*\n/g, '\n').replace(/(\*|\+)\s(.*)\s{(#.*)}/g, '$1 [$2]($3)').replace(/\(\/(.*)\.md\)/g, '(/$1.html)').split('\n'),
      first = lines[0] || '';

    if (manifest === false && first.length === 0 || first.charAt(0) === '#') {
      lines.splice(0, 1);

      if ((lines[0] || '').length === 0) {
        lines.splice(0, 1);
      }
    }

    result = lines.map(l => link(l, lang, manifest, strip)).join('\n');
  }

  return result;
}

module.exports = rewrite;
