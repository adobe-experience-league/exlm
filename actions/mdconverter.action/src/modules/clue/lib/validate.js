'use strict';

module.exports = (arg, type, not) => {
  return typeof arg === type && arg !== not;
};
