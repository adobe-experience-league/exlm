import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';

export default async function decorate(block) {
  await createFacetedSearch(block, {
    contentType: 'perspective',
    heading: true,
    filters: true,
    sort: true,
    viewSwitcher: false,
    pagination: true,
  });
}
