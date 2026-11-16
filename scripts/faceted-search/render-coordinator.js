export default function createRenderCoordinator({ prepare, commit, onError }) {
  let version = 0;
  let destroyed = false;
  return {
    async render(input) {
      version += 1;
      const current = version;
      try {
        const output = await prepare(input);
        if (!destroyed && current === version) await commit(output, input);
      } catch (error) {
        if (!destroyed && current === version) onError(error);
      }
    },
    invalidate() {
      version += 1;
    },
    destroy() {
      destroyed = true;
      version += 1;
    },
  };
}
