'use strict';

const path = require('path'),
  prepare = require(path.join(__dirname, 'prepare.js')),
  shell = require(path.join(__dirname, 'shell.js'));

module.exports = async (src, dest) => await shell('cp', ['-ap', prepare(src), prepare(dest)]);
