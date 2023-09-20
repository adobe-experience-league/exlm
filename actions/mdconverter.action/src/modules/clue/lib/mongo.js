'use strict';

const path = require('path'),
  {URL} = require('url'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  config = Object.assign(require(path.join(__dirname, '..', 'configs', 'mongo.json')), {url: process.env.CL_MONGO_URL || 'mongodb://localhost:27017/dx-ig'}),
  parsed = new URL(config.url.includes(',') ? config.url.replace(/\/.*,/, '//') : config.url),
  dbName = parsed.pathname.replace(/^\//, ''),
  {MongoClient, ObjectId} = require('mongodb'),
  concern = {
    writeConcern: {
      w: 1,
      j: false,
      wtimeout: 1000
    }, safe: true
  };
let client;

if (config.url.includes(',') === false || process.env.CL_MONGO_MANAGED === 'true') {
  delete config.options.readPreference;
  delete config.options.replicaSet;
}

const configJson = JSON.stringify(config);

function prepare (arg) {
  if (arg !== null && arg !== void 0) {
    delete arg._id;
  }

  return arg;
}

function cmd (collection, op = 'get', key = '', data = null, limit = 1, sanitize = true, projection = void 0, find = {}, sort = void 0, silent = true) {
  if (silent === false) {
    log(`type=mongo, action=cmd, collection=${collection}, op=${op}, key=${key || null}, data=${data === null ? null : '****'}, limit=${limit}, sanitize=${sanitize}, projection=${projection !== void 0 ? JSON.stringify(projection) : null}`);
  }

  return new Promise(async (resolve, reject) => {
    let valid = true;

    if (client === void 0) {
      try {
        const arg = JSON.parse(configJson); // Cheap shallow clone

        if (arg.url.includes('maxPoolSize') === false) {
          arg.url += `${arg.url.includes('?') ? '&' : '?'}maxPoolSize=200`;
          log('type=mongo, action=connection, message="Setting \'maxPoolSize\' to 200; unspecified"');
        }

        client = await MongoClient.connect(arg.url, arg.options);
      } catch (err) {
        valid = false;
        reject(err);
      }
    }

    if (valid) {
      const db = client.db(dbName),
        coll = db.collection(collection),
        record = key instanceof ObjectId || key.length > 0,
        cb = (err, result) => {
          if (err !== null && err !== void 0) {
            reject(err);
          } else {
            resolve(result);
          }
        };

      if (op === 'get') {
        coll.find(record ? {_id: key} : find, projection !== void 0 ? {projection} : void 0).sort(sort).limit(record ? 1 : limit).toArray((err, recs) => {
          if (err !== null && err !== void 0) {
            reject(err);
          } else if (sanitize) {
            resolve(record ? prepare(recs[0] || null) : recs.map(i => prepare(i)));
          } else {
            resolve(record ? recs[0] || null : recs);
          }
        });
      }

      if (op === 'remove') {
        if (Array.isArray(data) && data.length > 0) {
          coll.deleteMany({_id: {$in: data}}, concern, cb);
        } else if (record) {
          coll.deleteOne({_id: key}, concern, cb);
        } else {
          coll.deleteMany({}, concern, cb);
        }
      }

      if (op === 'set') {
        if (record) {
          coll.updateOne({_id: key}, data, concern, cb);
        } else if (Array.isArray(data) && data.length > 0) {
          coll.insertMany(data, concern, cb);
        } else {
          resolve([]);
        }
      }
    }
  }).catch(err => {
    if (err.message.indexOf('duplicate key error') === -1) {
      log(`type=error, origin=mongo, action=catch, message="${error(err)}", collection=${collection}, op=${op}, key=${key}, limit=${limit}, sanitize=${sanitize}, data=${JSON.stringify(data)}`);
    }

    return key.length === 0 ? [] : null;
  });
}

module.exports = cmd;
