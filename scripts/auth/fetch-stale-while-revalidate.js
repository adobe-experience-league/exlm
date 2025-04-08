/**
 * implements stale-while-revalidate caching strategy with a TTL.
 * Meaning that the cache will always serve stale data while revalidating the data in the background.
 * Additionally, new data will only be fetched if the TTL has passed.
 * Assumes JSON responses.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#stale-while-revalidate
 */

/**
 * The expiration time for the cache in milliseconds
 * @type {number}
 */
const CACHE_EXPIRATION_TIME = 5000; // 5 seconds

const cacheKeyPrefix = 'exl-fetch-cache';
const cacheTimestampPrefix = 'exl-fetch-cache-timestamp';
const base64String = (data) => btoa(JSON.stringify(data));
const getCacheKey = (url, options) => `${cacheKeyPrefix}_${url}_${base64String(options)}`;
const getCacheTimestampKey = (url, options) => `${cacheTimestampPrefix}_${url}_${base64String(options)}`;

const promises = new Map();

const FORCE_REFRESH_METHODS = ['PATCH', 'POST', 'PUT', 'DELETE'];

/**
 * Custom fetch function that serves stale data while revalidating
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - The options for the fetch request
 * @returns {Promise<any>} A promise that resolves with the response data
 */
export default async function fetchStaleWhileRevalidate(url, options, forceRefresh = false) {
  if (FORCE_REFRESH_METHODS.includes(options.method)) {
    // eslint-disable-next-line no-param-reassign
    forceRefresh = true;
  }
  const cacheKey = getCacheKey(url, options);
  const cacheTimestampKey = getCacheTimestampKey(url, options);
  const cachedData = sessionStorage.getItem(cacheKey);
  const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);

  const currentTime = Date.now();

  const doFetchAndCache = async () => {
    // console.debug('[fetcher] fetching new data', url);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(cacheTimestampKey, currentTime.toString());
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch failed:', err);
      // if the fetch failed, return the cached data
      return cachedData ? JSON.parse(cachedData) : null;
    }
  };

  if (forceRefresh) {
    return doFetchAndCache();
  }

  const fetchAndCache = async () => {
    if (promises.has(cacheKey)) {
      return promises.get(cacheKey);
    }
    const promise = doFetchAndCache();
    promises.set(cacheKey, promise);
    return promise;
  };

  if (cachedData && cacheTimestamp) {
    const expired = Date.now() - parseInt(cacheTimestamp, 10) > CACHE_EXPIRATION_TIME;
    // if the data is expired, fetch and cache the new data
    if (expired) fetchAndCache();
    // eslint-disable-next-line no-console
    // console.debug('[fetcher] serving stale data', url);
    return JSON.parse(cachedData);
  }
  return fetchAndCache();
}
