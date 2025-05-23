import { CUSTOM_EVENTS, fragment, waitFor } from './atomic-search-utils.js';

export const clearIconHandler = (clearIcon) => {
  if (!clearIcon || clearIcon.dataset.evented === 'true') {
    return;
  }
  clearIcon.addEventListener('click', () => {
    const hash = fragment();
    const splitHashWithoutSearchQuery = hash.split('&').filter((key) => !key.includes('q='));
    const updatedHash = splitHashWithoutSearchQuery.join('&');
    window.location.hash = updatedHash;
  });
  clearIcon.dataset.evented = 'true';
};

export default function atomicSearchBoxHandler(block) {
  const baseElement = block.querySelector('atomic-search-box');
  const shadowElement = baseElement.shadowRoot;
  if (!shadowElement?.firstElementChild) {
    waitFor(() => {
      atomicSearchBoxHandler(block);
    });
    return;
  }

  const baseSkeleton = block.querySelector('.atomic-search-load-skeleton');
  if (baseSkeleton) {
    const skeletonSearchShimmer = baseSkeleton.querySelector('.atomic-load-skeleton-head');
    skeletonSearchShimmer.classList.add('atomic-skeleton-shimmer-hide');
    baseSkeleton.classList.add('atomic-skeleton-shimmer-hide');
  }
  const onSearchQueryChange = () => {
    const { shadowRoot } = baseElement;
    const clearIcon = shadowRoot?.querySelector('[part="clear-button"]');
    clearIconHandler(clearIcon);
  };

  document.addEventListener(CUSTOM_EVENTS.SEARCH_QUERY_CHANGED, onSearchQueryChange);
}
