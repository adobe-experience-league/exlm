'use strict';

const path = require('path'),
  processFile = require(path.join(__dirname, 'processFile.js')),
  html = require(path.join(__dirname, 'html.js'));


function metaToList (arg) {
  let result = arg.split(',').map(i => `* ${i.trim()}`).join('\n') + '\n';

  return result;
}

function main (raw = '', lang = '', type = '', admonition = {}, templates = {}, meta = {}) {
  let result,
    heading;
  const skey = `docs-${type}_${lang}.html`;
  if (meta.type === 'Course') {
    result = html(raw, void 0, admonition);
  } else {
    heading = raw.replace(/((.*?)#[\s]+.*?\n)(.*$)/sm, '$1');
    result = templates.get(skey)({
      heading: html(heading, void 0, admonition) || '',
      body: html(raw.replace(heading, ''), void 0, admonition) || '',
      topics: processFile('', metaToList(meta.feature) || '', 'topics', 'topics', lang, templates),
      levels: processFile('', metaToList(meta.level) || '', 'levels', 'levels', lang, templates),
      metadata: meta
    });
  }

  return result;
}

module.exports = main;
