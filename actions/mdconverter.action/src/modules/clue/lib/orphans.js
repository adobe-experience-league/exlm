'use strict';

const path = require('path'),
  {chunk} = require('retsu'),
  mongo = require(path.join(__dirname, 'mongo.js')),
  clone = require(path.join(__dirname, 'clone.js')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js'));

module.exports = async (store = {}, file = '*', filenames = [], sync = true) => {
  const docs = (file === '*' ? store.find({Archived: false, Markdown: true}, true).filter(i => 'action' in i === false && 'File' in i && i.Publish === true && filenames.includes(i.File)) : store.find({File: file, Markdown: true}, true)).filter(i => 'action' in i === false && i.Publish === true && i.Archived !== true).map(i => {
      const x = clone(i);

      x.Archived = true;
      delete x.id;
      delete x.Tags;
      delete x['Added UTC'];
      delete x['Updated UTC'];
      delete x.timestamp;
      delete x.docId;

      return {id: i.id, fields: x};
    }),
    nth = docs.length;

  if (sync && nth > 0) {
    log(`type=orphans, message="Preparing to archive ${nth} record${nth === 1 ? '' : 's'}"`);

    for (const recs of chunk(docs, 10)) {
      try {
        for (const rec of recs) {
          await mongo('articles_en', 'set', rec.id, {$set: rec.fields});
        }
      } catch (err) {
        log(`type=error, origin=orphans, message="${error(err)}"`);
      }
    }
  }

  return nth;
};
