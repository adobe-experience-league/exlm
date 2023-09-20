'use strict';

const path = require('path'),
  log = require(path.join(__dirname, 'log.js'));

async function retrieve (sync = true, file = '*') {
  if (sync) {
    log('type=retrieve, message="Retrieving data from Mongo"');
    await require(path.join(__dirname, 'sync.js'));

    if (file === '*' && process.env.CL_SYNC_MONGO_KILL === 'true' && process.env.CL_SITEMAPS !== 'true') {
      log('type=sync, message="Synced Mongo, shutting down"');
      process.exit(0);
    }
  }
}

module.exports = retrieve;
