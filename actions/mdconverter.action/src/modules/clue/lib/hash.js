'use strict';

const path = require('path'),
  mmh = require('murmurhash3js').x64.hash128,
  config = require(path.join(__dirname, '..', 'configs', 'config.json'));

function hash (arg) {
  return mmh(arg, config.seed);
}

module.exports = hash;
