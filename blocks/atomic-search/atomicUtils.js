const DEFAULT_WAIT_TIME = 100; // 100ms.

export const CUSTOM_EVENTS = {
  RESULT_UPDATED: 'COVEO_RESULTS_UPDATED',
  FILTER_UPDATED: 'COVEO_FILTER_UPDATED',
};

export const COMMUNITY_SUPPORTED_SORT_ELEMENTS = ['el_view_status', 'el_kudo_status', 'el_reply_status'];

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

export const fragment = () => window.location.hash.slice(1);

export const getFiltersFromUrl = () => {
  const hash = fragment();
  const decodedHash = decodeURIComponent(hash);
  const filtersInfo = decodedHash.split('&').filter((s) => !!s);
  return filtersInfo.reduce((acc, curr) => {
    const [facetKeys, facetValueInfo] = curr.split('=');
    const facetValues = facetValueInfo.split(',');
    const keyName = facetKeys.replace('f-', '');
    acc[keyName] = facetValues;
    return acc;
  }, {});
};
