const DEFAULT_WAIT_TIME = 100; // 100ms.

export const CUSTOM_EVENTS = {
  RESULT_UPDATED: 'COVEO_RESULTS_UPDATED',
};

export const waitFor = (callback, delay = DEFAULT_WAIT_TIME) => {
  setTimeout(callback, delay);
};

export const childElementExists = (element) => {
  if (!element) {
    return false;
  }
  if (element.shadowRoot) {
    const childExists = !!element.shadowRoot.firstElementChild;
    if (!childExists) {
      return false;
    }
    const placeHolderExists = !!element.shadowRoot.querySelector('[part~="placeholder"]');
    if (placeHolderExists) {
      return false;
    }
    return true;
  }
  return !!element.firstElementChild;
};

export const waitForChildElement = (element, handler, delay = DEFAULT_WAIT_TIME) => {
  const exists = childElementExists(element);
  if (exists) {
    handler();
    return true;
  }
  waitFor(() => {
    waitForChildElement(element, handler, delay);
  }, delay);
  return false;
};

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
