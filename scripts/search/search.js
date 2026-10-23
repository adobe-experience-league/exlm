import { getMetadata } from '../lib-franklin.js';
import { getLanguageCode, getPathDetails, getConfig } from '../scripts.js';
import { pushTopNavSearchEvent } from '../analytics/lib-analytics.js';
import resolveSearchProductFilter from './search-product-filter.js';

const { communityHost } = getConfig();
const isCommunityDomain = window.location.origin.includes(communityHost);

// Get language code from URL
const languageCode = await getLanguageCode();

// Community Products List
const communityProducts = [
  'Advertising',
  'Analytics',
  'Audience Manager',
  'Campaign',
  'Campaign Classic v7 & Campaign v8',
  'Campaign Standard',
  'CX Enterprise Coworker',
  'Developer',
  'Experience Manager',
  'Commerce',
  'Experience Platform',
  'Experience Cloud',
  'Journey Optimizer',
  'Marketo',
  'Marketo Engage',
  'Workfront',
  'Target',
  'Real-Time Customer Data Platform',
];

/**
 * Product facet for search redirect.
 * Community: breadcrumb (EXLM-3813). Elsewhere: TQ-aware meta (EXLM-6173).
 * @returns {string}
 */
function getSearchProductFilter() {
  if (isCommunityDomain) {
    // see: https://jira.corp.adobe.com/browse/EXLM-3813.
    // temporary fix; stakeholders accept dependency on community HTML as-is.
    const breadcrumbItems = document.querySelectorAll(
      '#breadcrumbs .spectrum-Breadcrumbs-item, #breadcrumbs-target .breadcrumb .breadcrumb-item',
    );
    if (breadcrumbItems.length < 3) {
      return '';
    }
    let product = breadcrumbItems[2].textContent.trim();
    if (product.includes('Adobe Experience Manager')) {
      product = 'Experience Manager';
    } else {
      product = product.replace('Adobe ', '');
    }
    if (!communityProducts.some((p) => p.toLowerCase() === product.toLowerCase())) {
      return '';
    }
    return product;
  }
  return resolveSearchProductFilter(getMetadata);
}

// Get content type from metadata
let contentType = getMetadata('type')?.trim();

if (!contentType) {
  // Fallback logic to determine contentType from URL
  const { lang } = getPathDetails();
  const url = window.location.pathname;

  const contentTypeMap = {
    [`/${lang}/playlists`]: 'Playlist',
    [`/${lang}/perspectives`]: 'Perspective',
    [`/${lang}/events`]: 'Event',
  };

  contentType = contentTypeMap[url] || '';

  if (url.includes(`/${lang}/certification-home`)) {
    contentType = 'Certification';
  } else if (url.includes(`/${lang}/courses`)) {
    contentType = 'Course';
  }
}

/**
 * Parse authored search option strings ("Label:value") for header filter selection.
 * @param {string} option
 * @returns {{ label: string, value: string }}
 */
function parseSearchOption(option) {
  const raw = typeof option === 'string' ? option : '';
  const idx = raw.indexOf(':');
  if (idx === -1) {
    return { label: raw.trim(), value: '' };
  }
  return { label: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() };
}

/**
 * Initial Coveo content-type filter for header search icon (matches former Search.configureAutoComplete).
 * @param {string[]} searchOptions - raw option strings from header fragment
 * @param {{ preferCommunity?: boolean }} [opts]
 * @returns {string} filter segment (e.g. "Course", "all", "Community")
 */
export function getHeaderSearchFilterValue(searchOptions, { preferCommunity = false } = {}) {
  const parsed = (searchOptions || []).map(parseSearchOption).filter((p) => p.label || p.value);
  if (!parsed.length) {
    return '';
  }
  const defaultValue = parsed[0].value;

  if (preferCommunity) {
    const communityOpt = parsed.find((p) => p.value === 'Community');
    if (communityOpt) {
      return communityOpt.value;
    }
  }
  if (contentType) {
    const byValue = parsed.find((p) => p.value === contentType);
    if (byValue) {
      return byValue.value;
    }
    const byLabel = parsed.find((p) => p.label === contentType);
    if (byLabel) {
      return byLabel.value;
    }
  }
  return defaultValue;
}

// Redirects to the search page based on the provided search input and filters
export const redirectToSearchPage = (searchUrl, searchInput, filters = '') => {
  pushTopNavSearchEvent(filters, searchInput);

  const isLegacySearch = searchUrl.includes('.html');
  let targetUrlWithLanguage = isLegacySearch ? `${searchUrl}?lang=${languageCode}` : searchUrl;
  const filterValue = filters?.toLowerCase() === 'all' ? '' : filters;
  if (searchInput) {
    const trimmedSearchInput = encodeURIComponent(searchInput.trim());
    targetUrlWithLanguage += `#q=${trimmedSearchInput}`;
  } else {
    targetUrlWithLanguage += '#sort=relevancy';
  }
  if (filterValue) {
    const filterValueEncoded = encodeURIComponent(filterValue);
    targetUrlWithLanguage += isLegacySearch
      ? `&f:@el_contenttype=[${filterValueEncoded}]`
      : `&f-el_contenttype=${filterValueEncoded}`;
  }
  const product = getSearchProductFilter();
  if (product) {
    const productEncoded = encodeURIComponent(product);
    targetUrlWithLanguage += isLegacySearch ? `&f:el_product=[${productEncoded}]` : `&f-el_product=${productEncoded}`;
  }

  window.location.href = targetUrlWithLanguage;
};
