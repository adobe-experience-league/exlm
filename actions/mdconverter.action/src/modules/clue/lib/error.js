'use strict';

const path = require('path'),
  {logging} = require(path.join(__dirname, '..', 'configs', 'config.json'));

module.exports = err => logging.stack ? err.stack || err.message : err.message || err;
