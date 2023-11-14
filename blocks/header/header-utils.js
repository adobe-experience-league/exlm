/**
 * debounce fn execution
 * @param {number} ms
 * @param {Function} fn
 * @returns {Function} debounced function
 */
export const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(timer);
    args.unshift(this);
    timer = setTimeout(fn(args), ms);
  };
};

/**
 * Register page resize handler
 * @param {ResizeObserverCallback} handler
 * @returns {void} nothing
 */
export const registerResizeHandler = (callback) => {
  window.customResizeHandlers = window.customResizeHandlers || [];
  // register resize observer only once.
  if (!window.pageResizeObserver) {
    const pageResizeObserver = new ResizeObserver(
      debounce(100, (entries, observer) => {
        window.customResizeHandlers.forEach((handler) => {
          try {
            handler(entries, observer);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });
      }),
    );
    // observe immediately
    pageResizeObserver.observe(document.querySelector('header'), {
      box: 'border-box',
    });
    window.pageResizeObserver = pageResizeObserver;
  }
  // push handler
  window.customResizeHandlers.push(callback);
};
