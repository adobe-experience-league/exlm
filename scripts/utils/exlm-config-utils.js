// Lazily initialised — null until the first getExlmConfig() call.
// Deferred so window.hlx.codeBasePath is guaranteed to be set by setup() before the URL is read.
let exlmConfigPromise = null;

function fetchExlmConfig() {
  if (!exlmConfigPromise) {
    try {
      exlmConfigPromise = fetch(`${window.hlx.codeBasePath}/exlm-config.json`, {
        signal: AbortSignal.timeout(5000),
      })
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then(({ data = [] }) => new Map(data.map(({ key, value }) => [key, value])))
        .catch(() => new Map());
    } catch {
      exlmConfigPromise = Promise.resolve(new Map());
    }
  }
  return exlmConfigPromise;
}

export async function getExlmConfig(key) {
  const config = await fetchExlmConfig();
  return config.get(key) ?? null;
}

export async function isDomainAllowed(configKey, hostname = window.location.hostname) {
  const raw = await getExlmConfig(configKey);
  const domains = raw
    ? raw
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
    : [];
  return domains.includes(hostname);
}
