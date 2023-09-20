'use strict';

const path = require('path'),
  fs = require('fs'),
  {languages, types, subtypes, hasSubtypes} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  {name, email} = require(path.join(__dirname, '..', 'configs', 'github.json')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  mkdirp = require(path.join(__dirname, 'mkdirp.js')),
  language = require(path.join(__dirname, 'language.js')),
  locstrings = require(path.join(__dirname, 'locstrings.js')),
  readdir = require(path.join(__dirname, 'readdir.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  solutions = require(path.join(__dirname, 'solutions.js'));

module.exports = async (file, landing = true, sync = false, forced = false) => {
  const syncMongo = process.env.CL_SYNC_MONGO_FORCE === 'true' || (process.env.CL_SYNC_MONGO_ALWAYS === 'true' && sync) || (process.env.CL_SYNC_MONGO !== 'false' && file === '*'), // eslint-disable-line no-extra-parens
    syncFooter = process.env.CL_SYNC_FOOTER !== 'false' && file === '*',
    syncMarkdown = process.env.CL_SYNC_MARKDOWN !== 'false',
    syncManifest = process.env.CL_SYNC_MANIFEST === 'true' && file === '*',
    syncTemplates = process.env.CL_SYNC_TEMPLATES !== 'false',
    syncTranslations = process.env.CL_SYNC_TRANSLATIONS !== 'false' && file === '*' && forced,
    syncLocStringTables = process.env.CL_SYNC_LOCSTRINGTABLES !== 'false' && file === '*',
    repos = [
      ['templates', process.env.CL_GITHUB_TEMPLATES || '', process.env.CL_GITHUB_TEMPLATES_BRANCH || ''],
      ['translations', process.env.CL_GITHUB_TRANSLATIONS || '', '']
    ],
    nth = repos.length,
    templates = new Map(),
    admonitions = new Map(),
    rclone = [
      'manifest',
      'markdown',
      'footer',
      'loc-string-tables'
    ],
    create = [
      'clone',
      'data',
      'docs',
      'footer',
      'landing',
      'manifest',
      'markdown',
      'loc-string-tables',
      'ready',
      'track'
    ];

  if (process.env.NODE_ENV === 'production') {
    log('type=init, message="Setting git name & email"');
    await shell(`git config --global user.name "${name}" && git config --global user.email "${email}"`);
  } else {
    log('type=init, message="Skipped setting git name & email"');
  }

  if (syncTemplates === false) {
    repos.shift();
  }

  if (syncTranslations === false) {
    repos.pop();
  }

  for (const dir of create) {
    log(`type=init, message="Creating ./${dir}"`);
    await mkdirp(dir);
  }

  for (const [idx, repo] of repos.entries()) {
    try {
      const fpPath = path.join(process.cwd(), repo[0]);
      let cmds = `rm -rf ${fpPath} && git clone ${repo[1]} ${fpPath}`;

      if (repo[2].length > 0) {
        cmds += ` && cd ${fpPath} && git checkout ${repo[2]}`;
      }

      log(`type=init, message="Cloning ./clone/${repo[0]} (${idx + 1}/${nth})"`);
      await shell(cmds);
    } catch (err) {
      log(`type=init, repo=${repo[0]}, message="${error(err)}"`);
    }
  }

  for (const [rdx, rarg] of rclone.entries()) {
    if ((rdx === 0 && syncManifest) || (rdx === 1 && syncMarkdown) || (rdx === 2 && syncFooter) || (rdx === 3 && syncLocStringTables)) { // eslint-disable-line no-extra-parens
      const full = rdx === 0 || rdx === 2 || (rdx === 1 && file === '*') || (rdx === 3 && file === '*'), // eslint-disable-line no-extra-parens
        lrarg = rdx === 1 ? process.env.CL_MARKDOWN_CONTAINER || rarg : rarg,
        target = full ? lrarg : `${lrarg}/${file}`,
        local = full ? rarg : `${rarg}/${file}`,
        remote = `remote:/${target}`;

      if (rdx === 1 && file !== '*') {
        log(`type=init, message="Deleting ./${local}"`);
        try {
          await shell('rm', ['-rf', local]);
        } catch (err) {
          log(`type=error, origin=init, repo=${local}, message="${error(err)}"`);
        }
      }

      log(`type=init, message="Rcloning ./${local}"`);

      try {
        await shell('rclone', ['--progress', full ? 'sync' : 'copy', remote, rarg]);
      } catch (err) {
        log(`type=error, origin=init.rclone, action = ${full ? 'sync' : 'copy'}, message="${error(err)}"`);
      }
    }
  }

  const lpath = await locstrings();

  if (lpath.length > 0) {
    const items = await readdir(lpath, void 0, 'isDirectory');

    for (const item of items) {
      const key = language(item),
        data = await fs.promises.readFile(path.join(lpath, item, 'admonition.json'), {encoding: 'utf8'});

      admonitions.set(key, JSON.parse(data));
    }
  }

  if (landing && file === '*') {
    for (const lang of languages) {
      const lfile = `landing-pages.${lang}.tar.gz`,
        target = `markdown/${lfile}`,
        remote = `remote:/${target}`;

      try {
        await shell('rm', ['-rf', target, '&&', 'rm', '-rf', `clone/landing-pages_${lang}`]);
        log(`type=init, message="Rcloning ./${target}"`);
        await shell('rclone', ['--progress', 'copy', remote, 'markdown']);
      } catch (err) {
        log(`type=error, action=init, landing-page=${lang}, message="${error(err)}"`);
      }
    }
  }

  types.forEach(t => {
    languages.forEach(l => {
      try {
        const lfilename = `${t}_${l}.html`,
          lfp = path.join(__dirname, '..', 'templates', lfilename),
          lraw = fs.readFileSync(lfp, {encoding: 'utf8'}),
          escaped = lraw.replace(/(\w)\\'(\w)/g, '$1\\\\\'$2');

        templates.set(lfilename, escaped);
      } catch (err) {
        log(`type=error, action=types, message="${error(err)}"`);
      }
    });

    if (hasSubtypes.includes(t)) {
      subtypes.forEach(s => [s, s.replace(/s$/, '')].forEach(ss => languages.forEach(l => {
        try {
          const filename = `${t}-${ss}_${l}.html`,
            fp = ss === 'landing' ? path.join(__dirname, '..', 'templates', filename) : path.join(__dirname, '..', 'templates', 'views', filename),
            raw = fs.readFileSync(fp, {encoding: 'utf8'});

          templates.set(filename, raw);
        } catch (err) {
          log(`type=error, action=types, message="${error(err)}"`);
        }
      })));
    }
  });

  // Priming cache
  await solutions();

  return {templates, syncMongo, syncTranslations, admonitions};
};
