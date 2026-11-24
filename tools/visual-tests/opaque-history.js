export default async function installOpaqueHistoryGuard(page) {
  await page.addInitScript(() => {
    // Sidekick examples run in opaque srcdoc frames, which cannot update the parent URL.
    if (window.location.origin !== 'null') return;

    ['replaceState', 'pushState'].forEach((method) => {
      const update = window.history[method].bind(window.history);
      window.history[method] = (state, title, url) => {
        if (url != null) return;
        update(state, title, url);
      };
    });
  });
}
