'use strict';

const path = require('path'),
  language = require(path.join(__dirname, 'language.js')),
  log = require(path.join(__dirname, 'log.js')),
  random = require(path.join(__dirname, 'random.js')),
  shell = require(path.join(__dirname, 'shell.js'));

async function decompress (src, threadId = 0, rnd = true) {
  const tmp = path.join(__dirname, '..', 'clone', src.replace('.tar.gz', '')).split('.');
  let result = `${tmp[0].replace(/_.*$/, '')}_${language(tmp[1])}${rnd ? `_${random()}` : ''}`;
  const args = ['-p', result, '&&', 'unpigz', '<', src, '|', 'tar', '-xC', result];

  log(`type=decompress, thread=${threadId || 'main'}, file=${src}, message="Decompressing ${src}"`);

  try {
    await shell(['mkdir', ...args].join(' '), [], path.join(process.cwd(), 'markdown'));
  } catch (err) {
    const target = `markdown/${src}`;

    log(`type=error, origin=decompress, thread=${threadId || 'main'}, file=${src}, message="Failed to decompress ${src}; retrying"`);
    await shell('rm', ['-rf', target]);
    log(`type=decompress, thread=${threadId || 'main'}, file=${src}, message="Erased erroneous file on disk and re-syncing"`);
    await shell('rclone', ['--progress', 'copy', `remote:/${process.env.CL_MARKDOWN_CONTAINER || 'markdown'}/${src}`, 'markdown']);
    log(`type=decompress, thread=${threadId || 'main'}, file=${src}, message="Decompressing ${src}", retry=true`);

    try {
      await shell(['mkdir', ...args].join(' '), [], path.join(process.cwd(), 'markdown'));
    } catch (err2) {
      log(`type=error, origin=decompress, thread=${threadId || 'main'}, file=${src}, message="Failed to decompress ${src}; aborting"`);
      result = '';
    }
  }

  return result;
}

module.exports = decompress;
