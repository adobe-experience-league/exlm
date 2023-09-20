'use strict';

const fs = require('fs').promises;

module.exports = arg => fs.readFile(arg, {encoding: 'utf8'});
