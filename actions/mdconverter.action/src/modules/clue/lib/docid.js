'use strict';

const path = require('path'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  domain = 'https://experienceleague.adobe.com',
  api = process.env.CL_EXL_STRIKER !== void 0 ? new URL(`${domain}/api/striker/docid?secret=${process.env.CL_EXL_STRIKER}`).href : null;

async function request (uri = '') {
  let res, result;

  try {
    res = await fetch(uri, {
      headers: {
        accept: 'application/json'
      }
    });

    const data = await res.json();

    result = [res.ok ? data.data : data.error, res.ok, res.status];
  } catch (err) {
    log(`type=error, uri="${uri}", message="${error(err)}"`);
    result = [err, false, res !== void 0 ? res.status : 0];
  }

  return result;
}

// Gets and/or sets a 'docid' record based on `uri`; an overwrite is possible via `update` parameter
async function docid (uri = '', id = '', lang = '') {
  let commit = false,
    update = false,
    result = '';

  if (lang === 'en') {
    const url = new URL(api),
      verify = uri.length > 0 && id.length > 0;

    if (verify) {
      url.searchParams.set('docid', id);
    } else {
      url.searchParams.set('url', uri);
    }

    const [output, valid, status] = await request(url.href);

    url.searchParams.delete('secret');
    log(`type=docid, action=assign, update=false, reset=false, uri="${uri}", output=${output}, valid=${valid}, status=${status}, lang=${lang}, url="${url.href}"`);

    if (verify) {
      if (valid && output !== uri) {
        const vurl = new URL(api);

        vurl.searchParams.set('docid', id);
        vurl.searchParams.set('url', uri);
        vurl.searchParams.set('update', 'true');
        update = true;

        const [voutput, vvalid, vstatus] = await request(vurl.href);

        result = vvalid ? voutput || '' : '';
        commit = vvalid;
        vurl.searchParams.delete('secret');
        log(`type=docid, action=assign, update=${update}, reset=false, uri="${uri}", output=${voutput}, valid=${vvalid}, status=${vstatus}, lang=${lang}, url="${vurl.href}"`);
      } else if (valid) {
        result = id;
        commit = false;
      } else {
        const vurl = new URL(api);

        vurl.searchParams.set('url', uri);

        const [voutput, vvalid, vstatus] = await request(vurl.href);

        result = vvalid ? voutput || '' : '';
        commit = vvalid;
        vurl.searchParams.delete('secret');
        log(`type=docid, action=assign, update=false, reset=true, uri="${uri}", output=${voutput}, valid=${vvalid}, status=${vstatus}, lang=${lang}, url="${vurl.href}"`);
      }
    } else if (valid) {
      result = output;
      commit = true;
    }

    log(`type=docid, action=assign, url=${uri}, id="${result || ''}", commit=${commit}", reused=false, lang=${lang}`);
  } else {
    result = id;
    log(`type=docid, action=assign, url=${uri}, id="${result || ''}", commit=${commit}", reused=true, lang=${lang}`);
  }

  return [result, commit];
}

log(`type=docid, active=${api !== null}`);
module.exports = api !== null ? docid : async () => ['', false];
