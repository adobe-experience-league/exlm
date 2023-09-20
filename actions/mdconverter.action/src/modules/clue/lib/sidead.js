'use strict';

const path = require('path'),
  sidead = require(path.join(__dirname, '..', 'configs', 'sideads.json'));

sidead.forEach(i => {
  i.filename = new RegExp(i.filename.replace('.', '\.').replace('*', '.*'));
});

module.exports = sidead;
