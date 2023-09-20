'use strict';

const path = require('path'),
  clone = require(path.join(__dirname, 'clone.js')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js'));
let cached = [];

async function solutions () {
  let result;

  if (cached.length > 0) {
    result = clone(cached);
  } else {
    try {
      const res = await fetch('https://experienceleague.adobe.com/api/solutions?page_size=1000&full=true'),
        data = await res.json();

      result = data.data || [];
      cached = clone(result);
      log(`type=solutions, size=${cached.length}, message="Retrieved & cached full solutions data"`);
    } catch (err) {
      log(`type=error, origin=solutions, message="${error(err)}"`);
      result = [];
    }
  }

  return result;
}

module.exports = solutions;
