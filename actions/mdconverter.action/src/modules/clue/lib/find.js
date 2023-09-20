'use strict';

const keysort = require('keysort');

function find (arg = {}, store = {}, id = '') {
  let results = [];

  if (id.length > 0) {
    results = store.find({docId: id}, true);
  }

  if (results.length === 0) {
    results = store.find({Markdown: true, URL: arg.uri}, true) || store.find({Markdown: true, URL: `https://experienceleague.adobe.com${arg.uri}`}, true);
  }

  return results.length > 1 ? keysort(results, 'timestamp desc')[0] : results[0];
}

module.exports = find;
