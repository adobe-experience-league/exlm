// eslint-disable-next-line import/no-cycle
import { getConfig, loadIms } from '../scripts.js';
import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';

export function setAlmAccessToken(token, expiresInSeconds = 86400) {
  if (token) setCookie(LEARNER_TOKEN_COOKIE, token, expiresInSeconds);
}

export function getAlmAccessToken() {
  return getCookie(LEARNER_TOKEN_COOKIE);
}

export function removeAlmAccessToken() {
  deleteCookie(LEARNER_TOKEN_COOKIE);
}

/** Clears learner token and user ID cookies. Call on sign-out or invalid token. */
export function clearAllAlmAuthData() {
  deleteCookie(LEARNER_TOKEN_COOKIE);
  deleteCookie(LEARNER_USER_ID_COOKIE);
}

/** Alias for getAlmAccessToken @returns {string|null} */
export function getAuthToken() {
  return getAlmAccessToken();
}

/** @param {string} userId @param {number} expiresInSeconds */
export function setAlmUserId(userId, expiresInSeconds = 86400) {
  if (userId) setCookie(LEARNER_USER_ID_COOKIE, userId, expiresInSeconds);
}

/** @returns {string|null} */
export function getAlmUserId() {
  return getCookie(LEARNER_USER_ID_COOKIE);
}

/** Alias for getAlmUserId @returns {string|null} */
export function getUserId() {
  return getAlmUserId();
}

/**
 * Validates a learner token against the ALM API.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function isTokenValid(token) {
  try {
    const { almApiBaseUrl } = getConfig();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.api+json' };
    const res = await fetch(`${almApiBaseUrl}/user`, { headers });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Returns true if a learner token cookie is present (no AIO call).
 * Fast path for cross-app navigation — both Core Site and Premium Learning use this.
 * @returns {boolean}
 */
export function hasLearnerTokenCookie() {
  return !!getAlmAccessToken();
}

/**
 * Exchanges an IMS token for an ALM learner token via the AIO endpoint.
 * Stores the result in cookies.
 * @param {string} imsToken
 * @returns {Promise<boolean>}
 */
async function exchangeImsTokenForAlmToken(imsToken) {
  try {
    const { adobeIOAlmEndpoint } = getConfig();
    const response = await fetch(adobeIOAlmEndpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${imsToken}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const tokenResponse = await response.json();
    if (!tokenResponse.access_token) return false;

    const expiresIn = tokenResponse.expires_in || 86400;
    setAlmAccessToken(tokenResponse.access_token, expiresIn);
    if (tokenResponse.user_id) setAlmUserId(tokenResponse.user_id, expiresIn);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetches an anonymous learner token from the AIO endpoint.
 * @param {string|null} email
 * @returns {Promise<boolean>}
 */
async function fetchAnonymousLearnerToken(email = null) {
  try {
    const { adobeIOAlmEndpoint } = getConfig();
    const ioUrl = new URL(adobeIOAlmEndpoint);

    if (email) {
      ioUrl.searchParams.set('email', email);
    } else {
      ioUrl.searchParams.set('auth', 'false');
    }

    const response = await fetch(ioUrl.toString(), {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    if (!response.ok) throw new Error(`Anonymous auth failed: ${response.status}`);

    const tokenResponse = await response.json();
    if (!tokenResponse.access_token) return false;

    const expiresIn = tokenResponse.expires_in || 86400;
    setAlmAccessToken(tokenResponse.access_token, expiresIn);
    if (tokenResponse.user_id) setAlmUserId(tokenResponse.user_id, expiresIn);

    // Remove auth/email params from URL
    const cleanUrl = new URL(window.location);
    cleanUrl.searchParams.delete('auth');
    cleanUrl.searchParams.delete('email');
    window.history.replaceState({}, '', cleanUrl.toString());

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Called by Core Site after IMS sign-in to check Premium Learning access.
 * - Fast path: valid cookie already exists → returns true without AIO call.
 * - Normal path: exchanges IMS token via AIO → stores cookie → returns true/false.
 * @param {string} imsToken - from window.adobeIMS.getAccessToken().token
 * @returns {Promise<boolean>}
 */
export async function initializePremiumLearning(imsToken) {
  if (!imsToken) return false;

  const existingToken = getAlmAccessToken();
  if (existingToken) {
    const isValid = await isTokenValid(existingToken);
    if (isValid) return true;
    clearAllAlmAuthData();
  }

  return exchangeImsTokenForAlmToken(imsToken);
}

/**
 * Auth flow for Premium Learning application.
 * - Anonymous/email path: fetches anonymous token.
 * - Case B (cookie exists): validates cookie, returns true immediately.
 * - Case A (no cookie): exchanges IMS token via AIO.
 * @param {string|null} imsToken
 * @param {boolean} isAnonymous
 * @param {string|null} email
 * @returns {Promise<boolean>}
 */
export async function runAuthFlow(imsToken, isAnonymous = false, email = null) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error')) return false;

    if (isAnonymous) return fetchAnonymousLearnerToken(email);

    // Case B: existing valid cookie — skip AIO call
    const existingToken = getAlmAccessToken();
    if (existingToken) {
      const isValid = await isTokenValid(existingToken);
      if (isValid) return true;
      clearAllAlmAuthData();
    }

    // Case A: exchange IMS token
    if (imsToken) return exchangeImsTokenForAlmToken(imsToken);

    return false;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Authentication initialization failed:', err);
    return false;
  }
}

/**
 * Main entry point for Premium Learning app authentication.
 * Reads URL params to decide anonymous vs IMS flow, then calls runAuthFlow.
 * @returns {Promise<boolean>}
 */
export async function initializeAuthentication() {
  const urlParams = new URLSearchParams(window.location.search);
  const authFlag = urlParams.get('auth');
  const emailParam = urlParams.get('email');
  const isAnonymous = authFlag === 'false' || emailParam !== null;

  let imsToken = null;
  if (!isAnonymous) {
    try {
      await loadIms();
      const isSignedIn = window?.adobeIMS?.isSignedInUser();
      if (isSignedIn) imsToken = window.adobeIMS.getAccessToken()?.token || null;
    } catch (e) {
      // IMS init failed — proceed without token
    }
  }

  return runAuthFlow(imsToken, isAnonymous, emailParam);
}
