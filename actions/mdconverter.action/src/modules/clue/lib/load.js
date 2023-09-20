'use strict';

const path = require('path'),
  os = require('os'),
  ftmp = os.tmpdir(),
  fs = require('fs'),
  coerce = require('tiny-coerce'),
  {chunk} = require('retsu'),
  {stringify} = require('yaml'),
  config = require(path.join(__dirname, '..', 'configs', 'config.json')),
  mongo = require(path.join(__dirname, 'mongo.js')),
  copy = require(path.join(__dirname, 'copy.js')),
  commit = require(path.join(__dirname, 'commit.js')),
  clone = require(path.join(__dirname, 'clone.js')),
  error = require(path.join(__dirname, 'error.js')),
  find = require(path.join(__dirname, 'find.js')),
  log = require(path.join(__dirname, 'log.js')),
  random = require(path.join(__dirname, 'random.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  sitemaps = require(path.join(__dirname, 'sitemaps.js')),
  translate = require(path.join(__dirname, 'translate.js')),
  validate = require(path.join(__dirname, 'validate.js')),
  dest = path.join(__dirname, '..'),
  count = {
    created: 0,
    updated: 0,
    tracked: 0,
    invalid: []
  },
  domain = 'https://experienceleague.adobe.com',
  ids = new Set(),
  delimiter = os.platform() === 'darwin' ? ' \'\' ' : ' ',
  configFilters = Object.assign({}, config.filters, 'CL_FILTERS' in process.env ? JSON.parse(process.env.CL_FILTERS) || {} : {}),
  filtersKeys = Object.keys(configFilters);

filtersKeys.forEach(i => {
  configFilters[i] = coerce(configFilters[i]);
});

if ('CL_MONGO_PUBLISH' in process.env) {
  config.datastore.publish = process.env.CL_MONGO_PUBLISH === 'true';
}

if ('CL_MONGO_SYNC' in process.env) {
  config.datastore.sync = process.env.CL_MONGO_SYNC === 'true';
}

if ('CL_SITEMAPS' in process.env) {
  config.sitemaps = process.env.CL_SITEMAPS === 'true';
}

function unique (arg = '', max = 1e12) {
  let result = arg,
    valid = ids.has(result) === false;

  while (valid === false) {
    result = `${arg}_${Math.floor(Math.random() * max)}`;

    if (ids.has(result) === false) {
      ids.add(result);
      valid = true;
    }
  }

  return result;
}

function id (title = '', type = '', base = '', mid = '') {
  return mid.length > 0 ? mid : unique(`${type}_${base.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}_${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`);
}

function normalize (arg = {}) {
  const keys = Reflect.ownKeys(arg).sort();

  return keys.reduce((a, v) => {
    a[v] = arg[v];

    return a;
  }, {});
}

function meta (arg = '', data = {}) {
  return data[arg];
}

function prepare (arg = {}, item = {}, title = '', store = {}) {
  const solution = (meta('solution', item.meta) || arg.Solution.join(',')).split(/,\s*/g),
    rec = find(item, store, meta(config.tracking, item.meta)),
    rtype = meta('type', item.meta) || config.type,
    result = {
      Title: meta('title', item.meta) || title,
      Description: meta('description', item.meta) || '',
      Role: (meta('role', item.meta) || '').split(','),
      Level: (meta('level', item.meta) || '').split(','),
      Type: rtype.split(/,\s*/g).filter(i => config.validTypes.includes(i)),
      id: rec !== void 0 ? rec.id : '',
      ID: rec !== void 0 ? rec.ID : id(title, arg.Template, arg.base, item.meta.id),
      URL: item.uri,
      Solution: solution,
      Thumbnail: `/www/img/thumb/${meta('thumbnail', item.meta) || `${arg.Template}-${solution[0].toLowerCase().replace(/\s+/g, '-')}.png`}`,
      Order: parseInt(meta('order', item.meta) || rec !== void 0 ? rec.Order : config.datastore.order, 10),
      Archived: arg.Archived === true,
      Publish: arg.Publish === true,
      Markdown: true,
      'Full Meta': stringify(item.meta, void 0, {lineWidth: 0, singleQuote: true}),
      'Full Body': item.raw,
      File: arg.File,
      Feature: (meta('keywords', item.meta) || '').split(/,\s*/g).filter(i => i.length > 0),
      Hide: (/(y|True|true)/).test(meta('hide', item.meta))
    };

  // NOTE: if the source markdown article does not have an exl-id assigned in meta, it will be treated a a new article and inserted again into mongo
  ['id', 'Feature', 'Full Meta'].forEach(i => {
    if (result[i].length === 0) {
      delete result[i];
    }
  });

  if (rec !== void 0 && result.URL !== rec.URL) {
    result['Original URL'] = rec.URL;
  }

  return result;
}

async function tags (args = [], min = 0) {
  const registry = new Map(),
    result = args.length === 0 ? [] : Array.from(new Set(args.map(i => i.Feature || []).reduce((a, v) => {
      for (const w of v) {
        registry.set(w, (registry.get(w) || 0) + 1);
      }

      return [...a, ...v];
    }, []))).filter(i => registry.get(i) > min && i.includes('"') === false).sort();

  return result;
}

async function atload (arg = {}, store = {}, sync = true) {
  const nth = arg.files.length,
    prepared = nth > 0 ? arg.files.map(i => prepare(arg, i, i.meta.title, store)) : [],
    words = (nth > 0 ? await tags(store.find({File: arg.File}, true).concat(prepared)) : []).filter(i => i.length > 0),
    updates = [],
    timestamp = new Date().toISOString();

  for (const [idx, item] of arg.files.entries()) {
    const input = prepared[idx],
      rec = 'id' in input ? store.get(input.id, true) : void 0;

    if (input['Full Body'].length >= 1e5) {
      delete input['Full Body'];
    }

    if ('Feature' in input) {
      if (input.Feature.length === 0) {
        delete input.Feature;
      } else {
        input.Feature = input.Feature.filter(t => words.includes(t)); //.sort();
      }
    }

    if ('URL' in input) {
      if (input.URL.startsWith('/docs/')) {
        input.URL = `${domain}${input.URL}`;
      }
    }
    if (rec !== void 0) {
      const tmp = clone(rec),
        linput = clone(input);

      delete linput.id;
      delete tmp.id;
      delete tmp.Tags;
      delete tmp['Added UTC'];
      delete tmp['Updated UTC'];
      delete tmp.timestamp;

      if ('Publish' in linput && 'Publish' in tmp === false) {
        tmp.Publish = false;
      }

      if ('Hide' in linput && 'Hide' in tmp === false) {
        tmp.Hide = false;
      }

      if ('Description' in input && input.Description.length === 0 && 'Description' in tmp === false) {
        tmp.Description = '';
      }

      if ('Feature' in tmp && tmp.Feature instanceof Array) {
        if (tmp.Feature.length === 0) {
          delete tmp.Feature;
        } else {
          tmp.Feature = tmp.Feature; //.sort();
        }
      }

      if (sync && JSON.stringify(normalize(linput)) !== JSON.stringify(normalize(tmp))) {
        updates.push(Object.assign({id: rec.id, fields: linput}));
      }

      item.id = rec.id;
      item.action = input.action = 'update';
      count.updated++;
    } else {
      let valid = true;

      if (sync) {
        try {
          let obj = {};
          if ('_id' in input) { // update document for input.id
            obj = await mongo('articles_en', 'set', input.id, input);
          } else { // no key (input.id) so create the document (using array for mongo set operation)
            obj = await mongo('articles_en', 'set', void 0, [input]);
          }

          item.id = input.id = obj.insertedIds[0].toString();
        } catch (err) {
          const {ID, Title, Level, Role, Solution, URL, file} = input;

          valid = false;
          log(`type=error, origin=load, action=atload, message="${err.message || err}", data="${JSON.stringify({ID, Title, Feature: input.Feature || null, Level, Role, Solution, URL, file})}"`);
        }
      }

      item.action = input.action = 'create';

      if (valid) {
        count.created++;
      }
    }

    if (item.valid === false) {
      count.invalid.push({
        tarball: item.filename,
        path: item.uri.replace(`/docs/${item.base}`, '/help').replace('.html', '.md'),
        error: item.errorMsg || null,
        timestamp
      });
    }

    input.Markdown = true;

    if (validate(input.id, 'string', '')) {
      store.set(input.id, input);
    } else {
      log(`type=error, origin=load, action=atload, file=${input.File}, ID=${input.ID}, message="No 'id' to map file on disk to"`);
    }
  }

  if (updates.length > 0) {
    const seen = new Set();

    for (const recs of chunk(updates.filter(x => {
      let result = false;

      if (seen.has(x.id) === false) {
        seen.add(x.id);
        result = true;
      }

      return result;
    }), 10)) {
      try {
        // mongo 'set' with an array inserts, with only one record it updates.
        // iterating through individual records so we upsert
        for (const rec of recs) {
          await mongo('articles_en', 'set', rec.id, {$set: rec.fields});
        }
      } catch (err) {
        log(`type=error, origin=load, action=atload, sub=batch, message="${error(err)}"`);
      }
    }
  }

  return arg;
}

async function embed (arg = {files: []}) {
  const fpName = `${arg.File.replace('.tar.gz', '').replace(/\./g, '-')}_${random()}.sh`,
    fp = path.join(ftmp, fpName),
    cmd = arg.files.map(i => `sed -i${delimiter}'s/<meta name="id" content="{{id}}">/<meta name="id" content="${i.id || ''}">/' ${path.join(i.dest, i.file)}`),
    script = `#!/usr/bin/env ${os.platform() === 'darwin' ? 'bash' : 'sh'}

${cmd.join('\n')}
rm -rf ${fp}
`;
  let result = true;

  await fs.promises.writeFile(fp, script, 'utf8');
  log(`type=load, message="Embedding IDs", file=${arg.File}, total=${arg.files.length}`);

  try {
    await shell('chmod', ['u+x', fpName, '&&', `./${fpName}`], ftmp);
  } catch (err) {
    log(`type=error, origin=load, file=${arg.File}, script=${fp}, message="${error(err)}"`);
    result = false;
  }

  return result;
}

async function load (args = {}, store, sync = true, syncTranslations = true, file = '*') {
  if (args.invalid.length > 0) {
    for (const arg of args.invalid) {
      count.invalid.push(arg);
      await shell('rm', ['-rf', `"${arg.source}"`, '&&', 'rm', '-rf', `"${arg.path}"`]);
      log(`type=load, source=${arg.source}, tmp=${arg.path}, invalid=true, message="Removing failed build folders"`);
    }
  }

  if (args.valid.length > 0) {
    for (const aid of store.indexes.get('ID').keys()) {
      ids.add(aid);
    }

    for (let arg of args.valid) {
      const ldest = path.join(dest, arg.Type, `${arg.base}_${arg.lang}`);

      try {
        if (arg.lang === 'en') {
          arg = await atload(arg, store, sync && arg.Hold !== true);
        } else {
          // decorating `id` values which are only on english records
          for (const lfile of arg.files) {
            const rec = find(lfile, store, meta(config.tracking, lfile.meta));

            if (rec !== void 0) {
              lfile.id = rec.id;
            }
          }
        }

        if (process.env.CL_EMBED_ID !== 'false') {
          await embed(arg);
        }

        const margs = ['mv', `"${arg.ready}"`, `"${ldest}_new_${arg.bid}"`, '&&', 'mv', `"${ldest}"`, `"${ldest}_old_${arg.bid}"`, '||', 'echo', '"Existing folder not found"', '&&', 'mv', `"${ldest}_new_${arg.bid}"`, `"${ldest}"`, '&&', 'rm', '-rf', `"${ldest}_old_${arg.bid}"`, '||', 'echo', '"Existing folder not found"'];

        log(`type=load, source=${arg.ready}, destination=${ldest}, message="Moving ${arg.ready} to ${ldest}"`);
        await shell(margs.join(' '));
      } catch (err) {
        log(`type=error, origin=load, source=${arg.ready}, destination=${ldest}, message="${error(err)}", data=${JSON.stringify(err.data || null)}`);
      }
    }
  }

  if (syncTranslations) {
    const fpt = path.join(__dirname, '..', 'translations');

    try {
      log('type=load, message="Generating i18n data set"');
      await translate(args.valid, store);
      await copy(path.join(__dirname, '..', 'content.json'), path.join(fpt, 'docs.json'));
      await commit(fpt, 'strings');
    } catch (err) {
      log(`type=error, origin=load, action=translations, message="${error(err)}"`);
    }
  }

  if (file === '*') {
    await sitemaps(store, filtersKeys, configFilters);
  }

  return count;
}

module.exports = load;
