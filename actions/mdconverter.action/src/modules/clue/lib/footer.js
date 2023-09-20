'use strict';

const path = require('path'),
  {decode} = require('csv.js'),
  log = require(path.join(__dirname, 'log.js')),
  error = require(path.join(__dirname, 'error.js')),
  readfile = require(path.join(__dirname, 'readfile.js')),
  registry = new Map();

function footer (arg = '') {
  const links = registry.get(arg) || [];
  let result;

  if (links.length > 0) {
    result = links.map(i => `<a href="${i.url}" target="_blank">${i.label}</a>`).join('\n');
  }

  return result || '';
}

(async function () {
  try {
    const raw = await readfile(path.join(__dirname, '..', 'footer', 'data.csv')),
      data = decode(raw.replace(/\r/g, ''));

    for (const link of data) {
      const doc = `/docs${link['Docs URL'].replace(/.*\/help\/en/g, '')}`;

      if (registry.has(doc) === false) {
        registry.set(doc, []);
      }

      registry.get(doc).push({
        label: link.Keyword,
        url: link['Keyword URL']
      });
    }
  } catch (err) {
    log(`type=error, origin=footer, message="${error(err)}"`);
  }
}());

module.exports = footer;
