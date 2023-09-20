'use strict';

function align (arg = '', type = '') {
  let result;

  if (type === 'menu') {
    result = arg.split('\n').map(i => i.replace(/\s{2,2}/g, '\t')).join('\n');
  } else {
    result = arg;
  }

  return result;
}

module.exports = align;
