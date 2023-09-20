'use strict';

const path = require('path'),
  redis = require('redis'),
  configRedis = {
    host: process.env.CL_REDIS_HOST || '',
    password: process.env.CL_REDIS_PASSWORD || void 0,
    port: process.env.CL_REDIS_PORT || 6379
  },
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  limit = process.env.CL_REDIS_RETRY_TIME_LIMIT || 36e5; // 1 hour

function retry (arg) {
  if (arg.total_retry_time >= limit) {
    log(`type=error, origin=redis, attempts=${arg.attempt}, message="Elapsed maintenance window time limit"`);
    process.exit(1);
  }

  if (arg.attempt % 3 === 0) {
    log(`type=error, origin=redis, attempts=${arg.attempt}, message="${arg.error?.message || 'unknown'}"`);
  }

  return Math.min(arg.attempt * 100, 3000);
}

configRedis.retry_strategy = retry;

module.exports = () => {
  const result = redis.createClient(configRedis);

  result.on('connect', () => log('id=listener, type=redis, event=connect, message="Connected to Redis"'));
  result.on('end', () => log('id=listener, type=redis, event=end, message="Connection to Redis closed, reconnecting"'));
  result.on('error', err => log(`id=listener, type=error, origin=redis, message="${error(err)}"`));

  return result;
};
