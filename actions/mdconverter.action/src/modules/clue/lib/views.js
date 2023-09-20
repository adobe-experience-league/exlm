'use strict';

const path = require('path'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js'));

function views (args = new Map()) {
  const templates = new Map();

  for (const [filename, html] of args.entries()) {
    templates.set(filename, data => {
      let result = '';

      if (data !== void 0) {
        void 0;
      }

      try {
        result = eval('`' + html + '`'); // eslint-disable-line no-eval
      } catch (err) {
        log(error(err), 'error');
      }

      return result;
    });
  }

  return templates;
}

module.exports = views;
