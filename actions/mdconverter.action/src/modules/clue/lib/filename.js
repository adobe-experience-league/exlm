'use strict';

function filename (arg = '') {
  return arg.endsWith('.md') ? arg.replace(/\.md$/, '.html') : arg;
}

module.exports = filename;
