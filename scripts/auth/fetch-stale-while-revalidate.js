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
/**
 * Custom fetch function that serves stale data while revalidating
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - The options for the fetch request
 * @param {boolean} fetchFresh - Flag to bypass cache and fetch new data
 * @returns {Promise<any>} A promise that resolves with the response data
 */
export default function fetchStaleWhileRevalidate(url, options, fetchFresh = false) {
  const cacheKey = getCacheKey(url, options);
  const cacheTimestampKey = getCacheTimestampKey(url, options);
  const cachedData = sessionStorage.getItem(cacheKey);
  const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);
  const currentTime = Date.now();

  const doFetchAndCache = async () => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(cacheTimestampKey, Date.now().toString());
      promises.delete(cacheKey); // Remove promise after completion
      return data;
    } catch (err) {
      // eslint-disable-next-line
      console.error('Fetch failed:', err);
      promises.delete(cacheKey); // Remove promise on failure
      return cachedData ? JSON.parse(cachedData) : null;
    }
  };

  if (!fetchFresh && cachedData && cacheTimestamp) {
    const expired = currentTime - parseInt(cacheTimestamp, 10) > CACHE_EXPIRATION_TIME;

    if (!expired) {
      return Promise.resolve(JSON.parse(cachedData));
      // eslint-disable-next-line
    } else if (!promises.has(cacheKey)) {
      const promise = doFetchAndCache();
      promises.set(cacheKey, promise);
      return Promise.resolve(JSON.parse(cachedData));
    }
    return promises.get(cacheKey);
  }

  if (!promises.has(cacheKey)) {
    const promise = doFetchAndCache();
    promises.set(cacheKey, promise);
  }

  return promises.get(cacheKey);
}
