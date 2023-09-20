'use strict';
const audit = require('../lib/audit.js');
const afm = require('adobe-afm-transform').afm;
const converter = require('../lib/converter.js');
const filename = require('../lib/filename.js');
const main = require('../lib/main.js');
const meta = require('../lib/meta.js');
const metaHTML = require('../lib/metahtml.js');
const rewrite = require('../lib/rewrite.js');
const struct = require('../lib/struct.js');
const { loadTemplates } = require('./loadTemplates.js');
const {tracking} = require('../configs/config.json');
const footer = require('../lib/footer.js');
const clone = require('../lib/clone.js');
const solutions = require('../lib/solutions.js');


const log = console.log;
const error = console.error;

const seo = (arg = '', additive = '', req = 'Adobe') => {
  return `${arg} | ${additive.includes(req) ? additive : `${req} ${additive}`}`;
};

async function transform ({
  src = '/help/marketo/getting-started',
  file = 'help-center.md',
  raw,
  base = '',
  lang = '',
  type = '',
  solution = [],
  admonition = {}
}) {
  const templates = loadTemplates();
  const tpl = templates.get(`${type}_${lang}.html`);
  const solutionsData = await solutions();

  let valid = true,
    errorMsg,
    lhtml,
    lcommit;
  const
    structure = struct(raw),
    lmeta = meta(structure.meta, solution, lang, void 0, void 0, type),
    ltype = (lmeta.type || '').toLowerCase(),
    lfile = filename(file),
    ltitle = seo(
      /*lmeta['seo-title'] ||*/ lmeta.title ||
          Object.keys(lmeta).filter(i => i.includes('title'))[0] ||
          '',
      Array.isArray(solution) ? solution[0] : solution,
      'Adobe'
    ),
    uri = `/docs/${base}/${src.replace(/.*\/help\//, '')}/${lfile}`,
    role = lmeta.role,
    level = lmeta.level;

  // TODO: what is this?
  if (tracking in lmeta && lmeta[tracking].includes(',')) {
    lmeta[tracking] = (
      lmeta[tracking].split(',').filter(i => i.length > 0)[0] || ''
    ).trim();
    log(
      `type=transform, action=tracking, file=${file}, id=${lmeta[tracking]}, message="Reducing to 1 tracking id"`
    );
  }

  try {
    // how does this template work???
    lhtml = tpl({
      description:
      /*lmeta['seo-description'] ||*/ lmeta.description ||
          lmeta[
            Object.keys(lmeta).filter(i => i.includes('description'))[0] || ''
          ] ||
          '',
      footer: footer(uri),
      keywords: lmeta.keywords || lmeta.tags || '',
      lang,
      main: main(
        rewrite(raw, lang, 'main', base, true, uri),
        lang,
        'main',
        admonition,
        templates,
        lmeta
      ),
      meta: metaHTML(lmeta, solutionsData),
      metadata: lmeta,
      sidead: '', // leave empty for now
      title: ltitle,
      toc:
        role,
      level,
      type: ltype
    });
  } catch (err) {
    valid = false;
    errorMsg = err.message;
    log(
      `type=error, origin=transform, file=${
        file || ''
      }, compiled=false, message="${error(err)}"`
    );
    lhtml = tpl({
      breadcrumbs: '',
      description:
      /*lmeta['seo-description'] ||*/ lmeta.description ||
          lmeta[
            Object.keys(lmeta).filter(i => i.includes('description'))[0] || ''
          ] ||
          '',
      footer: footer(uri),
      keywords: lmeta.keywords || lmeta.tags || '',
      lang,
      main: afm(
        rewrite(clone(structure.body), lang, 'main', base, false, uri),
        'extension',
        converter,
        void 0,
        admonition
      ),
      meta: metaHTML(lmeta, solutionsData),
      metadata: lmeta,
      sidead: '',
      title: ltitle,
      toc: '',
      role,
      level,
      type: ltype
    });
  }

  const haudit = audit(lhtml, uri);
  let lraw;

  try {
    lraw = afm(
      rewrite(clone(structure.body), lang, 'main', base, false),
      'extension',
      converter
    );
  } catch (err) {
    lraw = afm(
      rewrite(clone(structure.body), lang, 'main', base, false).replace(
        />[^\n]\s*```/g,
        '>```'
      ),
      'extension',
      converter
    );
  }

  return {
    base,
    file: lfile,
    src,
    meta: lmeta,
    lang,
    structure,
    raw: lraw,
    lhtml,
    uri,
    valid: valid && haudit,
    errorMsg:
        valid === false ?
          errorMsg :
          haudit === false ?
            'Erroneous HTML output' :
            null,
    commit: lcommit
  };
}

module.exports = transform;
