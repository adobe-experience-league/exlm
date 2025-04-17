import { isMobile } from '../header/header-utils.js';
import {
  waitForChildElement,
  debounce,
  CUSTOM_EVENTS,
  getFiltersFromUrl,
  COMMUNITY_SUPPORTED_SORT_ELEMENTS,
  fragment,
} from './atomicUtils.js';

export default function atomicSortDropdownHandler() {
  const atomicSortElement = document.querySelector('atomic-sort-dropdown');

  function updateSortUI() {
    atomicSortElement.style.cssText = isMobile()
      ? `width: 100%; padding-left: 50px; display: flex; justify-content: flex-end`
      : '';
  }

  function updateSortPosition() {
    const desktopBase = document.querySelector('atomic-layout-section[section="query"]');
    const mobileBase = document.querySelector('atomic-layout-section[section="status"]');
    if (isMobile()) {
      const exists = !!mobileBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        mobileBase.appendChild(atomicSortElement);
      }
    } else {
      const exists = !!desktopBase.querySelector('atomic-sort-dropdown');
      if (!exists) {
        desktopBase.appendChild(atomicSortElement);
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

    const selectElement = atomicSortElement.shadowRoot.querySelector('[part="select"]');
    const optionElements = selectElement ? Array.from(selectElement.children) : [];
    optionElements.forEach((option) => {
      const optionKey = option.value;
      const isCommunityOption = COMMUNITY_SUPPORTED_SORT_ELEMENTS.find((opt) => optionKey.includes(opt));
      const displayValue = isCommunityOption && !communityFilterSelected ? 'none' : '';
      option.style.display = displayValue;
    });
  }

  const initAtomicSortUI = () => {
    if (!atomicSortElement.shadowRoot) {
      waitForChildElement(atomicSortElement, initAtomicSortUI);
      return;
    }
    updateSortUI();
    updateSortPosition();
    updateSortOptions();
  };

  function onResize() {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== atomicSortElement.dataset.view) {
      atomicSortElement.dataset.view = view;
      updateSortUI();
      updateSortPosition();
    }
  }
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);
  document.addEventListener(CUSTOM_EVENTS.RESULT_UPDATED, () => {
    setTimeout(() => {
      updateSortOptions();
    }, 250);
  });

  initAtomicSortUI();
}
