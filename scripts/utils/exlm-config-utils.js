// Lazily initialised — null until the first getExlmConfig() call.
// Deferred so window.hlx.codeBasePath is guaranteed to be set by setup() before the URL is read.
let exlmConfigPromise = null;

function fetchExlmConfig() {
  if (!exlmConfigPromise) {
    exlmConfigPromise = fetch(`${window.hlx.codeBasePath}/exlm-config.json`, {
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then(({ data = [] }) => new Map(data.map(({ key, value }) => [key, value])))
      .catch(() => new Map());
  }
  return exlmConfigPromise;
}

/**
 * Returns the raw string value for a given key from exlm-config.json, or null if not found.
 * The fetch is shared across all callers — no duplicate network requests.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export default async function getExlmConfig(key) {
  const config = await fetchExlmConfig();
  return config.get(key) ?? null;
}
