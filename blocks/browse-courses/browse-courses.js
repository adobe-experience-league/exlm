/** Thin `course` faceted-search wrapper; migrates legacy `?product=`/`?level=` into the hash. */

import { createTag, xssSanitizeQueryParamValue } from '../../scripts/scripts.js';
import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const LEGACY_URL_PARAMS = { product: 'el_product', level: 'el_level' };

/** Migrate legacy query filters into `#f-…` before faceted-search init. */
function migrateLegacyUrlParams() {
  if (window.location.hash) return;
  const params = new URLSearchParams(window.location.search);
  const fragment = Object.entries(LEGACY_URL_PARAMS)
    .map(([param, facet]) => {
      const values = (params.get(param) || '')
        .split(',')
        .map((value) => xssSanitizeQueryParamValue(value.trim()))
        .filter(Boolean);
      params.delete(param);
      return values.length ? `f-${facet}=${values.map(encodeURIComponent).join(',')}` : '';
    })
    .filter(Boolean)
    .join('&');
  if (!fragment) return;
  const search = params.toString();
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${search ? `?${search}` : ''}#${fragment}`,
  );
}

const HEADING_TYPES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/** Authored rows: [heading, filterLabel] or [heading, headingType, filterLabel]. */
function readAuthoredContent(block) {
  const cells = [...block.children].map((row) => row.firstElementChild);
  const [headingCell, second, third] = cells;
  const secondText = second?.textContent.trim().toLowerCase() || '';
  const hasHeadingType = HEADING_TYPES.has(secondText);
  const headingType = hasHeadingType ? secondText : 'h2';
  const filterLabel = (hasHeadingType ? third : second)?.textContent.trim() || '';

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
  const signedIn = await isSignedInUser();
  migrateLegacyUrlParams();
  await createFacetedSearch(block, {
    contentType: 'course',
    filters: true,
    sort: true,
    pagination: false,
    filterLabel,
    signedIn,
  });
  if (heading) {
    heading.classList.add('browse-courses-heading');
    block.prepend(heading);
  }
}
