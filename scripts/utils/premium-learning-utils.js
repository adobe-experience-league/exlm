import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';
import isFeatureEnabled from './feature-flag-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';
const DEFAULT_EXPIRES = 86400;

// Module-level singleton — safe in practice because sign-out calls window.adobeIMS.signOut()
// which redirects via IMS and causes a full page reload, resetting this naturally.
let plAuthPromise;

export function getPLAccessToken() {
  return getCookie(LEARNER_TOKEN_COOKIE);
}

// Exchanges IMS token for a Premium Learning access token and stores it in cookies.
async function exchangePLToken(imsToken) {
  try {
    const { premiumLearningAuthAPI } = window.exlm?.config || {};
    if (!premiumLearningAuthAPI) return;
    const response = await fetch(premiumLearningAuthAPI, {
      method: 'POST',
      headers: { Authorization: `Bearer ${imsToken}` },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const {
      access_token: accessToken,
      expires_in: expiresIn = DEFAULT_EXPIRES,
      user_id: userId,
    } = await response.json();
    if (!accessToken) return;
    setCookie(LEARNER_TOKEN_COOKIE, accessToken, expiresIn);
    if (userId) setCookie(LEARNER_USER_ID_COOKIE, userId, expiresIn);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to exchange IMS token for Premium Learning token:', error);
  }
}

// Runs PL authentication once (memoized): validates existing token or fetches a new one via IMS.
async function initPLAuth() {
  if (plAuthPromise) return plAuthPromise;
  plAuthPromise = (async () => {
    const existingToken = getCookie(LEARNER_TOKEN_COOKIE);
    if (existingToken) {
      const { plApiBaseUrl } = window.exlm?.config || {};
      if (!plApiBaseUrl) return; // config not ready; skip validation, keep existing token
      const res = await fetch(`${plApiBaseUrl}/user`, {
        headers: { Authorization: `Bearer ${existingToken}`, Accept: 'application/vnd.api+json' },
      });
      if (res.ok) return;
      [LEARNER_TOKEN_COOKIE, LEARNER_USER_ID_COOKIE].forEach((c) => deleteCookie(c));
    }
    const imsToken = window.adobeIMS?.getAccessToken()?.token;
    if (imsToken) await exchangePLToken(imsToken);
  })().catch((error) => {
    plAuthPromise = undefined;
    throw error;
  });
  return plAuthPromise;
}

// Resolves true if the user has a valid PL token, with a timeout fallback returning false.
async function verifyPLAuth(timeoutMs = 10000) {
  const membershipCheck = initPLAuth()
    .then(() => !!getCookie(LEARNER_TOKEN_COOKIE))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error checking Premium Learning status:', error);
      return false;
    });
  let timeoutHandle;
  const timeout = new Promise((r) => {
    timeoutHandle = setTimeout(() => r(false), timeoutMs);
  });
  return Promise.race([membershipCheck.finally(() => clearTimeout(timeoutHandle)), timeout]);
}

/**
 * @param {boolean} signedIn
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
// TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
export async function isPLEligible(signedIn = false, timeoutMs = 10000) {
  if (!isFeatureEnabled('isPremiumLearningEnabled')) return false;
  if (!signedIn) return false;
  return verifyPLAuth(timeoutMs);
}

/**
 * @param {boolean} signedIn
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function applyPLSectionGating(signedIn = false, timeoutMs = 10000) {
  const isEligible = await isPLEligible(signedIn, timeoutMs);
  if (!isEligible) document.querySelectorAll('.premium-learning-section').forEach((s) => s.remove());
  return isEligible;
}
