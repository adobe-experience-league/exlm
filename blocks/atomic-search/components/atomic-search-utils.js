const DEFAULT_WAIT_TIME = 100; // 100ms.

export const CUSTOM_EVENTS = {
  RESULT_UPDATED: 'ATOMIC_SEARCH_RESULTS_UPDATED',
  FILTER_UPDATED: 'ATOMIC_SEARCH_FILTER_UPDATED',
  RESIZED: 'ATOMIC_SEARCH_RESIZED',
  FACET_LOADED: 'ATOMIC_SEARCH_FACET_LOADED',
  NO_RESULT_FOUND: 'ATOMIC_RESULT_NOT_FOUND',
  RESULT_FOUND: 'ATOMIC_RESULT_FOUND',
  SEARCH_QUERY_CHANGED: 'ATOMIC_SEARCH_QUERY_CHANGED',
};

export const COMMUNITY_SUPPORTED_SORT_ELEMENTS = ['el_view_status', 'el_kudo_status', 'el_reply_status'];

// Mobile Only (Until 1024px)
export const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

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
    const ctx = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(ctx, args);
    }, ms);
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

export const handleHeaderSearchVisibility = () => {
  const exlHeader = document.querySelector('exl-header');
  if (exlHeader) {
    const searchElement = exlHeader.shadowRoot.querySelector('.search');
    if (searchElement) {
      searchElement.style.visibility = 'hidden';
    }
    exlHeader.addEventListener('search-decorated', () => {
      const element = exlHeader.shadowRoot.querySelector('.search');
      element.style.visibility = 'hidden';
    });
  }
};

export function observeShadowRoot(host, { onEmpty, onPopulate, onClear, onMutation, waitForElement = false } = {}) {
  let observer;
  const ready = () => {
    const root = host.shadowRoot;
    if (!root) {
      waitFor(ready, 250);
      return;
    }

    const hasContent = () =>
      !!host.shadowRoot.firstElementChild &&
      !!Array.from(host.shadowRoot.children).find((el) => el.tagName !== 'STYLE');
    let populated = hasContent();

    if (waitForElement && !populated && root.nodeName === '#document-fragment') {
      waitFor(ready, 300);
      return;
    }

    if (populated) {
      if (onPopulate) {
        onPopulate(root);
      }
    } else if (onEmpty) {
      onEmpty(root);
    }

    observer = new MutationObserver((muts) => {
      if (onMutation) {
        onMutation(muts, root);
      }

      const nowPopulated = hasContent();

      if (!populated && nowPopulated) {
        populated = true;
        if (onPopulate) {
          onPopulate(root);
        }
      } else if (populated && !nowPopulated) {
        populated = false;
        if (onClear) {
          onClear(root);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true, attributes: true });
  };

  ready();
  return observer;
}

export function disconnectShadowObserver(observer) {
  if (observer && typeof observer.disconnect === 'function') {
    observer.disconnect();
  }
}

export const sleep = (callback, timeout = 20) => {
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
  promise.then(() => {
    callback();
  });
};

export function isUserClick(e) {
  if (typeof e.isTrusted === 'boolean') {
    return e.isTrusted;
  }
  return e.detail > 0;
}
