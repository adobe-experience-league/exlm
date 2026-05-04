import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';
import isFeatureEnabled from './feature-flag-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';
const DEFAULT_EXPIRES = 86400;
const PL_ELIGIBILITY_TIMEOUT_MS = 10000;

// Two separate singletons for the two mutually exclusive auth modes (UE Author vs production).
// UE/non-UE is an immutable page-level constant, so each promise is set at most once per load.
// Sign-out calls window.adobeIMS.signOut() which causes a full page reload, resetting both.
let plAuthPromise;
let plAuthAnonymousPromise;

export function getPLAccessToken() {
  return getCookie(LEARNER_TOKEN_COOKIE);
}

// Exchanges IMS token for a PL access token and stores it in cookies.
// When unauthenticated=true (UE Author Mode), appends ?auth=false and omits the Bearer header.
// imsToken is unused when unauthenticated=true — pass null in that case.
async function exchangePLToken(imsToken = null, unauthenticated = false) {
  try {
    const { premiumLearningAuthAPI } = window.exlm?.config || {};
    if (!premiumLearningAuthAPI) return;
    const url = new URL(premiumLearningAuthAPI, window.location.origin);
    const fetchOptions = { method: 'POST' };
    if (unauthenticated) {
      url.searchParams.set('auth', 'false');
    } else {
      if (!imsToken) return; // no token available; skip rather than send Bearer null
      fetchOptions.headers = { Authorization: `Bearer ${imsToken}` };
    }
    const response = await fetch(url, fetchOptions);
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
    const errorMsg = unauthenticated
      ? 'Failed to fetch anonymous PL token (UE Author Mode):'
      : 'Failed to exchange IMS token for Premium Learning token:';
    // eslint-disable-next-line no-console
    console.error(errorMsg, error);
  }
}

// Runs PL authentication once per mode (memoized): validates existing token or fetches a new one.
// When unauthenticated=true (UE Author Mode), skips IMS and calls auth API with ?auth=false.
async function initPLAuth(unauthenticated = false) {
  if (unauthenticated) {
    if (plAuthAnonymousPromise) return plAuthAnonymousPromise;
    plAuthAnonymousPromise = (async () => {
      // Always exchange in UE Author Mode — do not trust any existing cookie.
      // A leftover production token would silently break all PL API calls with no recovery
      // path until the cookie's own TTL expires. One extra call per page load is acceptable
      // in author-only context, and plAuthAnonymousPromise ensures it runs only once.
      await exchangePLToken(null, true);
    })().catch((error) => {
      plAuthAnonymousPromise = undefined;
      throw error;
    });
    return plAuthAnonymousPromise;
  }
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
// When unauthenticated=true (UE Author Mode), uses the ?auth=false init path.
async function verifyPLAuth(timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS, unauthenticated = false) {
  const membershipCheck = initPLAuth(unauthenticated)
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

// Initializes PL auth for UE Author Mode — calls auth API with ?auth=false, no IMS token needed.
export function initPLAuthAnonymous() {
  return initPLAuth(true);
}

/**
 * Checks if the current user is eligible for Premium Learning.
 * In UE Author Mode, uses anonymous ?auth=false flow (no IMS required).
 * @param {boolean|null} [signedIn] - Pass the result of isSignedInUser() to enable fast early exit
 *   for signed-out users. Use null (default) to skip the check and rely on verifyPLAuth.
 *   Strict false short-circuits immediately; null ("unknown") falls through to verifyPLAuth.
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function isPLEligible(signedIn = null, timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS) {
  if (!isFeatureEnabled('isPremiumLearningEnabled')) return false;
  if (window.hlx.aemRoot || window.location.href.includes('.html')) {
    return verifyPLAuth(timeoutMs, true);
  }
  if (signedIn === false) return false;
  return verifyPLAuth(timeoutMs, false);
}

/**
 * @param {boolean|null} [signedIn]
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function applyPLSectionGating(signedIn = null, timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS) {
  const isEligible = await isPLEligible(signedIn, timeoutMs);
  if (!isEligible) document.querySelectorAll('.premium-learning-section').forEach((s) => s.remove());
  return isEligible;
}
