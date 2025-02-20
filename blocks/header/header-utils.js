export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

export const decoratorState = {
  languages: new Deferred(),
};

/**
 * @param {HTMLElement} block
 * @param {number} row
 * @param {number} cell
 * @returns
 */
export const getCell = (block, row, cell) =>
  block.querySelector(`:scope > div:nth-child(${row}) > div:nth-child(${cell})`);

// Mobile Only (Until 1024px)
export const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

/**
 * debounce fn execution
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
export function registerHeaderResizeHandler(callback) {
  window.customResizeHandlers = window.customResizeHandlers || [];
  const header = document.querySelector('header');
  // register resize observer only once.
  if (!window.pageResizeObserver) {
    const pageResizeObserver = new ResizeObserver(
      debounce(100, () => {
        window.customResizeHandlers.forEach((handler) => {
          try {
            handler();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });
      }),
    );
    // observe immediately
    pageResizeObserver.observe(header, {
      box: 'border-box',
    });
    window.pageResizeObserver = pageResizeObserver;
  }
  // push handler
  window.customResizeHandlers.push(callback);
  // ensure handler runs at-least once
  callback();
}

/**
 * get the first text child nodes of an element
 * @param {HTMLElement} el
 * @returns {Text[]}
 */
export function getFirstChildTextNodes(el) {
  const textNodes = [];
  let next = el.firstChild;
  while (next && next.nodeType === Node.TEXT_NODE) {
    textNodes.push(next);
    next = next.nextSibling;
  }
  return textNodes;
}
/**
 * add the given origin to every relative link in the container
 * @param {HTMLElement} container
 * @param {function(string): string} replacer
 */
export function updateLinks(container, replacer) {
  container.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    anchor.setAttribute('href', replacer(href));
  });
}
/**
 * @param {HTMLElement} block
 * @returns {HTMLElement}
 */
const getBlockFirstCell = (block) => block.querySelector(':scope > div > div');
/**
 * @param {HTMLElement} block
 * @returns {HTMLElement}
 */
export const getBlockFirstRow = (block) => block.querySelector(':scope > div');
/**
 * simplified single cell block to one wrapper div.
 * @param {HTMLElement} el
 * @param {string} selector
 * @returns {HTMLElement}
 */
export const simplifySingleCellBlock = (block) => {
  const firstRowFirstCell = getBlockFirstCell(block);
  block.innerHTML = firstRowFirstCell.innerHTML;
  return block;
};
