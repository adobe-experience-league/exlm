'use strict';

const path = require('path'),
  {promises: fs} = require('fs'),
  keysort = require('keysort'),
  {files, sort} = require(path.join(__dirname, '..', 'configs', 'stores.json')),
  log = require(path.join(__dirname, 'log.js')),
  mongo = require(path.join(__dirname, 'mongo.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  sanitize = require(path.join(__dirname, 'sanitize.js')),
  fpRoot = path.join(__dirname, '..', 'data');

async function write (data) {
  const exceptions = ['markdown-sources'];
  log('type=buffer, message="Writing Mongo data to data folder"');
  await shell('rm -rf data/*');

  return Promise.all(Array.from(data.keys()).map(i => {
    const filename = `${i.replace(/_/g, '-')}.json`;
    const value = JSON.stringify(keysort(data.get(i).map(f => exceptions.includes(i) ? f : sanitize(f, true)), sort), null, 0);
    log(`type=buffer, file=${filename}, length=${value.length}, message="Writing JSON data to disk"`);

    return fs.writeFile(path.join(fpRoot, filename), value, 'utf8');
  }));
}

async function init (stores) {
  const map = new Map();

  for (const store of Object.keys(stores)) {
    const recs = await mongo(`${store}_en`, 'get', void 0, void 0, 0, false, void 0, {}, void 0);

    map.set(store, recs);
  }

  return map;
}

module.exports = init(files)
  .then(data => write(data))
  .catch(err => {
    console.error(err.stack || err.message || err);
    process.exit(1);
  });
