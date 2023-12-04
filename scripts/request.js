// TODO: To be modified once we explore all other APIs
/**
 * Fetches data from a specified URL using the Fetch API.
 *
 * @param {string} url - The URL from which to fetch the data.
 * @param {object} options - Options for the fetch request (default: { method: 'GET', headers: {}, body: null }).
 * @param {string} options.method - The HTTP method for the request (default: 'GET').
 * @param {object} options.headers - Headers to include in the request (default: {}).
 * @param {any} options.body - The request body (default: null).
 * @returns {Promise<Response>} A promise that resolves to the response from the fetch request.
 * @throws {Error} If an error occurs during the fetch request.
 */
export default async function fetchData(url, options = { method: 'GET', headers: {}, body: null }) {
  if (options.method === 'GET' || options.method === 'HEAD') {
    delete options.body;
  }
  const response = await fetch(url, options);
  return response;
}

export function hash(arg = '') {
  const nth = arg.length;
  let result = 0;

  if (nth > 0) {
    // eslint-disable-next-line
    let i = -1,
      chr;

    // eslint-disable-next-line
    while (++i < nth) {
      // eslint-disable-next-line
      chr = arg.charCodeAt(i);
      // eslint-disable-next-line
      result = (result << 5) - result + chr;
      // eslint-disable-next-line
      result |= 0;
    }
  }

  return result;
}

export const headerKeys = {
  accept: 'accept',
  apiKey: 'x-api-key',
  auth: 'authorization',
  csrf: 'x-csrf-token',
  ctype: 'content-type',
  lang: 'accept-language',
};

// eslint-disable-next-line
export const headerValues = {
  html: 'text/html',
  json: 'application/json',
};

// eslint-disable-next-line
export const lang = document.querySelector('html').lang;
export const origin = 'https://experienceleague.adobe.com/';

const requests = new Map();

export async function request(uri, options = { method: 'GET', headers: {}, body: '', params: {} }) {
  const url = new URL(uri.includes('://') ? uri : `${origin}${uri}`);

  if (url.href.startsWith(origin)) {
    let llang = lang;

    if (llang.length > 0) {
      if (url.searchParams.has('lang') === false) {
        url.searchParams.set('lang', llang);
      } else {
        llang = url.searchParams.get('lang');
      }

      if ('accept-language' in options.headers === false) {
        options.headers[headerKeys.accept] = `${llang};q=0.9`;
      }
    }
  }

  if (options.params || Object.keys(options.params).length > 0) {
    url.search = new URLSearchParams(options.params).toString();
  }

  const key = `${options.method || 'GET'}_${hash(url.href)}_${hash(options.headers[headerKeys.auth] || 'anon')}_${hash(
    JSON.stringify(options.body || ''),
  )}`;

  if (requests.has(key) === false) {
    if (options.method === 'GET' || options.method === 'HEAD') {
      delete options.body;
    }

    const promise = fetch(url.href, options)
      .then((arg) => {
        requests.delete(key);

        return arg;
      })
      .catch((err) => {
        requests.delete(key);

        throw err;
      });

    requests.set(key, promise);
  }

  // Returns cloned response to handle potential 1-n relationship
  return requests.get(key).then((arg) => arg.clone());
}
