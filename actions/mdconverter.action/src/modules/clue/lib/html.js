'use strict';

const path = require('path'),
  {afm} = require('adobe-afm-transform'),
  n = process.env?.CL_DEBUG_STRING?.length ?? 0,
  converter = require(path.join(__dirname, 'converter.js'));

function html (arg = '', map = {}, labels = {}) {
  let result = '';

  if (arg.length > 0) {
    let tmp;

    if (n > 0 && arg.includes(process.env.CL_DEBUG_STRING || '')) {
      void 0;
    }

    try {
      tmp = afm(arg, 'extension', converter, map, labels);
    } catch (err) {
      tmp = afm(arg.replace(/>[^\n]\s*```/g, '>```'), 'extension', converter, map, labels);
    }

    result = converter(tmp);
  }

  return result;
}

module.exports = html;
