'use strict';

const path = require('path'),
  date = require(path.join(__dirname, 'date.js')),
  id = process.env.CL_ID || 'clue';

function prep (arg) {
  let result = arg;

  if (typeof arg === 'string') {
    result = `id=${id}, ${result}, pid=${process.pid}, timestamp=${date()}`;
  }

  return result;
}

module.exports = process.env.NODE_ENV === 'testing' ? () => void 0 : (arg, target = 'log') => {
  console[target](prep(arg));
};
