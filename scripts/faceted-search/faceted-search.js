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
  const resolved = Object.hasOwn(config, 'contentType') ? await createContentConfig(config) : config;
  return createSearch(block, resolved);
}
