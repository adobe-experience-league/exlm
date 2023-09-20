'use strict';

const path = require('path'),
  fs = require('fs'),
  {tracking} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  {afm} = require('adobe-afm-transform'),
  audit = require(path.join(__dirname, 'audit.js')),
  breadcrumbs = require(path.join(__dirname, 'breadcrumbs.js')),
  clone = require(path.join(__dirname, 'clone.js')),
  converter = require(path.join(__dirname, 'converter.js')),
  docid = require(path.join(__dirname, 'docid.js')),
  error = require(path.join(__dirname, 'error.js')),
  filename = require(path.join(__dirname, 'filename.js')),
  footer = require(path.join(__dirname, 'footer.js')),
  language = require(path.join(__dirname, 'language.js')),
  log = require(path.join(__dirname, 'log.js')),
  main = require(path.join(__dirname, 'main.js')),
  menu = require(path.join(__dirname, 'menu.js')),
  meta = require(path.join(__dirname, 'meta.js')),
  metaHTML = require(path.join(__dirname, 'metahtml.js')),
  mkdirp = require(path.join(__dirname, 'mkdirp.js')),
  move = require(path.join(__dirname, 'move.js')),
  parse = require(path.join(__dirname, 'parse.js')),
  processFile = require(path.join(__dirname, 'processFile.js')),
  random = require(path.join(__dirname, 'random.js')),
  rewrite = require(path.join(__dirname, 'rewrite.js')),
  sidead = require(path.join(__dirname, 'sidead.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  solutions = require(path.join(__dirname, 'solutions.js')),
  struct = require(path.join(__dirname, 'struct.js')),
  validate = require(path.join(__dirname, 'validate.js'));

function seo (arg = '', additive = '', req = 'Adobe') {
  return `${arg} | ${additive.includes(req) ? additive : `${req} ${additive}`}`;
}

async function traverse (src, dest, base = '', lang = '', toc = '', type = '', solution = [], threadId = 1, fname = '', manifest = '', templates = new Map(), admonition = {}) {
  const tpl = templates.get(`${type}_${lang}.html`),
    now = new Date().getTime();

  await mkdirp(dest);
  log(`type=traverse, thread=${threadId}, message="Processing ${src}"`);

  const items = await fs.promises.readdir(src, {encoding: 'utf8', withFileTypes: true}),
    files = items.filter(i => i.isFile()).map(i => i.name).filter(i => i.endsWith('.md')),
    validFiles = files.filter(i => (/^toc\.md$/i).test(i) === false),
    otherFiles = items.filter(i => i.isFile()).map(i => i.name).filter(i => (/^(metadata|toc)\.md$/i).test(i) === false && i.endsWith('.md') === false),
    folders = items.filter(i => i.isFile() === false && i.name !== '.git').map(i => i.name),
    ltoc = await menu(src, files, toc, base, lang, manifest),
    solutionsData = await solutions();
  let result = [];

  for (const file of otherFiles) {
    await move(path.join(src, file), path.join(dest, filename(file)));
  }

  for (const file of validFiles) {
    let valid = true,
      errorMsg, lhtml, ldocid, lcommit;
    const raw = await fs.promises.readFile(path.join(src, file), {encoding: 'utf8'}),
      structure = struct(raw),
      lmeta = meta(structure.meta, solution, lang, void 0, void 0, type),
      ltype = (lmeta.type || '').toLowerCase(),
      lfile = filename(file),
      ltitle = seo(/*lmeta['seo-title'] ||*/ lmeta.title || Object.keys(lmeta).filter(i => i.includes('title'))[0] || '', Array.isArray(solution) ? solution[0] : solution, 'Adobe'),
      uri = `/docs/${base}/${src.replace(/.*\/help\//, '')}/${lfile}`,
      lsidead = sidead.filter(i => i.lang === '*' || i.lang === lang && i.solution === '*' || i.solution.splice(',').filter(is => solution.includes(is)).length > 0 && i.start <= now && i.end >= now),
      role = lmeta.role,
      level = lmeta.level;

    if (tracking in lmeta && lmeta[tracking].includes(',')) {
      lmeta[tracking] = (lmeta[tracking].split(',').filter(i => i.length > 0)[0] || '').trim();
      log(`type=transform, action=tracking, file=${file}, id=${lmeta[tracking]}, message="Reducing to 1 tracking id"`);
    }

    try {
      [ldocid, lcommit] = await docid(uri, lmeta[tracking], lang);

      if (validate(ldocid, 'string', '')) {
        lmeta[tracking] = ldocid;
        structure.meta = Reflect.ownKeys(lmeta).filter(i => i !== 'build-date').map(i => `${i}: ${lmeta[i]}`).join(raw.includes('\r\n') ? '\r\n' : '\n').trim();

        if (lcommit) {
          log(`type=transform, action=tracking, uri=${uri}, file="${fname || ''}, id="${ldocid}", message="Updated tracking ID, and meta data"`);
        }
      } else {
        log(`type=transform, action=tracking, uri=${uri}, file="${fname || ''}, id="${ldocid}", message="Failed to update tracking ID"`);
      }
    } catch (err) {
      log(`type=error, origin=transform, uri=${uri}, file=${fname || ''}, message="${error(err)}"`);
    }

    try {
      lhtml = tpl({
        breadcrumbs: processFile('', breadcrumbs(file, lang, base, lmeta.title, lmeta), 'breadcrumbs', 'breadcrumbs', lang, templates),
        description: /*lmeta['seo-description'] ||*/ lmeta.description || lmeta[Object.keys(lmeta).filter(i => i.includes('description'))[0] || ''] || '',
        footer: footer(uri),
        keywords: lmeta.keywords || lmeta.tags || '',
        lang,
        main: main(rewrite(raw, lang, 'main', base, true, uri), lang, 'main', admonition, templates, lmeta),
        meta: metaHTML(lmeta, solutionsData),
        metadata: lmeta,
        sidead: lsidead.length > 0 ? lsidead.map(i => i.html.replace('{{img}}', i.img || '').replace('{{url}}', i.url || '')).join('\n') : '',
        title: ltitle,
        toc: ltoc[1].length > 0 && ltoc[1].includes(uri) ? ltoc[1] : ltoc[0],
        role,
        level,
        type: ltype
      });
    } catch (err) {
      valid = false;
      errorMsg = err.message;
      log(`type=error, origin=transform, file=${file || ''}, compiled=false, message="${error(err)}"`);
      lhtml = tpl({
        breadcrumbs: processFile('', breadcrumbs(file, lang, base, lmeta.title, lmeta), 'breadcrumbs', 'breadcrumbs', lang, templates),
        description: /*lmeta['seo-description'] ||*/ lmeta.description || lmeta[Object.keys(lmeta).filter(i => i.includes('description'))[0] || ''] || '',
        footer: footer(uri),
        keywords: lmeta.keywords || lmeta.tags || '',
        lang,
        main: afm(rewrite(clone(structure.body), lang, 'main', base, false, uri), 'extension', converter, void 0, admonition),
        meta: metaHTML(lmeta, solutionsData),
        metadata: lmeta,
        sidead: lsidead.length > 0 ? lsidead.map(i => i.html.replace('{{img}}', i.img || '').replace('{{url}}', i.url || '')) : '',
        title: ltitle,
        toc: ltoc[1].length > 0 && ltoc[1].includes(uri) ? ltoc[1] : ltoc[0],
        role,
        level,
        type: ltype
      });
    }

    const haudit = audit(lhtml, uri);
    let lraw;

    try {
      lraw = afm(rewrite(clone(structure.body), lang, 'main', base, false), 'extension', converter);
    } catch (err) {
      lraw = afm(rewrite(clone(structure.body), lang, 'main', base, false).replace(/>[^\n]\s*```/g, '>```'), 'extension', converter);
    }

    result.push({
      base,
      file: lfile,
      src,
      dest,
      meta: lmeta,
      lang,
      structure,
      raw: lraw,
      filename: fname,
      uri,
      valid: valid && haudit,
      errorMsg: valid === false ? errorMsg : haudit === false ? 'Erroneous HTML output' : null,
      commit: lcommit
    });

    await fs.promises.writeFile(path.join(dest, lfile), lhtml, {encoding: 'utf8'});
  }

  for (const folder of folders) {
    result = [...result, ...await traverse(path.join(src, folder), path.join(dest, folder), base, lang, ltoc[0], type, solution, threadId, fname, ltoc[1], templates, admonition)];
  }

  return result;
}

async function transform (arg, threadId = 1, target = 'help', templates = new Map(), admonitions = new Map()) {
  const [base, lang] = parse(arg.URL);
  let folder = arg.folder;

  try {
    let lfolder = path.join(arg.folder, target);

    await fs.promises.readdir(lfolder);
    folder = lfolder;
  } catch (err) {
    void 0;
  }

  arg.lang = language(lang);
  arg.admonition = admonitions.get(arg.lang) || {};
  arg.base = base;
  arg.bid = random();
  arg.ready = `${arg.folder.replace('clone', 'ready')}_${arg.bid}`;
  arg.files = await traverse(folder, arg.ready, arg.base, arg.lang, void 0, arg.Template, arg.Solution, threadId, arg.File, arg.manifest, templates, arg.admonition);
  arg.commit = arg.files.filter(i => i.commit).length > 0;
  arg.commit = true;

  log(`type=transform, file=${arg.File}, folder=${arg.folder}, traversed=true, message="Deleting build folder ${arg.folder}"`);
  await shell(`rm -rf ${arg.folder}`);

  return arg;
}

module.exports = transform;
