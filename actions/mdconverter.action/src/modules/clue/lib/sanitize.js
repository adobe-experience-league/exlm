'use strict';

const path = require('path'),
  validate = require(path.join(__dirname, 'validate.js')),
  domain = process.env.CL_DOMAIN || '',
  clean = [
    'description',
    'manager',
    'name',
    'title'
  ];

function scrub (arg = '', pathname = false) {
  let result = arg;

  if (arg.includes(domain)) {
    const url = new URL(arg);

    if (url.pathname !== '/') {
      url.searchParams.delete('lang');
    }

    result = pathname ? `${url.pathname}${url.search}${url.hash}` : url.href;
  }

  return result;
}

function sanitize (arg = {}, decorate = false) {
  if (arg._id) {
    arg = Object.assign({}, {id: arg._id}, arg);
    delete arg._id;
  }

  if (arg.URL !== void 0) {
    arg.URL = scrub(arg.URL, false);
  }

  for (const key of Object.keys(arg)) {
    if (validate(arg[key], 'string', '') && clean.some(i => new RegExp(i, 'i').test(key))) {
      arg[key] = arg[key].replace(/\’/g, '\'')
        .replace(/\“|\”/g, '"')
        .replace(/\—/g, '-')
        .replace(/\–/g, '-')
        .replace(/[^\x00-\x7F]/g, ' ')
        .replace(/\s{2,}/g, ' ').trim();
    }
  }

  if (decorate) {
    arg.Archived = arg.Archived === true;
    arg.Publish = arg.Publish === true;
    arg.Ignore = arg.Ignore === true;

    if ('Added UTC' in arg) {
      arg.timestamp = new Date(arg['Added UTC']).getTime();
    }
  }

  return arg;
}

module.exports = sanitize;
