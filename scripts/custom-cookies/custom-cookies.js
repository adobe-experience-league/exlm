/**
 * Custom cookie consent handler for OneTrust integration.
 * Translates OneTrust cookie consent into an internal cookie for platform use (e.g., Insided).
 * Only activated when explicitly initialized (e.g., for community pages).
 *
 * @author Cade Larrabee - Gainsight - Enterprise Support Analyst
 */

const OPTANON_COOKIE_NAME = 'OptanonConsent';
const INTERNAL_COOKIE_NAME = 'OptanonConsentInSided';
const DEFAULT_LEVEL_COOKIE = 'DefaultCookiePrivacyLevel';

// Highest to lowest priority
const CONSENT_PRIORITY = ['C0005', 'C0004', 'C0003', 'C0002', 'C0001'];

// If everything else fails, assume minimum cookie level
const HARDCODED_DEFAULT_GROUP = 'C0001';

// --- helpers ---
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

// Get all values for a given cookie name (if the customer uses other sites with onetrust)
function getAllCookieValuesByName(name) {
  const cookies = document.cookie ? document.cookie.split(';') : [];
  const values = [];

  cookies.forEach((cookie) => {
    const [rawKey, ...rest] = cookie.split('=');
    const key = rawKey.trim();
    if (key === name) {
      values.push(rest.join('='));
    }
  });

  return values;
}

function parseQueryString(str) {
  return str.split('&').reduce((acc, pair) => {
    if (!pair) return acc;
    const [rawKey, rawValue = ''] = pair.split('=');
    if (!rawKey) return acc;
    const key = decodeURIComponent(rawKey);
    const val = decodeURIComponent(rawValue);
    acc[key] = val;
    return acc;
  }, {});
}

// Convert the query into an object
// "C0004:1,C0005:0,... " => { C0004: true, C0005: false, ... }
function parseGroups(groupsStr) {
  const result = {};
  if (!groupsStr) return result;

  groupsStr.split(',').forEach((item) => {
    if (!item) return;
    const [id, flag] = item.split(':');
    if (!id) return;
    result[id] = flag === '1';
  });

  return result;
}

function getHighestAcceptedGroup(groups) {
  if (!groups) return null;
  const found = CONSENT_PRIORITY.find((code) => groups[code]);
  return found || null;
}

function getGroupsFromOneTrust() {
  // There may be multiple OptanonConsent cookies (main domain + community).
  const allValues = getAllCookieValuesByName(OPTANON_COOKIE_NAME);
  if (!allValues.length) return null;

  const currentHost = window.location.hostname;
  let selectedValue = null;

  if (allValues.length === 1) {
    [selectedValue] = allValues;
  } else {
    // Get the cookie whose landingPath host matches the current hostname
    // Find matching cookie by iterating through values
    const matchingValue = allValues.find((val) => {
      const params = parseQueryString(val);
      const landing = params.landingPath || params.LandingPath || '';

      if (!landing) return false;

      try {
        const url = new URL(landing);
        return url.hostname === currentHost;
      } catch (e) {
        // If landingPath is not a valid URL, skip this value
        return false;
      }
    });

    if (matchingValue) {
      selectedValue = matchingValue;
    } else {
      // If we couldn't find a perfect match, fall back to the default
      // eslint-disable-next-line no-console
      console.warn(
        '[OptanonConsentInsided] Multiple OptanonConsent cookies found; no landingPath matched current host.',
      );
      [selectedValue] = allValues;
    }
  }

  const params = parseQueryString(selectedValue);
  const groupsStr = params.groups || params.GROUPS || '';
  return parseGroups(groupsStr);
}

// Read DefaultCookiePrivacyLevel and map:
// 1 -> C0001, 2 -> C0003, 3 -> C0004
function getDefaultGroupFromCookie() {
  const raw = getCookie(DEFAULT_LEVEL_COOKIE);
  if (!raw) {
    // eslint-disable-next-line no-console
    console.log(
      `[OptanonConsentInsided] No ${DEFAULT_LEVEL_COOKIE} cookie found, using hardcoded default ${HARDCODED_DEFAULT_GROUP}.`,
    );
    return HARDCODED_DEFAULT_GROUP;
  }

  const level = parseInt(raw, 10);
  let mapped;

  // At adobe, the levels map to C0001-1, C0002-2, C0003-2, C0004-3.
  switch (level) {
    case 1:
      mapped = 'C0001';
      break;
    case 2:
      mapped = 'C0003';
      break;
    case 3:
      mapped = 'C0004';
      break;
    default:
      mapped = HARDCODED_DEFAULT_GROUP;
      break;
  }

  // eslint-disable-next-line no-console
  console.log(`[OptanonConsentInsided] DefaultCookiePrivacyLevel=${raw} mapped to ${mapped}.`);
  return mapped;
}

function setInternalConsentCookie(groupValue) {
  const ttlDays = 365;
  const maxAgeSeconds = ttlDays * 24 * 60 * 60;

  let cookieStr = `${INTERNAL_COOKIE_NAME}=${encodeURIComponent(groupValue)};`;
  cookieStr += ' path=/;';
  const domain = window.location.hostname;
  cookieStr += ` domain=${domain};`;
  cookieStr += ' Secure;';
  cookieStr += ' SameSite=Lax';

  document.cookie = cookieStr;

  // eslint-disable-next-line no-console
  console.log(`[OptanonConsentInsided] Set to "${groupValue}" with Max-Age=${maxAgeSeconds} on domain ${domain}.`);
}

function handleOneTrustUpdate() {
  const groups = getGroupsFromOneTrust();
  if (!groups) {
    // eslint-disable-next-line no-console
    console.warn('[OptanonConsentInsided] No OptanonConsent cookie found to convert.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[OptanonConsentInsided] Groups parsed:', groups);

  let highest = getHighestAcceptedGroup(groups);

  if (!highest) {
    const defaultGroup = getDefaultGroupFromCookie();
    // eslint-disable-next-line no-console
    console.log(`[OptanonConsentInsided] No accepted C000x in OptanonConsent, using default ${defaultGroup}.`);
    highest = defaultGroup;
  } else {
    // eslint-disable-next-line no-console
    console.log('[OptanonConsentInsided] Highest accepted group:', highest);
  }

  setInternalConsentCookie(highest);
}

/**
 * Initialize the custom cookie consent handler.
 * Sets up listener for OneTrust consent updates and processes existing consent if available.
 */
export default function initCustomCookieHandler() {
  // Listen for OneTrust consent updates
  window.addEventListener('OneTrustGroupsUpdated', handleOneTrustUpdate);

  // Also run immediately if OptanonConsent cookie already exists
  if (document.cookie.includes(OPTANON_COOKIE_NAME)) {
    handleOneTrustUpdate();
  }
}
