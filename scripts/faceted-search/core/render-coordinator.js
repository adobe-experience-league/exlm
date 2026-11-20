export default function createRenderCoordinator({ prepare, commit, onError }) {
  let version = 0;
  let destroyed = false;
  let abort;
  return {
    async render(input) {
      abort?.abort();
      abort = new AbortController();
      version += 1;
      const current = version;
      const context = { ...input, signal: abort.signal };
      try {
        const output = await prepare(context);
        if (!destroyed && current === version) await commit(output, context);
      } catch (error) {
        if (!destroyed && current === version) onError(error);
      }
    },
    invalidate() {
      abort?.abort();
      version += 1;
    },
    destroy() {
      abort?.abort();
      destroyed = true;
      version += 1;
    },
  };
}
