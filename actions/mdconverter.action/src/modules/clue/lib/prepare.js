'use strict';

module.exports = (arg = '') => (/(\s|\&)/).test(arg) ? `"${arg}"` : arg;
