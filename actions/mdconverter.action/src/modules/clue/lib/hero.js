'use strict';

const path = require('path'),
  hero = require(path.join(__dirname, '..', 'configs', 'heroes.json'));

hero.forEach(i => {
  i.filename = new RegExp(i.filename.replace('.', '\.').replace('*', '.*'));
});

module.exports = hero;
