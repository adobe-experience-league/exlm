'use strict';

const path = require('path'),
  log = require(path.join(__dirname, 'log.js')),
  shell = require(path.join(__dirname, 'shell.js'));

async function locstrings () {
  const src = 'loc-string-tables.tar.gz';
  let result = path.join(__dirname, '..', 'clone', 'loc-string-tables');
  const args = ['-p', result, '&&', 'rm', '-rf', `${result}/*`, '&&', 'unpigz', '<', src, '|', 'tar', '-xC', result];

  log('type=locstrings, thread=main, file=loc-string-tables.tar.gz, message="Decompressing loc-string-tables.tar.gz"');

  try {
    await shell('mkdir', args, path.join(process.cwd(), 'loc-string-tables'));
  } catch (err) {
    const target = path.join(process.cwd(), 'loc-string-tables', src);

    log(`type=error, origin=locstrings, thread=main, file=${src}, message="Failed to decompress ${src}; retrying"`);
    await shell('rm', ['-rf', target]);
    log(`type=locstrings, thread=main, file=${src}, message="Erased erroneous file on disk and resyncing"`);
    await shell('rclone', ['--progress', 'sync', 'remote:/loc-string-tables', 'loc-string-tables']);
    log(`type=locstrings, thread=main, file=${src}, message="Decompressing ${src}", retry=true`);

    try {
      await shell('mkdir', args, path.join(process.cwd(), 'loc-string-tables'));
    } catch (err2) {
      log(`type=error, origin=locstrings, thread=main, file=${src}, message="Failed to decompress ${src}; aborting"`);
      result = '';
    }
  }

  return result;
}

module.exports = locstrings;
