'use strict';

const path = require('path'),
  fs = require('fs'),
  fsPromises = fs.promises,
  config = require(path.join(__dirname, '..', 'configs', 'config.json')),
  find = require(path.join(__dirname, 'find.js')),
  hash = require(path.join(__dirname, 'hash.js')),
  locales = config.locales,
  mkdirp = require(path.join(__dirname, 'mkdirp.js'));

function meta (arg = '', data = {}) {
  return data[arg];
}

async function translate (args = [], store = {}) {
  const result = [],
    seen = new Set();

  for (const arg of args) {
    if (arg.lang !== 'en') {
      for (const item of arg.files) {
        const i = find(item, store, meta(config.tracking, item.meta));
        if (i !== void 0) {
          for (const key of config.translate) {
            const tkey = key === 'Feature' ? 'keywords' : key;

            if (i[key] !== void 0) {
              let id, value, orig, source;
              id = value = orig = '';
              if (config.arrays.includes(key) || i[key] instanceof Array) {
                source = 'datum-meta';
                const arr = ('meta' in item ? item.meta[tkey.toLowerCase()] || '' : '').split(/,\s*/),
                  oarr = i[key] instanceof Array ? i[key] : (i[key] || '').toString().split(/,\s*/);

                for (const [idx, akey] of arr.entries()) {
                  value = akey.trim();
                  if (value.length > 0 && seen.has(value) === false) {
                    orig = `${(oarr[idx] || '').trim()}`;
                    const oarg = `${orig}_${key}`;
                    id = `${hash(oarg)}`;
                    if (value.length > 0) {
                      result.push({id: id, value: value, source: source, lang: locales[arg.lang]});
                    }
                    seen.add(value);
                  }
                }
              } else {
                source = 'articles';
                value = ('meta' in item ? item.meta[tkey.toLowerCase()] || '' : '').trim();
                id = hash(`${i.id || 'noId'}_${key.replace(/\s/g, '')}`);
                orig = key in i ? i[key] : '';
                if (value.length > 0) {
                  result.push({id: id, value: value, source: source, lang: locales[arg.lang]});
                }
              }
            }
          }
        }
      }
    }
  }

  const locResults = {};
  const locdir = 'translations/contents/__localization__/docs';

  await mkdirp(locdir);

  // bucketize the ids/values into language buckets (locResults)
  for (const k of result) {
    const lang = 'lang' in k ? k.lang : 'nolang';
    const id = 'id' in k ? k.id : 'noid';
    const value = 'value' in k ? k.value : '';

    if (lang in locResults === false) {
      locResults[lang] = {};
    }
    locResults[lang][id] = value;
  }

  // Go through locResults and add/merge existing json
  for (const lang in locResults) {
    const fpath = `${locdir}/${lang}.json`;
    // read existing json
    let mergedData = {};
    try {
      fs.accessSync(fpath, fs.constants.F_OK);
      // file already exists, so merge it with new data
      const olddata = JSON.parse(fs.readFileSync(fpath));
      mergedData = {...olddata, ...locResults[lang]};
    } catch (err) {
      mergedData = locResults[lang];
    }
    const data = JSON.stringify(mergedData, null, 2);
    await fsPromises.writeFile(`${locdir}/${lang}.json`, data, {encoding: 'utf8'});
  }
}

module.exports = translate;
