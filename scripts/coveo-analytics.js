import { SHA1, MD5 } from 'crypto-js';
/*
import { defaultProfileClient } from './auth/profile.js';
import loadCoveoToken from './data-service/coveo/coveo-token-service.js';
*/
import { COVEO_TOKEN } from './session-keys.js';

const COVEO_ANALYTICS_URL = {
  PROD: 'https://adobev2prod9e382h1q.analytics.org.coveo.com/rest/ua/v15/analytics/',
  STAGE: 'https://adobesystemsincorporatednonprod1.analytics.org.coveo.com/rest/ua/v15/analytics/',
};
/**
 *
 * @param {*} type - The type of analytics event, always lower case ex: view, click
 * @param {*} body - JSON body of post request
 * @returns
 */
async function postCoveoAnalytics(type, body) {
  try {
    // Load the Coveo Token
    // const coveoToken = await loadCoveoToken();
    const coveoToken = sessionStorage.getItem(COVEO_TOKEN);

    const response = await fetch(`${COVEO_ANALYTICS_URL[window.exlm.config.currentEnv.env]}${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${coveoToken}`,
      },
      body,
    });
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
  const md5Fragment = MD5(window.location.href).toString().slice(0, 30);
  const sha1Fragment = SHA1(window.location.href).toString().slice(0, 30);
  return `${md5Fragment}${sha1Fragment}`;
}

/**
 * For use when a searchable page is initially loaded
 *
 */
export async function sendCoveoPageViewEvent() {
  const contentType = document.querySelector("meta[name='type']")?.content;

  if (contentType === undefined) {
    // eslint-disable-next-line no-console
    console.error('Missing "type" meta. Not sending coveo page view');
    return; // Missing meta type make this event useless
  }

  const title = document.querySelector("meta[name='og:title']")?.content;
  // const profileData = defaultProfileClient.getMergedProfile(false);
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

  const baseData = {
    language: window.languageCode.substring(0, 2).toLowerCase(), // Two-letter codes only
    clientId: profileData?.authId,
    location: window.location.href, // Current url
    contentIdKey: 'permanentid',
    contentIdValue: getCoveoHashOfCurrentUrl(), // First 30 md5 + first 30 sha1 of coveo url
    contentType, // If we need page views for non-doc pages we'll need an alternative
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
 * @param {*} raw - The 'raw' object on the associated coveo result item.
 */
export async function sendCoveoClickEvent(source, model) {
  /*
  if(window.location.hostname !== 'experienceleague.adobe.com') {
    return;
  }
  */

  const { index, permanentid, searchQueryUid, title, viewLink } = model;
  // const profileData = defaultProfileClient.getMergedProfile(false);
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
    clientId: profileData?.authId,
    actionCause: 'documentOpen',
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

  postCoveoAnalytics(JSON.stringify('click', baseData));
}
