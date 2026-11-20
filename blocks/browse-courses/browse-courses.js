/** Thin `course` faceted-search wrapper; migrates legacy `?product=`/`?level=` into the hash. */

import { createTag, xssSanitizeQueryParamValue } from '../../scripts/scripts.js';
import { createFacetedSearch } from '../../scripts/faceted-search/faceted-search.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

const LEGACY_URL_PARAMS = { product: 'el_product', level: 'el_level' };

/** True when the hash is already query-like (`f-…` / `key=value`), not a bare `#anchor`. */
function isFilterHash(hash) {
  const raw = hash.replace(/^#/, '');
  return !raw || /[=&]/.test(raw) || raw.startsWith('f-');
}

/** Migrate legacy query filters into `#f-…` before faceted-search init. */
function migrateLegacyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.replace(/^#/, '');
  const keepAnchor = rawHash && !isFilterHash(window.location.hash) ? rawHash : '';
  const hashParams = new URLSearchParams(keepAnchor ? '' : rawHash);
  let changed = false;
  Object.entries(LEGACY_URL_PARAMS).forEach(([param, facet]) => {
    if (!params.has(param)) return;
    const raw = params.get(param) || '';
    params.delete(param);
    changed = true;
    const key = `f-${facet}`;
    if (hashParams.has(key)) return;
    const values = raw
      .split(',')
      .map((value) => xssSanitizeQueryParamValue(value.trim()))
      .filter(Boolean);
    if (values.length) hashParams.set(key, values.join(','));
  });
  if (!changed) return;
  const search = params.toString();
  const filterFragment = hashParams.toString();
  // Prefer migrated filters; bare anchors are not mergeable with `f-` keys via URLSearchParams.
  const fragment = filterFragment || keepAnchor;
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${search ? `?${search}` : ''}${fragment ? `#${fragment}` : ''}`,
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
  try {
    await createFacetedSearch(block, {
      contentType: 'course',
      filters: true,
      sort: true,
      pagination: false,
      filterLabel,
      signedIn,
    });
  } finally {
    if (heading) {
      heading.classList.add('browse-courses-heading');
      block.prepend(heading);
    }
  }
}
