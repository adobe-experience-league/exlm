import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';
import createEventsSearchConfig from './events-search-config.js';
import { loadEventsCardStyles } from './events-search-results.js';

export default async function decorate(block) {
  await loadEventsCardStyles().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('events-search: failed to load card styles', error);
  });
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('events-search: failed to load placeholders; using default labels', error);
  }
  await createFacetedSearch(block, createEventsSearchConfig(placeholders));
}
