import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';
import isFeatureEnabled from './feature-flag-utils.js';
import { isDomainAllowed } from './exlm-config-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';
const DEFAULT_EXPIRES = 86400;
const PL_ELIGIBILITY_TIMEOUT_MS = 10000;
const isUEMode = window.hlx?.aemRoot || window.location.href.includes('.html');

// Two separate singletons for the two mutually exclusive auth modes (UE Author vs production).
// UE/non-UE is an immutable page-level constant, so each promise is set at most once per load.
// Sign-out calls window.adobeIMS.signOut() which causes a full page reload, resetting both.
let plAuthPromise;
let plAuthUePromise;

export function getPLAccessToken() {
  return getCookie(LEARNER_TOKEN_COOKIE);
}

// Exchanges an optional IMS token for a PL access token and stores it in cookies.
async function exchangePLToken(imsToken = null) {
  try {
    const { premiumLearningAuthAPI } = window.exlm?.config || {};
    if (!premiumLearningAuthAPI) return;
    const fetchOptions = { method: 'POST' };
    if (imsToken) fetchOptions.headers = { Authorization: `Bearer ${imsToken}` };
    const response = await fetch(premiumLearningAuthAPI, fetchOptions);
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
    console.error('Failed to fetch Premium Learning token:', error);
  }
}

// Runs PL authentication once per mode (memoized): validates existing token or fetches a new one.
async function initPLAuth(ueAuthorMode = false) {
  if (ueAuthorMode) {
    if (plAuthUePromise) return plAuthUePromise;
    plAuthUePromise = (async () => {
      // Always fetch a fresh token in UE mode; the endpoint allows the UE origin directly.
      await exchangePLToken();
    })().catch((error) => {
      plAuthUePromise = undefined;
      throw error;
    });
    return plAuthUePromise;
  }
  if (plAuthPromise) return plAuthPromise;
  plAuthPromise = (async () => {
    const existingToken = getCookie(LEARNER_TOKEN_COOKIE);
    if (existingToken) {
      const { plApiBaseUrl } = window.exlm?.config || {};
      if (!plApiBaseUrl) return; // config not ready; skip validation, keep existing token
      const res = await fetch(`${plApiBaseUrl}/user`, {
        headers: { Authorization: `oauth ${existingToken}`, Accept: 'application/vnd.api+json' },
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
async function verifyPLAuth(timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS, ueAuthorMode = false) {
  const membershipCheck = initPLAuth(ueAuthorMode)
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

// Initializes PL auth for UE Author Mode using the allowlisted editor origin.
export function initPLAuthForUe() {
  return initPLAuth(true);
}

/**
 * Checks if the current user is eligible for Premium Learning.
 * In UE Author Mode, calls the ALM authentication API directly from the allowlisted editor origin.
 * @param {boolean|null} [signedIn] - Pass the result of isSignedInUser() to enable fast early exit
 *   for signed-out users. Use null (default) to skip the check and rely on verifyPLAuth.
 *   Strict false short-circuits immediately; null ("unknown") falls through to verifyPLAuth.
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function isPLEligible(signedIn = null, timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS) {
  if (isFeatureEnabled('isPremiumLearningEnabled')) {
    if (isUEMode) return verifyPLAuth(timeoutMs, true);
    if (signedIn === false) return false;
    return verifyPLAuth(timeoutMs, false);
  }
  if (signedIn === false) return false;
  if (!(await isDomainAllowed('plAllowedDomains'))) return false;
  return verifyPLAuth(timeoutMs, false);
}

/**
 * @param {boolean|null} [signedIn]
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function applyPLSectionGating(signedIn = null, timeoutMs = PL_ELIGIBILITY_TIMEOUT_MS) {
  // Skip cookie cleanup in UE Author Mode — IMS is absent so signedIn is always false,
  // but a valid anonymous PL token may already exist and must not be wiped before content renders.
  if (signedIn === false && !isUEMode) [LEARNER_TOKEN_COOKIE, LEARNER_USER_ID_COOKIE].forEach((c) => deleteCookie(c));
  const isEligible = await isPLEligible(signedIn, timeoutMs);
  if (!isEligible) document.querySelectorAll('.premium-learning-section').forEach((s) => s.remove());
  return isEligible;
}

/**
 * Handles Premium Learning block errors by showing fallback content in UE mode or removing on publish.
 * @param {HTMLElement} block - The block element to handle
 * @param {Function} [showFallbackFn] - Optional function to call in UE mode to show fallback content.
 */
export function handlePLBlockError(block, showFallbackFn = null) {
  // In UE Author Mode, show fallback content if provided
  if (isUEMode) {
    showFallbackFn?.(block);
    return;
  }

  const parentSection = block.closest('.section');
  block.remove();
  // Check if section is empty after removing block
  if (parentSection && !parentSection.querySelector('.block')) {
    parentSection.remove();
  }
}
