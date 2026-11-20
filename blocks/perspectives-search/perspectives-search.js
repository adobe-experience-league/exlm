import { createTag } from '../../scripts/scripts.js';
import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';

const HEADING_TYPES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Authored rows are [heading, filterLabel] or [heading, headingType, filterLabel].
 * `headingType` is optional (UE select); when present it is an `h1`–`h6` cell.
 */
function readAuthoredContent(block) {
  const cells = [...block.children].map((row) => row.firstElementChild);
  const [headingCell, second, third] = cells;
  const secondText = second?.textContent.trim() || '';
  const headingType = HEADING_TYPES.has(secondText.toLowerCase()) ? secondText.toLowerCase() : 'h2';
  const filterLabelCell = HEADING_TYPES.has(secondText.toLowerCase()) ? third : second;
  const filterLabel = filterLabelCell?.textContent.trim() || '';

  const headingText = headingCell?.textContent.trim() || '';
  if (!headingText) return { heading: null, filterLabel };

  let heading = headingCell?.querySelector('h1, h2, h3, h4, h5, h6') || null;
  if (!heading?.textContent.trim()) {
    heading = createTag(headingType);
    heading.textContent = headingText;
  }
  return { heading, filterLabel };
}

export default async function decorate(block) {
  const { heading, filterLabel } = readAuthoredContent(block);
  // createFacetedSearch replaces the block's children synchronously, so keep the authored heading and re-add it.
  const search = createFacetedSearch(block, {
    contentType: 'perspective',
    filters: true,
    sort: true,
    pagination: true,
    filterLabel,
  });
  if (heading) {
    heading.classList.add('perspectives-search-heading');
    block.prepend(heading);
  }
  await search;
}
