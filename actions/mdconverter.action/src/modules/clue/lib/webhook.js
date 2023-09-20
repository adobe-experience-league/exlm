'use strict';

const path = require('path'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  url = process.env.CL_DOCID_API_URL || 'https://git.corp.adobe.com/api/v3/repos/{owner}/{repo}/hooks',
  webhookDisable = process.env.CL_DOCID_WEBHOOK_DISABLE === 'true',
  webhookEnable = process.env.CL_DOCID_WEBHOOK_ENABLE === 'true',
  webhookURL = process.env.CL_DOCID_WEBHOOK_URL || '';

async function request (uri = '', method = 'GET', body = '') {
  let res, result;

  try {
    const opts = {
      headers: {
        accept: 'application/vnd.github.v3+json'
      },
      method
    };

    if (method === 'PATCH' || method === 'POST' || method === 'PUT') {
      opts.headers['content-type'] = 'application/json';
      opts.body = body.length > 0 ? body : void 0;
    }

    res = await fetch(uri, opts);

    const data = await res.json();

    result = [data, res.ok, res.status];
  } catch (err) {
    log(`type=error, uri="${uri}", message="${error(err)}"`);
    result = [err, false, res !== void 0 ? res.status : 0];
  }

  return result;
}

async function webhook (uri = '', active = false) {
  let owner = uri.replace(/^[^\:]+\:/, '').replace(/\/.*$/, '') || '',
    repo = (uri.split('/')[1] || '').replace(/\.git$/, ''),
    luri = url.replace('{owner}', owner).replace('{repo}', repo),
    result;

  if (webhookDisable || webhookEnable && owner.length > 0 && repo.length > 0 && webhookURL.length > 0) {
    const [data, ok, status] = await request(luri, 'get');

    if (ok && status === 200) {
      const hook = data.filter(i => i.config.url === webhookURL)[0] || null;

      if (hook !== null && hook.active !== active && ((active && webhookEnable) || (active === false && webhookDisable))) { // eslint-disable-line no-extra-parens
        const nurl = new URL(luri);

        nurl.pathname = new URL(hook.url).pathname;
        hook.active = active;

        const [hdata, hok, hstatus] = await request(nurl.href, 'PATCH', JSON.stringify(hook));

        result = hdata !== null && hok && hstatus < 400;
      } else {
        result = false;
      }
    } else {
      result = false;
    }

    log(`origin=webhook, owner=${owner}, repo=${repo}, active=${active}, enable=${webhookEnable}, disable=${webhookDisable}, success=${result}, message="${active ? 'Enabled' : 'Disabled'} webhook for ${repo}"`);
  } else {
    result = false;
    log(`type=error, origin=webhook, owner=${owner}, repo=${repo}, active=${active}, enable=${webhookEnable}, disable=${webhookDisable}, success=false, message="Webhook management not possible"`);
  }

  return result;
}

module.exports = webhook;
