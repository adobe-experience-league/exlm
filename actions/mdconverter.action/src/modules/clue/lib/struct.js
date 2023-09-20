'use strict';

function struct (arg = '') {
  const delimiter = arg.includes('\r\n') ? '\r\n' : '\n',
    split = (/^---\r?\n/).test(arg),
    sections = split ? arg.replace(/^---\r?\n/, '').split(/\r?\n---\r?\n/g) : [],
    meta = split ? sections[0].trim() : '',
    body = split ? sections.slice(1, sections.length).join(`${delimiter}---${delimiter}`).trim() : arg.trim();

  return {meta, body};
}

module.exports = struct;
