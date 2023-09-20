'use strict';

const path = require('path'),
  {parentPort, threadId, workerData} = require('worker_threads'),
  decompress = require(path.join(__dirname, 'decompress.js')),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  mongo = require(path.join(__dirname, 'mongo.js')),
  transform = require(path.join(__dirname, 'transform.js')),
  views = require(path.join(__dirname, 'views.js'));

(async function () {
  const result = [],
    invalid = [],
    admonitions = new Map(workerData.admonitions || []),
    manifests = new Map(workerData.manifests || []),
    templates = views(new Map(workerData.templates || [])),
    timestamp = new Date().toISOString();

  for (const i of workerData.chunk) {
    let folder = await decompress(i.File_branch || i.File, threadId),
      valid = folder.length > 0;

    if (valid) {
      i.folder = folder;

      if (manifests.has(i.File)) {
        i.manifest = manifests.get(i.File);
      }

      try {
        const x = await transform(i, threadId, void 0, templates, admonitions);

        result.push(x);
      } catch (err) {
        invalid.push({
          tarball: i.File,
          source: i.folder,
          path: i.ready,
          error: err.message,
          timestamp
        });
        log(`type=error, origin=worker, thread=${threadId}, action=worker, file=${i.File}, message="${err !== void 0 ? error(err) : 'Unknown error'}"`);
      }
    } else {
      invalid.push({
        tarball: i.File,
        source: null,
        path: null,
        error: 'Could not decompress tarball',
        timestamp
      });
    }
  }

  parentPort.postMessage({valid: result, invalid});

  if (invalid.length > 0) {
    try {
      await mongo('builds', 'set', void 0, invalid);
    } catch (err) {
      log(`type=error, origin=worker, thread=${threadId}, action=mongo, message="${error(err)}"`);
    }
  }
}());
