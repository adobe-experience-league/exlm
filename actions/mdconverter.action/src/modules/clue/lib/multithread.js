'use strict';

const path = require('path'),
  cpus = require('os').cpus().length,
  {Worker} = require('worker_threads'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  spread = require(path.join(__dirname, 'spread.js')),
  workerScript = path.join(__dirname, 'worker.js');

function terminate (worker) {
  const id = worker.threadId;

  try {
    worker.terminate();
  } catch (err) {
    log(`type=error, source=multithread, action=terminate, worker=${id}, message="${error(err)}"`);
  }
}

async function multithread (arg = [], manifests = [], templates = new Map(), admonitions = new Map()) {
  let result;

  if (arg.length > 0) {
    const promises = [],
      s = cpus < arg.length ? cpus : arg.length,
      ltemplates = Array.from(templates),
      ladmonitions = Array.from(admonitions);

    for (const chunk of spread(arg, s).values()) {
      promises.push(new Promise((resolve, reject) => {
        const worker = new Worker(workerScript, {env: process.env, workerData: {chunk, manifests, templates: ltemplates, admonitions: ladmonitions}}),
          id = worker.threadId;

        log(`type=multithread, action=worker, worker=${id}, message="Created worker ${id}"`);

        worker.once('error', msg => {
          reject(msg);
          terminate(worker);
        });

        worker.once('message', msg => {
          resolve(msg);
          terminate(worker);
        });
      }));
    }

    result = await Promise.all(promises).then(x => x.reduce((a, v) => {
      a.valid = [...a.valid, ...v.valid];
      a.invalid = [...a.invalid, ...v.invalid];

      return a;
    }, {valid: [], invalid: []}));
  } else {
    result = {valid: [], invalid: []};
    log('type=multithread, action=worker, worker=0, message="arg array is empty, nothing to do"');
  }

  return result;
}

module.exports = multithread;
