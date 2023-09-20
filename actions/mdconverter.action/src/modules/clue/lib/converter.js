'use strict';

const path = require('path'),
  mdConfig = require(path.join(__dirname, '..', 'configs', 'markdownit.json')),
  mdAnchorConfig = require(path.join(__dirname, '..', 'configs', 'markdownit-anchor.json')),
  mdAttrsConfig = require(path.join(__dirname, '..', 'configs', 'markdownit-attrs.json')),
  markdownit = require('markdown-it'),
  attrs = require('markdown-it-attrs'),
  anchor = require('markdown-it-anchor'),
  abbr = require('markdown-it-abbr'),
  collapsible = require('markdown-it-collapsible'),
  container = require('markdown-it-container'),
  deflist = require('markdown-it-deflist'),
  footnote = require('markdown-it-footnote'),
  ins = require('markdown-it-ins'),
  mark = require('markdown-it-mark'),
  sub = require('markdown-it-sub'),
  sup = require('markdown-it-sup'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js'));

function converter (arg = '') {
  let result;

  if (arg.length > 0) {
    const md = markdownit(mdConfig);

    md.use(abbr)
      .use(attrs, mdAttrsConfig)
      .use(anchor, mdAnchorConfig)
      .use(collapsible)
      .use(container, 'warning')
      .use(deflist)
      .use(footnote)
      .use(ins)
      .use(mark)
      .use(sub)
      .use(sup);

    try {
      result = md.render(arg);
    } catch (err) {
      try {
        result = md.render(arg.replace(/>[^\n]\s*```/g, '>```'));
        log('type=error, origin=converter, rewrite=true');
      } catch (lerr) {
        log(`type=error, origin=converter, rewrite=false, compile=false, message="${error(err)}"`);
        result = arg;
      }
    }
  } else {
    result = arg;
  }

  return result;
}

module.exports = converter;
