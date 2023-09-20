'use strict';

const path = require('path'),
  log = require(path.join(__dirname, 'log.js')),
  shell = require(path.join(__dirname, 'shell.js'));

module.exports = async (fpPath = '', type = '', active = true, msg = '') => {
  // TODO: Put this back in so commits can occur
  const cmds = [
    ['status', '--porcelain']
    // ['add', '.'],
    // ['commit', '--quiet', '-m', msg.length > 0 ? `"${msg}"` : `"Updating ${type}"`],
    // ['push', '--quiet', '--force']
  ];
  console.log(msg);

  for (const cmd of cmds) {
    try {
      log(`type=commit, action=exec, cmd="git ${cmd.join(' ')}", type=${type}`);

      if (active) {
        await shell('git', cmd, fpPath);
      }
    } catch (err) {
      log(`type=error, origin=commit, cmd="git ${cmd.join(' ')}", type=${type}, message="${err.message}"`);
    }
  }
};
