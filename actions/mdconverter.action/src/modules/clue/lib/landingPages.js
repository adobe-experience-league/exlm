'use strict';

const path = require('path'),
  fs = require('fs'),
  breadcrumbs = require(path.join(__dirname, 'breadcrumbs.js')),
  decompress = require(path.join(__dirname, 'decompress.js')),
  error = require(path.join(__dirname, 'error.js')),
  html = require(path.join(__dirname, 'html.js')),
  language = require(path.join(__dirname, 'language.js')),
  {languages} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  hero = require(path.join(__dirname, 'hero.js')),
  log = require(path.join(__dirname, 'log.js')),
  meta = require(path.join(__dirname, 'meta.js')),
  metaHTML = require(path.join(__dirname, 'metahtml.js')),
  move = require(path.join(__dirname, 'move.js')),
  processFile = require(path.join(__dirname, 'processFile.js')),
  random = require(path.join(__dirname, 'random.js')),
  readdir = require(path.join(__dirname, 'readdir.js')),
  readfile = require(path.join(__dirname, 'readfile.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  sidead = require(path.join(__dirname, 'sidead.js')),
  solutions = require(path.join(__dirname, 'solutions.js')),
  struct = require(path.join(__dirname, 'struct.js')),
  views = require(path.join(__dirname, 'views.js'));

function home (arg = '', type, section, lang, templates, tier) {
  const chunks = arg.split(/\n?\n(?=###\s)/),
    group = chunks.shift(),
    result = chunks.map(i => processFile('', i.trim(), type, section, lang, templates, tier));

  return `<div class="passthru home group">${html(group)}${result.join('\n')}</div>`;
}

async function landingPages (tpls = new Map(), langs = languages, itier = '') {
  const folder = path.join(__dirname, '..', 'markdown'),
    allfiles = await readdir(folder),
    files = allfiles.filter(i => i.name.startsWith('landing-pages.') && i.name.endsWith('.tar.gz')).map(i => i.name),
    solutionsData = await solutions(),
    templates = views(tpls),
    now = new Date().getTime();

  for (const file of files) {
    const split = file.split('.'),
      lang = language(split[1]);

    if (lang.length > 0 && langs.includes(lang)) {
      try {
        const lfolder = await decompress(file, void 0, false),
          lcontents = await readdir(lfolder),
          lfiles = lcontents.filter(i => i.isFile() && i.name.endsWith('.md')),
          lotherfiles = lcontents.filter(i => i.isFile() && i.name.endsWith('.md') === false),
          lfolders = lcontents.filter(i => i.isFile() === false),
          filename = `docs-landing_${lang}.html`,
          tpl = templates.get(filename),
          ready = path.join(__dirname, '..', 'landing', `${lang}_new_${random()}`),
          old = path.join(__dirname, '..', 'landing', `${lang}_old_${random()}`),
          dest = path.join(__dirname, '..', 'landing', lang);

        await shell('rm', ['-rf', ready, '&&', 'mkdir', ready]);

        for (const llfolder of lfolders) {
          const name = llfolder.name;

          await move(path.join(lfolder, name), path.join(ready, name));
        }

        for (const llfile of lotherfiles) {
          const name = llfile.name;

          if (name !== 'breadcrumbs.json') {
            await move(path.join(lfolder, name), path.join(ready, name));
          }
        }

        for (const llfile of lfiles) {
          const name = llfile.name,
            llfp = path.join(lfolder, name),
            llraw = await readfile(llfp),
            llstructure = struct(llraw),
            chunks = llstructure.body.split(/\n(?=##\s)/),
            tier = itier.length > 0 ? itier.toString() : name === 'home.md' ? 'home' : 'landing',
            lhero = hero.filter(i => i.filename.test(name) && i.start <= now && i.end >= now)[0] || null,
            lsidead = sidead.filter(i => i.landing && i.filename.test(name) && i.start <= now && i.end >= now);
          let result;

          if (chunks.length > 0) {
            const llmeta = meta(llstructure.meta, void 0, lang),
              doc = {
                breadcrumbs: processFile('', breadcrumbs(name, lang), 'breadcrumbs', 'breadcrumbs', lang, templates, tier),
                body: '',
                js: '',
                keywords: '',
                meta: metaHTML(llmeta, solutionsData),
                rawMeta: llmeta,
                tier
              };

            for (const [idx, val] of chunks.entries()) {
              if (idx === 0) {
                const [title, intro] = val.split(/\n{4,4}/);

                doc.title = html((title || '').trim());
                doc['page-title'] = (doc.rawMeta['seo-title'] || doc.rawMeta.title || title || '').trim().replace(/^#\s/, '');
                doc.description = (doc.rawMeta['seo-description'] || doc.rawMeta.description || intro || '').trim().replace(/\s+/g, ' ');
                doc.intro = html((intro || '').trim());

                if (lhero !== null) {
                  doc.intro += lhero.html.replace('{{img}}', lhero.img || '').replace('{{url}}', lhero.url || '');
                }

                doc.sidead = lsidead.length > 0 ? lsidead.map(i => i.html.replace('{{img}}', i.img || '').replace('{{url}}', i.url || '')).join('\n') : '';
              } else {
                const [title, lbody] = val.split(/\n{4,4}/),
                  ltitle = (title || '').replace(/\s{.*/, '').trim(),
                  [desc, type, section] = (title || '').match(/{#([a-z]+)-([a-z]+)}/) || ['', '', ltitle.toLowerCase().replace(/\s|#/g, '')];

                doc[section] = {
                  title: ltitle,
                  desc,
                  body: (/#{3,3}\s{1,1}[^\n]/).test(val) === false ? val.includes('{#') ? processFile(ltitle, (lbody || '').trim(), type, section, lang, templates, tier) : processFile('', val.replace(/\n{4,4}/, '\n').trim(), type, section, lang, templates, tier) : home(val.replace(/\n{4,4}/g, '\n').trim(), type, section, lang, templates, tier),
                  type
                };

                doc.body += doc[section].body;
              }
            }

            result = tpl(doc);
            await fs.promises.writeFile(path.join(ready, name.replace(/\.md$/, '.html')), result, 'utf8');
          } else {
            log(`type=landingPages, file="${llfp}", message="No chunks in document"`);
          }
        }

        await shell('mv', [dest, old, '||', 'echo "Folder not found"', '&&', 'mv', ready, dest, '&&', 'rm', '-rf', old]);
        log(`type=landingPages, language=${lang}, file="${file}", message="Replaced folder"`);
      } catch (err) {
        log(`type=error, origin=landingPages, language=${lang}, file=${file} message="${error(err)}"`);
      }
    }
  }

  log('type=landingPages, message="Generated landing pages"');
}

module.exports = landingPages;
