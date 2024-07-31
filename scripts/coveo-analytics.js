import { SHA1, MD5 } from './crypto.js';
import { COVEO_TOKEN } from './session-keys.js';

const COVEO_ANALYTICS_URL = {
  PROD: 'https://adobev2prod9e382h1q.analytics.org.coveo.com/rest/ua/v15/analytics/',
  STAGE: 'https://adobesystemsincorporatednonprod1.analytics.org.coveo.com/rest/ua/v15/analytics/',
};

const COVEO_SESSION_UUID = 'coveo-session-id';

/**
 * Gets a UUID for use with coveo events
 *
 * @param {*} profile - user profile data
 * @returns
 */
function getCoveoSessionUUID(profile) {
  let id = profile?.authId;

  if (id === undefined) {
    const fromSession = sessionStorage.getItem(COVEO_SESSION_UUID);

    if (fromSession === null) {
      id = window.crypto.randomUUID();
      sessionStorage.setItem(COVEO_SESSION_UUID, id);
    } else {
      id = fromSession;
    }
  }

  return id;
}

/**
 *
 * @param {*} type - The type of analytics event, always lower case ex: view, click
 * @param {*} body - JSON body of post request
 * @returns
 */
async function postCoveoAnalytics(type, body) {
  try {
    // Load the Coveo Token
    // const coveoToken = await loadCoveoToken(); - Causes cyclic dependency that breaks build
    const coveoToken = sessionStorage.getItem(COVEO_TOKEN);

    const response = await fetch(
      `${COVEO_ANALYTICS_URL[window.exlm.config?.currentEnv?.env] || COVEO_ANALYTICS_URL.STAGE}${type}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${coveoToken}`,
        },
        body,
      },
    );
    if (response.status === 200) {
      const data = await response.json();
      return data || [];
    }

    if (response.status === 419) {
      sessionStorage.removeItem(COVEO_TOKEN);
    }

    return null;
  } catch (error) {
    throw new Error(error);
  }
}

async function getCoveoHashOfCurrentUrl() {
  // The permenantid coveo assigned to docs is based off their original URL at time of indexing,
  // so if we ever switch staging to pull from some non-prod site map this will need to be updated
  const url = `https://experienceleague.adobe.com${window.location.pathname}`;

  // Coveo, by default, combined two types of hashes of the url for it's permenantid format
  // for legacy docs pages. If tracking on Universal Editor pages doesn't appear to be working correctly
  // this will need to be updated based on whatever we observe.
  const md5Fragment = MD5(url).slice(0, 30);
  const sha1Fragment = await SHA1(url);

  return `${md5Fragment}${sha1Fragment.slice(0, 30)}`;
}

/**
 * For use when a searchable page is initially loaded
 *
 * https://docs.coveo.com/en/2651/build-a-search-ui/log-view-events
 */
export async function sendCoveoPageViewEvent() {
  if (window.location.search?.indexOf('martech=off') === -1) {
    return;
  }

  const contentType = document.querySelector("meta[name='type']")?.content;
  const title = document.querySelector("meta[name='og:title']")?.content;
  // const profileData = defaultProfileClient.getMergedProfile(false); - Causes cyclic dependency that breaks build
  const profileData = sessionStorage.getItem('profile');
  const customData =
    profileData === null
      ? {}
      : {
          context_exl_entitlements: profileData.entitlements,
          context_exl_role: profileData.role,
          context_exl_interests: profileData.interests,
          context_exl_industry_interests: profileData.industryInterests,
        };

  const contentIdValue = await getCoveoHashOfCurrentUrl();

  const baseData = {
    language: window.languageCode.substring(0, 2).toLowerCase(), // Two-letter codes only
    clientId: getCoveoSessionUUID(profileData),
    location: window.location.href, // Current url
    contentIdKey: 'permanentid',
    contentIdValue, // First 30 md5 + first 30 sha1 of coveo url
    contentType: contentType || 'other', // We might need to expand 'other' for non-doc pages down the road
    outcome: 2, // -5 to 5, we might want to adjust this in the future
    title,
    anonymous: true,
    originContext: 'originLevel1', // Pull from the coveo token, only override if we need to
    userAgent: window.navigator.userAgent,
    customData,
  };

  postCoveoAnalytics('view', JSON.stringify(baseData));
}

/**
 * For use when the user clicks on an item that is populated by a coveo query.
 *
 * https://docs.coveo.com/en/2064/build-a-search-ui/log-click-events
 *
 * @param {*} raw - The 'raw' object on the associated coveo result item.
 */
export async function sendCoveoClickEvent(source, model) {
  if (window.location.search?.indexOf('martech=off') === -1) {
    return;
  }

  const { index, permanentid, searchQueryUid, title, viewLink } = model;
  // const profileData = defaultProfileClient.getMergedProfile(false); - Causes cyclic dependency that breaks build
  const profileData = sessionStorage.getItem('profile');
  const customData =
    profileData === null
      ? {
          contentIdKey: 'permanentid',
          contentIdValue: permanentid,
        }
      : {
          contentIdKey: 'permanentid',
          contentIdValue: permanentid,
          context_exl_entitlements: profileData.entitlements,
          context_exl_role: profileData.role,
          context_exl_interests: profileData.interests,
          context_exl_industry_interests: profileData.industryInterests,
        };

  const baseData = {
    anonymous: true,
    clientId: getCoveoSessionUUID(profileData),
    actionCause: 'documentOpen', // This should probably never change, but https://docs.coveo.com/en/1389/build-a-search-ui/standard-actions-and-usage-analytics-reference
    documentPosition: index + 1,
    documentTitle: title,
    documentUrl: viewLink,
    language: window.languageCode.substring(0, 2).toLowerCase(), // Two letter code only
    // originLevel1: '', pulled from token. We should only set it if we have to override it
    // originLevel2: '', "tab" value of search request, if we ever use it
    searchQueryUid,
    sourceName: source,
    userAgent: window.navigator.userAgent,
    customData,
  };

  postCoveoAnalytics('click', JSON.stringify(baseData));
}
