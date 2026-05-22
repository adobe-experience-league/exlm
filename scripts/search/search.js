import { getMetadata } from '../lib-franklin.js';
import { getLanguageCode, getPathDetails, getConfig } from '../scripts.js';
import { pushTopNavSearchEvent } from '../analytics/lib-analytics.js';

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

let solution = '';
// see: https://jira.corp.adobe.com/browse/EXLM-3813.
// this is a temporary fix and steakholders accept the technical debt and  dependecy on community HTML as-is.
// This will break infuture and that's also acceptable
if (isCommunityDomain) {
  // Get solution from breadcrumb
  const breadcrumbItems = document.querySelectorAll(
    '#breadcrumbs .spectrum-Breadcrumbs-item, #breadcrumbs-target .breadcrumb .breadcrumb-item',
  );
  if (breadcrumbItems.length >= 3) {
    // product name is the 3rd breadcrumb (index 2)
    solution = breadcrumbItems[2].textContent.trim();

    if (solution.includes('Adobe Experience Manager')) {
      solution = 'Experience Manager';
    } else {
      solution = solution.replace('Adobe ', '');
    }

    if (!communityProducts.some((p) => p.toLowerCase() === solution.toLowerCase())) {
      solution = '';
    }
  }
} else {
  // Get solution from metadata
  solution = getMetadata('solution')?.split(',')[0].trim();
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
  if (solution) {
    const solutionEncoded = encodeURIComponent(solution);
    targetUrlWithLanguage += isLegacySearch ? `&f:el_product=[${solutionEncoded}]` : `&f-el_product=${solutionEncoded}`;
  }

  window.location.href = targetUrlWithLanguage;
};
