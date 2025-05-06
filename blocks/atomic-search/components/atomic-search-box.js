import { CUSTOM_EVENTS, fragment } from './atomic-search-utils.js';

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

export default function atomicSearchBoxHandler(baseElement) {
  const onSearchQueryChange = () => {
    const { shadowRoot } = baseElement;
    const clearIcon = shadowRoot?.querySelector('[part="clear-button"]');
    clearIconHandler(clearIcon);
  };

  document.addEventListener(CUSTOM_EVENTS.SEARCH_QUERY_CHANGED, onSearchQueryChange);
}
