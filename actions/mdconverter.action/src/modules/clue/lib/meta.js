'use strict';

const path = require('path'),
  {parse} = require('yaml'),
  {levels, roles, metaSkip} = require(path.join(__dirname, '..', 'configs', 'config.json')),
  rroles = require(path.join(__dirname, '..', 'configs', 'roles.json'));

function capitalize (arg = '', lang = 'en') {
  let result = arg.trim().replace(/\s+/g, ' ');

  if (result.length > 0) {
    result = result.split(' ').map(i => {
      const first = i.charAt(0),
        variable = (/_|=/).test(arg);

      return `${isNaN(first) && variable === false ? first.toLocaleUpperCase(lang) : first}${i.slice(1)}`;
    }).join(' ');
  }

  return result;
}

function meta (arg = '', solution = [], lang = 'en', strip = true, rewrite = true, type = '') {
  const result = parse(arg.startsWith('---') ? arg.split('---')[1] : arg) || {},
    skip = rewrite ? metaSkip[type] || metaSkip['*'] : metaSkip['*'];

  if (strip) {
    for (const key of skip) {
      delete result[key];
    }
  }

  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].replace(/ &amp; /g, ' & ').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }
  }

  if (rewrite) {
    result['build-date'] = new Date().toISOString();

    if ('solution' in result === false) {
      if (solution.length > 0) {
        result.solution = solution.join(',');
      }
    } else {
      result.solution = result.solution.split(/;|,/g).map(i => i.trim()).join(',');
    }

    if ('keywords' in result) {
      const invalid = solution.map(i => i.toLowerCase());

      result.keywords = result.keywords.split(/;|,/g).map(i => capitalize(i.trim(), lang)).filter(i => i.length > 0 && invalid.includes(i.toLowerCase()) === false && i.split(' ').length < 4).join(',');

      if (result.keywords.length === 0) {
        delete result.keywords;
      }
    }

    if ('hide' in result && (/(y|True|true)/).test(result.hide)) {
      result.googlebot = result.robots = 'noindex';
    }

    if ('original-url' in result && result['original-url'].startsWith('http')) {
      result['original-url'] = new URL(result['original-url']).pathname;
    }

    if ('role' in result) {
      result.role = Array.from(new Set(result.role.split(/;|,\s*/g).map(i => rroles[i] || i).filter(i => roles.includes(i)))).join(',');
    } else {
      result.role = roles[0];
    }

    if ('level' in result) {
      result.level = Array.from(new Set(result.level.split(/;|,\s*/g).filter(i => levels.includes(i)))).join(',');
    } else {
      result.level = levels[0];
    }

    if ('keywords' in result) {
      result.keywords = result.keywords.split(/,|;/g).join(',');
    }

    if ('tags' in result) {
      result.tags = result.tags.split(/,|;/g).join(',');
    }

    if ('type' in result) {
      result.type = result.type.split(/,|;/g).join(',');
    }
  }

  return result;
}

module.exports = meta;
