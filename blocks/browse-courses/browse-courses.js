import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';

export default async function decorate(block) {
  await createFacetedSearch(block, {
    contentType: 'course',
    heading: true,
    filters: true,
    sort: true,
    pagination: false,
    viewSwitcher: false,
  });
}
