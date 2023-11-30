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
