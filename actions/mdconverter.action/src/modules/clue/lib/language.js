'use strict';

const path = require('path'),
  {languages} = require(path.join(__dirname, '..', 'configs', 'config.json'));

function language (arg = '') {
  const x = arg.split(/;|,/g).filter(i => i.startsWith('q=') === false);
  let i = 0,
    nth = x.length,
    result;

  do {
    let g = x[i].startsWith('zh') ? x[i].replace('CN', 'Hans').replace('TW', 'Hant') : x[i];

    if (languages.includes(g)) {
      result = g;
    } else {
      g = x[i].split('-')[0];

      if (languages.includes(g)) {
        result = g;
      }
    }
  } while (result === void 0 && ++i < nth);

  return result || '';
}

module.exports = language;
