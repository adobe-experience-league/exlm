'use strict';

const path = require('path'),
  coerce = require('tiny-coerce'),
  {datastore, types, filters} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  error = require(path.join(__dirname, 'error.js')),
  language = require(path.join(__dirname, 'language.js')),
  load = require(path.join(__dirname, 'load.js')),
  log = require(path.join(__dirname, 'log.js')),
  mongo = require(path.join(__dirname, 'mongo.js')),
  multithread = require(path.join(__dirname, 'multithread.js')),
  orphans = require(path.join(__dirname, 'orphans.js')),
  purge = require(path.join(__dirname, 'purge.js')),
  readdir = require(path.join(__dirname, 'readdir.js')),
  readfile = require(path.join(__dirname, 'readfile.js')),
  retrieve = require(path.join(__dirname, 'retrieve.js')),
  rewrite = require(path.join(__dirname, 'rewrite.js')),
  sitemaps = require(path.join(__dirname, 'sitemaps.js')),
  track = require(path.join(__dirname, 'track.js')),
  configFilters = 'CL_FILTERS' in process.env ? JSON.parse(process.env.CL_FILTERS) || {} : filters,
  filtersKeys = Object.keys(configFilters),
  nth = filtersKeys.length;

filtersKeys.forEach(i => {
  configFilters[i] = coerce(configFilters[i]);
});

async function etl (file = '*', forceBuild = false, templates = new Map(), syncMongo = true, syncTranslations = true, admonitions = new Map()) {
  await retrieve(syncMongo, file);

  const stores = await require(path.join(__dirname, 'stores.js'));

  return Promise.all(Object.keys(stores).map(i => new Promise(resolve => {
    stores[i].onbatch = () => {
      log(`type=etl, origin=batch, store=${i}, size=${stores[i].size}, message="Records loaded"`);
      resolve(true);
    };
  }))).then(async () => {
    if (file === '*' && process.env.CL_SYNC_MONGO_KILL === 'true' && process.env.CL_SITEMAPS === 'true') {
      await sitemaps(stores.articles, filtersKeys, configFilters);
      log('type=etl, message="Generated sitemaps, shutting down"');
      process.exit(0);
    }

    const branch = file.includes('_'),
      recs = file === '*' ? stores['markdown-sources'].toArray(false).filter(i => 'File' in i && types.includes(i.Template) && i.Archived !== true) : stores['markdown-sources'].find({Archived: false, File: file.replace(/_[^\.]+/, '')}, true).map(i => {
        if (branch) {
          i.File_branch = file;
        }

        return i;
      }),
      fpManifest = path.join(__dirname, '..', 'manifest'),
      tdirs = await readdir(path.join(__dirname, '..', 'docs'), void 0, 'isDirectory', true),
      tfiles = await readdir(path.join(__dirname, '..', 'markdown'), void 0, 'isFile', true, arg => arg !== null && arg.name.endsWith('.tar.gz')),
      tmanifests = await readdir(fpManifest, void 0, 'isFile', true, arg => arg !== null && arg.name.endsWith('.md')),
      dirs = new Map(tdirs),
      files = new Map(tfiles),
      lmanifests = await Promise.all(tmanifests.map(async i => {
        const fpName = i[0].replace('-manifest', '').replace('.md', '.tar.gz'),
          lang = fpName.replace('.tar.gz', '').replace(/^.*\./, '');
        let result = [];

        if (files.has(fpName)) {
          try {
            const tmp = await readfile(path.join(fpManifest, i[0]));

            result = [
              fpName,
              rewrite(tmp, lang, 'manifest')
            ];
          } catch (err) {
            log(`type=error, origin=etl, action=manifests, message="${error(err)}"`);
          }
        }

        return result;
      })),
      manifests = lmanifests.filter(i => i.length > 0),
      invalid = [],
      valid = recs.map(i => {
        const fstat = files.get(i.File_branch) || files.get(i.File) || null,
          dname = fstat !== null ? i.File.replace('.tar.gz', '').split('.').map((p, pdx) => pdx === 0 ? p : language(p)).join('_') : '',
          dstat = fstat !== null ? dirs.get(dname) || null : null;

        return [i, fstat !== null ? forceBuild || dstat === null || dstat.mtimeNs < fstat.mtimeNs : false];
      }).filter(i => {
        if (i[1] === false || i[0].Solution === void 0) {
          invalid.push(i[0]);
        }

        return i[1] && i[0].Solution !== void 0;
      }).filter(i => nth === 0 || filtersKeys.filter(f => i[0][f] === configFilters[f]).length === nth).map(i => i[0]);

    if (invalid.length > 0) {
      try {
        const timestamp = new Date().toISOString(),
          errorMsg = 'Tarball not found in blob storage',
          data = invalid.map(i => {
            return {
              tarball: i.File,
              path: null,
              error: errorMsg,
              timestamp
            };
          });

        await mongo('builds', 'set', void 0, data);
        log(`type=etl, action=mongo, message="Inserted ${invalid.length} records into 'builds' collection"`);
      } catch (err) {
        log(`type=error, origin=etl, action=mongo, message="${error(err)}"`);
      }
    }

    return valid.length > 0 ? await multithread(valid, manifests.filter(i => i[0] !== void 0), templates, admonitions) : {valid, invalid: []};
  }).then(async arg => [arg, await load(arg, stores.articles, datastore.sync, syncTranslations, file)])
    .then(async args => {
      const files = args[0].valid,
        result = args[1],
        filenames = files.map(i => i.File).filter(i => i.endsWith('.en.tar.gz')),
        ltrack = files.filter(i => i.commit),
        ltracked = ltrack.reduce((a, v) => {
          a += v.files.filter(f => f.commit).length;

          return a;
        }, 0);

      result.tracked = ltracked;

      if (datastore.sync && filenames.length > 0 && result.created > 0 || result.updated > 0) {
        result.archived = await orphans(stores.articles, file, filenames, datastore.sync);
      } else {
        result.archived = 0;
      }

      if (ltracked > 0) {
        await track(ltrack);
      }

      if (file === '*') {
        await purge(stores['markdown-sources']);
      }

      return result;
    });
}

module.exports = etl;
