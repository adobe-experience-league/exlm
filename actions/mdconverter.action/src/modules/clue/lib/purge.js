'use strict';

const path = require('path'),
  coerce = require('tiny-coerce'),
  {filters} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  error = require(path.join(__dirname, 'error.js')),
  language = require(path.join(__dirname, 'language.js')),
  log = require(path.join(__dirname, 'log.js')),
  readdir = require(path.join(__dirname, 'readdir.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  fpPath = path.join(__dirname, '..', 'docs'),
  configFilters = 'CL_FILTERS' in process.env ? JSON.parse(process.env.CL_FILTERS) || {} : filters,
  filtersKeys = Object.keys(configFilters).filter(i => i !== 'Hold'),
  nth = filtersKeys.length;

filtersKeys.forEach(i => {
  configFilters[i] = coerce(configFilters[i]);
});

async function purge (store = {}) {
  const valid = Array.from(store.indexes.get('File').keys()).sort().map(i => {
      const rec = store.find({File: i}, true)[0],
        good = nth === 0 || filtersKeys.filter(f => rec[f] === configFilters[f]).length === nth,
        x = good ? i.split('.') : void 0;

      return good ? `${x[0]}_${language(x[1])}` : '';
    }).filter(i => i.length > 0),
    items = await readdir(fpPath, void 0, 'isDirectory'),
    invalid = items.filter(i => (/\d+$/).test(i) === false && valid.includes(i) === false);

  if (invalid.length > 0) {
    try {
      await shell('rm', `-rf ${invalid.join(' && rm -rf ')}`.split(' '), fpPath);
      log(`type=purge, total=${invalid.length}, message="Erased stale directories"`);
    } catch (err) {
      log(`type=error, origin=purge, total=${invalid.length}, message="${error(err)}"`);
    }
  } else {
    log('type=purge, total=0, message="No directories erased"');
  }

  return invalid;
}

module.exports = purge;
