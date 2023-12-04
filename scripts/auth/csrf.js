import { JWTTokenUrl } from '../urls.js';
import { JWT } from '../session-keys.js';
import fetchData from '../request.js';

// Token expiration time in milliseconds (5 minutes)
const expiry = 3e5;

// Map to store CSRF tokens for different URIs
const tokens = new Map();

// Map to store timers for token expiration
const timers = new Map();

/**
 * Generates a hash value for the given string.
 * @param {string} arg - The string to hash.
 * @returns {number} The hash value generated from the input string.
 */
function hash(arg = '') {
  const nth = arg.length;
  let result = 0;
  if (nth > 0) {
    let i = -1;
    let chr;

    // eslint-disable-next-line no-plusplus
    while (++i < nth) {
      chr = arg.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      result = (result << 5) - result + chr;
      // eslint-disable-next-line no-bitwise
      result |= 0;
    }
  }

  return result;
}

/**
 * Retrieves or generates a CSRF token for the specified URI.
 *
 * @param {string} uri - The URI for which to retrieve the CSRF token.
 * @returns {Promise<string>} A promise that resolves with the CSRF token.
 */
export default async function csrf(uri = JWTTokenUrl) {
  let result = tokens.get(uri) || '';

  if (result.length === 0) {
    try {
      // Fetch CSRF token from the server
      const res = await fetchData(uri, {
        method: 'HEAD',
        credentials: 'include',
        headers: JWT in sessionStorage ? { authorization: sessionStorage.getItem(JWT) } : {},
      });

      if (res.ok && res.status >= 200 && res.status < 400) {
        result = res.headers.get('x-csrf-token') || '';

        if (result.length > 0) {
          const key = `${'CSRFTimer'}:${hash(uri)}`;

          // Store the CSRF token
          tokens.set(uri, result);

          // Clear existing timer if present
          if (timers.has(key)) {
            clearTimeout(timers.get(key));
          }

          // Set a new timer for token expiration
          timers.set(
            key,
            setTimeout(() => {
              timers.delete(key);
              tokens.delete(uri);
              // eslint-disable-next-line no-console
              console.warn(`Expired CSRF token for ${uri}`);
            }, expiry),
          );
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to retrieve CSRF token; header not found or empty');
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to retrieve CSRF token; server error response');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to retrieve CSRF token; something went wrong');
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('Reused CSRF token');
  }

  return result;
}
