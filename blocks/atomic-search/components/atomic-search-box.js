import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../../scripts/search/search-utils.js';
import { CUSTOM_EVENTS, fragment, waitFor } from './atomic-search-utils.js';

const HIDE_SUGGESTIONS_CLASS = 'hide-suggestions';

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

  if (baseElement && baseElement.dataset.hideSuggestionsBound !== 'true') {
    // Claim immediately so concurrent handler passes cannot attach duplicate listeners.
    // Bind PREPROCESS before shadow readiness — hide only needs the host element.
    baseElement.dataset.hideSuggestionsBound = 'true';

    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, (e) => {
      const { method = '' } = e.detail ?? {};
      if (method === 'search') {
        baseElement.classList.add(HIDE_SUGGESTIONS_CLASS);
      }
    });

    const bindSuggestionRestoreListeners = () => {
      const textarea = baseElement.shadowRoot?.querySelector('[part="textarea"]');
      if (!textarea) {
        waitFor(bindSuggestionRestoreListeners);
        return;
      }

      const showSuggestions = () => {
        baseElement.classList.remove(HIDE_SUGGESTIONS_CLASS);
      };

      // Restore only on user interaction. Avoid `focus` — Coveo may refocus the
      // textarea after search and would incorrectly clear hide-suggestions.
      textarea.addEventListener('input', showSuggestions);
      textarea.addEventListener('click', showSuggestions);
    };

    bindSuggestionRestoreListeners();
  }

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
