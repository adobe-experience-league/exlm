'use strict';

const domain = 'https://experienceleague.adobe.com',
  internal = /https:\/\/experienceleague(\.corp)?\.adobe\.com/,
  relative = /^[^(http|\/)]/;

function inject (arg = '', lang = '', strip = true, puri = '') {
  const cwd = relative.test(arg),
    skip = arg.charAt(0) === '#';
  let result;

  if (skip === false) {
    const slash = cwd === false && arg.charAt(0) === '/',
      local = cwd || slash || internal.test(arg),
      reshape = arg.startsWith('..'),
      delimiter = cwd && reshape === false ? '/' : '',
      parts = reshape ? puri.split('/') : [];
    let turl;

    if (parts.length > 0) {
      parts.pop(); // current file, giving folder structure
      turl = `${parts.join('/')}/${arg}`;
    } else {
      turl = arg;
    }

    if (turl.length > 0 && local) {
      const url = new URL(cwd || slash ? `${domain}${delimiter}${turl}` : turl);

      if (local && lang.length > 0) {
        url.searchParams.set('lang', lang);
      }

      result = cwd && reshape === false ? url.href.replace(/^.*\//, '') : url.href;

      if (strip) {
        result = result.replace(new RegExp(internal.toString().replace(/^\/|\/$/g, '')), ''); // stripping domain to save bytes over the wire
      } else {
        result = result.replace(/\(\/docs/g, `(${domain}/docs`); // adding hostname if absent for rendering of markdown in API responses
      }
    } else {
      result = arg;
    }
  } else {
    result = arg;
  }

  return result;
}

module.exports = inject;
