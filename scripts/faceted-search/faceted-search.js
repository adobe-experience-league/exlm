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
  let { heading, headingType } = config;
  if (heading === true) {
    const existing = block.querySelector(':scope > .fs-layout .fs-heading');
    const [headingRow, typeRow] = [...block.children].filter((row) => !row.classList.contains('fs-layout'));
    const cell = headingRow?.lastElementChild;
    const authoredType = typeRow?.lastElementChild?.textContent.trim().toLowerCase();
    heading = existing?.textContent.trim() ?? cell?.textContent.trim() ?? '';
    headingType ??=
      existing?.localName ||
      (/^h[1-6]$/.test(authoredType) ? authoredType : cell?.querySelector('h1, h2, h3, h4, h5, h6')?.localName);
  }
  const resolved = Object.hasOwn(config, 'contentType') ? await createContentConfig(config) : config;
  return createSearch(block, {
    ...resolved,
    heading: heading === false ? '' : heading ?? resolved.heading,
    headingType: headingType ?? resolved.headingType,
  });
}
