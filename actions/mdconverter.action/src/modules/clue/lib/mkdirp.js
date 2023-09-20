'use strict';

const {mkdir} = require('fs').promises;

module.exports = arg => mkdir(arg, {recursive: true});
