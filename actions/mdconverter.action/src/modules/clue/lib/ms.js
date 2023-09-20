'use strict';

module.exports = (arg, fixed = 2) => Number(arg / 1e6).toFixed(fixed);
