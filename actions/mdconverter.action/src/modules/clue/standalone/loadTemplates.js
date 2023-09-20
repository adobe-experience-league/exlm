'use strict';
const fs = require('fs');
const path = require('path');
const { languages, types, subtypes, hasSubtypes } = require('../configs/config.json');
const views = require('../lib/views.js');

const log = console.log;
const error = console.error;

const loadTemplates = () => {
  const templates = new Map();
  types.forEach(t => {
    languages.forEach(l => {
      try {
        const lfilename = `${t}_${l}.html`;
        const lfp = path.join(__dirname, '..', 'templates', lfilename);
        const lraw = fs.readFileSync(lfp, { encoding: 'utf8' });
        const escaped = lraw.replace(/(\w)\\'(\w)/g, "$1\\\\'$2");

        templates.set(lfilename, escaped);
      } catch (err) {
        console.error(err);
      }
    });

    if (hasSubtypes.includes(t)) {
      subtypes.forEach(s => [s, s.replace(/s$/, '')].forEach(ss => languages.forEach(l => {
        try {
          const filename = `${t}-${ss}_${l}.html`, fp = ss === 'landing' ?
              path.join(__dirname, '..', 'templates', filename) :
              path.join(
                __dirname,
                '..',
                'templates',
                'views',
                filename
              ), raw = fs.readFileSync(fp, { encoding: 'utf8' });

          templates.set(filename, raw);
        } catch (err) {
          log(`type=error, action=types, message="${error(err)}"`);
        }
      })
      )
      );
    }
  });

  return views(new Map(templates || []));
};
exports.loadTemplates = loadTemplates;
