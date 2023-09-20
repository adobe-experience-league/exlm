'use strict';

const path = require('path'),
  {writeFile} = require('fs').promises,
  clone = require(path.join(__dirname, 'clone.js')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  config = require(path.join(__dirname, '..', 'configs', 'config.json')),
  collections = ['clouds', 'levels', 'roles', 'solutions', 'types'];

async function configs () {
  let updated = false;

  log('type=configs, message="Retrieving configuration values"');

  for (const collection of collections) {
    const url = new URL(`https://experienceleague.adobe.com/api/${collection}?lang=en&page_size=100`);

    if (collection === 'solutions') {
      url.searchParams.set('full', 'true');
    }

    try {
      let key = collection;

      if (key === 'types') {
        key = 'validTypes';
      }

      const res = await fetch(url.href, {
          headers: {
            accept: 'application/json'
          }
        }),
        data = await res.json();

      if (res.ok) {
        if (data.data.length > 0) {
          config[key] = Array.from(new Set(data.data.map(i => i.Name || i.Title || i).sort()));

          if (key === 'roles') {
            config.roles.reverse();
          }

          log(`type=config, action=update, collection=${key}, message="Updated ${key}"`);
          updated = true;
        } else {
          log(`type=config, action=skip, collection=${collection}, message="No values for ${collection}"`);
        }
      } else {
        log(`type=error, origin=config, collection=${collection}, message="${data.error || 'unknown'}"`);
      }
    } catch (err) {
      log(`type=error, origin=config, collection=${collection}, message="${error(err)}"`);
    }
  }

  if (updated) {
    try {
      const cloned = clone(config);

      await writeFile(path.join(__dirname, '..', 'configs', 'config.json'), JSON.stringify(cloned, null, 2), 'utf8');
      log('type=configs, success=true, message="Wrote updates to disk"');
    } catch (err) {
      log(`type=error, origin=configs, success=false, message="${error(err)}"`);
    }
  }

  log('type=configs, message="Done"');
}

module.exports = configs;
