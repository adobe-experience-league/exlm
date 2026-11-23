import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';

export default async function decorate(block) {
  await createFacetedSearch(block, {
    contentType: 'playlist',
    filters: true,
    sort: false,
    viewSwitcher: false,
    pagination: true,
  });
}
