import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';
const DEFAULT_EXPIRES = 86400;

/** Returns the ExL config object directly from window, avoiding a circular import with scripts.js */
function getConfig() {
  return window.exlm?.config || {};
}

function setAlmAccessToken(token, expiresInSeconds = 86400) {
  if (token) setCookie(LEARNER_TOKEN_COOKIE, token, expiresInSeconds);
}

/** Clears learner token and user ID cookies. Call on sign-out or invalid token. */
function clearAllAlmAuthData() {
  [LEARNER_TOKEN_COOKIE, LEARNER_USER_ID_COOKIE].forEach((cookie) => deleteCookie(cookie));
}

/** @param {string} userId @param {number} expiresInSeconds */
function setAlmUserId(userId, expiresInSeconds = 86400) {
  if (userId) setCookie(LEARNER_USER_ID_COOKIE, userId, expiresInSeconds);
}

/**
 * Validates a learner token against the ALM API.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function isTokenValid(token) {
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
 * Exchanges an IMS token for an ALM learner token via the AIO endpoint.
 * Stores the result in cookies.
 * @param {string} imsToken
 */
async function retriveAlmToken(imsToken) {
  try {
    const { adobeIOAlmEndpoint } = getConfig();
    if (!adobeIOAlmEndpoint) return;
    const response = await fetch(adobeIOAlmEndpoint, {
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

    setAlmAccessToken(accessToken, expiresIn);
    if (userId) setAlmUserId(userId, expiresIn);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to exchange IMS token for ALM token:', error);
  }
}

/**
 * Validates the existing ALM cookie. Clears auth data if invalid.
 * @returns {Promise<boolean>} true if a valid cookie exists
 */
async function validateExistingToken() {
  const existingToken = getCookie(LEARNER_TOKEN_COOKIE);
  if (!existingToken) return false;
  const isValid = await isTokenValid(existingToken);
  if (!isValid) clearAllAlmAuthData();
  return isValid;
}

/**
 * Processes the ALM authentication flow for the Premium Learning application.
 * @param {string} imsToken
 */
async function processAlmAuthFlow(imsToken) {
  try {
    // existing valid cookie — skip AIO call
    if (await validateExistingToken()) return;
    // exchange IMS token
    if (imsToken) await retriveAlmToken(imsToken);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Authentication initialization failed:', err);
  }
}

/**
 * Main entry point for Premium Learning app authentication.
 * Called only for signed-in users — retrieves IMS token and processes ALM auth flow.
 */
export default async function initializeAuthentication() {
  const imsToken = window.adobeIMS.getAccessToken()?.token || null;
  await processAlmAuthFlow(imsToken);
}
