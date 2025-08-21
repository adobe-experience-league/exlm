import {
  waitForChildElement,
  debounce,
  CUSTOM_EVENTS,
  getFiltersFromUrl,
  COMMUNITY_SUPPORTED_SORT_ELEMENTS,
  fragment,
  isMobile,
} from './atomic-search-utils.js';

export default function atomicSortDropdownHandler(baseElement) {
  baseElement.dataset.view = isMobile() ? 'mobile' : 'desktop';

  function updateSortUI() {
    if (isMobile()) {
      baseElement.classList.add('atomic-sort-mweb');
    } else {
      baseElement.classList.remove('atomic-sort-mweb');
    }
  }

  function updateSortPosition() {
    const desktopBase = document.querySelector('atomic-layout-section[section="query"]');
    const mobileBase = document.querySelector('atomic-layout-section[section="status"]');
    if (isMobile()) {
      const exists = !!mobileBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        mobileBase.appendChild(baseElement);
      }
    } else {
      const exists = !!desktopBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        desktopBase.appendChild(baseElement);
      }
    }
  }

  function updateSortOptions() {
    const filtersInfo = getFiltersFromUrl();
    const communityFilterSelected = filtersInfo.el_contenttype
      ? !!filtersInfo.el_contenttype.find((option) => option.toLowerCase().includes('community'))
      : false;
    const [sortOption] = filtersInfo.sortCriteria || [];
    const communitySupportedSortActive = sortOption
      ? !!COMMUNITY_SUPPORTED_SORT_ELEMENTS.find((opt) => sortOption.includes(opt))
      : false;
    if (communitySupportedSortActive && !communityFilterSelected) {
      // Tricky situation, where we need to clean the sort.
      const hash = fragment();
      const splitHashWithoutSort = hash
        .split('&')
        .filter((key) => !COMMUNITY_SUPPORTED_SORT_ELEMENTS.find((sort) => key.includes(sort)));
      const updatedHash = splitHashWithoutSort.join('&');
      window.location.hash = updatedHash;
    }

    const selectElement = baseElement.shadowRoot.querySelector('[part="select"]');
    const optionElements = selectElement ? Array.from(selectElement.children) : [];
    optionElements.forEach((option) => {
      const optionKey = option.value;
      const isCommunityOption = COMMUNITY_SUPPORTED_SORT_ELEMENTS.find((opt) => optionKey.includes(opt));
      const displayValue = isCommunityOption && !communityFilterSelected ? 'none' : '';
      if (displayValue) {
        option.remove();
      }
    });
  }

  const initAtomicSortUI = () => {
    if (!baseElement.shadowRoot) {
      waitForChildElement(baseElement, initAtomicSortUI);
      return;
    }
    updateSortUI();
    updateSortPosition();
    updateSortOptions();
  };

  function onResize() {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== baseElement.dataset.view) {
      baseElement.dataset.view = view;
      updateSortUI();
      updateSortPosition();
    }
  }
  const debouncedResize = debounce(200, onResize);

  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => {
    setTimeout(() => {
      updateSortOptions();
    }, 250);
  });
  document.addEventListener(CUSTOM_EVENTS.RESIZED, debouncedResize);

  initAtomicSortUI();
}
