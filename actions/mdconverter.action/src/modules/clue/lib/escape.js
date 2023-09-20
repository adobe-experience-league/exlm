'use strict';

function escape (arg = '') {
  return arg.replace(/[\-\[\]{}()*+?.,\\\^\$|#]/g, '\\$&');
}

module.exports = escape;
