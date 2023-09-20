'use strict';

const path = require('path'),
  {writeFile} = require('fs').promises,
  {stringify} = require('yaml'),
  {tracking} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  {msg} = require(path.join(__dirname, '..', 'configs', 'github.json')),
  commit = require(path.join(__dirname, 'commit.js')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  meta = require(path.join(__dirname, 'meta.js')),
  readfile = require(path.join(__dirname, 'readfile.js')),
  shell = require(path.join(__dirname, 'shell.js')),
  struct = require(path.join(__dirname, 'struct.js')),
  validate = require(path.join(__dirname, 'validate.js')),
  webhook = require(path.join(__dirname, 'webhook.js')),
  fpRoot = path.join(__dirname, '..', 'track'),
  lmsg = validate(process.env.CL_GITHUB_TRACKING_MSG, 'string', '') ? process.env.CL_GITHUB_TRACKING_MSG : msg,
  prepend = `https://${process.env.CL_GITHUB_TRACKING_TOKENS}`;

async function track (args = []) {
  for (const arg of args) {
    const files = arg.files.filter(i => i.commit);

    if (files.length > 0) {
      const fpTarget = path.join(fpRoot, arg.File.replace('.en.tar.gz', '')),
        lurl = new URL(`${prepend}@${arg.URL.split('@')[1].replace('.com:', '.com/')}`);
      let n = 0,
        fpGitPath = '',
        fpPath = '';

      try {
        await shell('rm', ['-rf', fpTarget, '&&', 'git', 'clone', lurl, fpTarget], fpRoot);

        for (const file of files) {
          fpGitPath = file.meta.pipeline_filename;
          fpPath = path.join(fpTarget, fpGitPath);

          const raw = await readfile(fpPath),
            structure = struct(raw),
            delimiter = raw.includes('\r\n') ? '\r\n' : '\n',
            lmeta = meta(structure.meta, void 0, arg.lang, false, false);
          let update = false;

          if (tracking in lmeta === false || lmeta[tracking] !== file.meta[tracking]) {
            lmeta[tracking] = file.meta[tracking];
            update = true;
          }

          if (update) {
            delete lmeta['build-date'];
            structure.meta = stringify(lmeta, void 0, {lineWidth: 0, singleQuote: true}).trim();
            await writeFile(fpPath, `---${delimiter}${structure.meta}${delimiter}---${delimiter}${structure.body}${delimiter}`, {encoding: 'utf8'});
            n++;
          }
        }
      } catch (err) {
        log(`type=error, origin=track, file="${fpPath}", message="${error(err)}"`);
      }

      if (n > 0) {
        await webhook(arg.URL, false);
        await commit(fpTarget, 'docid', true, lmsg);
        await webhook(arg.URL, true);
      }
    }
  }

  return args;
}

module.exports = track;
