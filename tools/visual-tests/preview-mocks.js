(() => {
  if (window.location.href !== 'about:srcdoc') return;

  const fixtureData = document.getElementById('preview-mock-data');
  if (!fixtureData) return;

  const fixtures = new Map(JSON.parse(fixtureData.textContent));
  const { origin } = new URL(document.baseURI);
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request ? request.url : input, document.baseURI);
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const fixture = fixtures.get(url.pathname);
    if (method !== 'GET' || url.origin !== origin || !fixture) {
      return nativeFetch(input, init);
    }

    const signal = init?.signal ?? request?.signal;
    signal?.throwIfAborted();
    const { body, ...options } = fixture;
    return new Response(body, options);
  };
})();
