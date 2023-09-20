'use strict';

const mv = require('mv');

module.exports = (src, dest) => {
  return new Promise((resolve, reject) => {
    mv(src, dest, {mkdirp: true}, err => {
      if (err !== null && err !== void 0) {
        reject(err);
      } else {
        resolve(dest);
      }
    });
  });
};
