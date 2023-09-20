'use strict';

const path = require('path'),
  fsPromises = require('fs').promises;

async function readdir (arg = '', opt = {encoding: 'utf8', withFileTypes: true}, attr = void 0, stat = false, filter = x => x !== null ? true : false) {
  let result = await fsPromises.readdir(arg, opt);

  result = attr !== void 0 ? result.filter(i => i[attr]() && filter(i)).map(i => i.name) : result;

  if (stat) {
    for (const [idx, i] of result.entries()) {
      result[idx] = [i, await fsPromises.stat(path.join(arg, i), {bigint: true})];
    }
  }

  return result;
}

module.exports = readdir;
