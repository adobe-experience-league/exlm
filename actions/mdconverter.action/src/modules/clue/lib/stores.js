'use strict';

const path = require('path'),
  fsPromises = require('fs').promises,
  {haro} = require('haro'),
  args = require('yargs').argv,
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  retrieve = require(path.join(__dirname, 'retrieve.js')),
  config = require(path.join(__dirname, '..', 'configs', 'config.json')),
  limit = 'CL_LIMIT' in process.env ? parseInt(process.env.CL_LIMIT, 10) : config.limit,
  stores = {},
  dir = path.join(__dirname, '..', 'data'),
  {files, indexes} = require(path.join(__dirname, '..', 'configs', 'stores.json')),
  meta = require(path.join(__dirname, 'meta.js')),
  filters = {
    all: i => i?.Ignore !== true
  },
  transforms = {
    articles: arg => {
      if ('Added UTC' in arg) {
        arg.timestamp = new Date(arg['Added UTC']).getTime();
      }

      for (const key of config.arrays) {
        if (key in arg && arg[key] instanceof Array === false) {
          arg[key] = arg[key].split(/,\s*/g);
        }
      }

      if ('Full Meta' in arg && arg['Full Meta'].includes(config.tracking)) {
        const lmeta = meta(arg['Full Meta'], arg.Solution, void 0, void 0, false);

        arg.docId = lmeta[config.tracking];
      }

      arg.Archived = arg.Archived === true;
      arg.Hide = arg.Hide === true;
      arg.Ignore = arg.Ignore === true;
      arg.Markdown = arg.Markdown === true;
      arg.Publish = arg.Publish === true;

      return arg;
    },
    'markdown-sources': arg => {
      arg.Archived = arg.Archived === true;
      arg.Hold = arg.Hold === true;
      arg.Ignore = arg.Ignore === true;
      arg.Publish = arg.Publish === true;

      return arg;
    }
  };

function localeSort (a, b) {
  const ha = a.lang === 'en',
    hb = b.lang === 'en';

  return ha && hb ? 0 : ha ? 1 : -1;
}

async function operate (key = '', inputs = []) {
  for (const file of inputs) {
    const store = stores[key];

    if (store !== void 0) {
      const fpPath = path.join(dir, file),
        arg = await fsPromises.readFile(fpPath, 'utf8'),
        data = JSON.parse(arg),
        ready = data.map(transforms[key] || transforms.all).filter(filters[key] || filters.all).sort(localeSort);

      log(`type=stores, origin=operate, file="${file}", size=${data.length}, valid=${ready.length}, limit=${limit}, message="Loaded raw JSON from disk"`);
      data.length = 0;

      if (limit > 0) {
        ready.length = limit;
      }

      store.batch(ready, 'set');
      ready.length = 0;
    }
  }
}

for (const store of Object.keys(files)) {
  stores[store] = haro(null, {id: store, key: 'id', versioning: false, logging: false, index: indexes[store] || []});
}

(function () {
  async function init (retry = true) {
    let again = false;

    for (const store of Object.keys(files)) {
      try {
        await operate(store, files[store]);
      } catch (err) {
        log(`type=error, origin=stores, action=init, store=${store}, message="${error(err)}"`);

        if (retry && again === false) {
          again = false;
          await retrieve(true, args.file);
          await init(false);
        }
      }
    }
  }

  init();
}());

module.exports = stores;
