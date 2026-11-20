import createSearch from './core/controller.js';
import createContentConfig from './core/config.js';

export { createFilterStore } from './state/store.js';
export {
  readFiltersFromUrl,
  readKeywordFromUrl,
  bindFiltersToUrl,
  readSearchStateFromUrl,
  writeSearchStateToUrl,
} from './state/url-state.js';
export { default as createFacetedSearchUI } from './components/filters.js';
export { default as createSidebarLayout } from './components/layout.js';
export {
  getDefaultSortOptions,
  sortItems,
  createSortControl,
  createStoreSort,
  createCollectionSortPolicy,
} from './components/sort-control.js';
export { default as createCollectionSource } from './sources/collection-source.js';
export async function createFacetedSearch(block, config) {
  const isContentPreset = Object.hasOwn(config, 'contentType');
  const resolved = isContentPreset ? await createContentConfig(config) : config;
  if (isContentPreset) {
    const heading =
      block.querySelector(':scope > .fs-layout .fs-heading') ||
      block.querySelector(':scope > div:not(.fs-layout) > div');
    resolved.heading = heading?.textContent.trim() || '';
  }
  return createSearch(block, resolved);
}
