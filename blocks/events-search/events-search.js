import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';

export default async function decorate(block) {
  await createFacetedSearch(block, {
    contentType: 'event',
    filters: true,
    sort: true,
    viewSwitcher: true,
    pagination: true,
  });
}
