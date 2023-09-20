'use strict';

const {URL} = require('url');

module.exports = arg => {
  const url = new URL(`https://${arg.replace(':', '/').replace('.git', '')}`),
    lpath = url.pathname.split('/'),
    repo = lpath[lpath.length - 1];

  return repo.split('.');
};
