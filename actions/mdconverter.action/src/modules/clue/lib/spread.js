'use strict';

function spread (arg = [], divisor = 1) {
  const result = [];
  let i = -1;

  while (++i < divisor) {
    result.push([]);
  }

  i = -1;

  for (const rec of arg) {
    result[++i].push(rec);

    if (i + 1 === divisor) {
      i = -1;
    }
  }

  return result;
}

module.exports = spread;
