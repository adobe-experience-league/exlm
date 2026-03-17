import { setCookie, getCookie, deleteCookie } from './cookie-utils.js';

const LEARNER_TOKEN_COOKIE = 'alm_access_token';
const LEARNER_USER_ID_COOKIE = 'alm_user_id';
const DEFAULT_EXPIRES = 86400;

/** Returns the ExL config object directly from window, avoiding a circular import with scripts.js */
function getConfig() {
  return window.exlm?.config || {};
}

function setPLAccessToken(token, expiresInSeconds = 86400) {
  if (token) setCookie(LEARNER_TOKEN_COOKIE, token, expiresInSeconds);
}

export function getPLAccessToken() {
  return getCookie(LEARNER_TOKEN_COOKIE);
}

/** Clears learner token and user ID cookies. Call on sign-out or invalid token. */
function clearAllPLAuthData() {
  [LEARNER_TOKEN_COOKIE, LEARNER_USER_ID_COOKIE].forEach((cookie) => deleteCookie(cookie));
}

/** @param {string} userId @param {number} expiresInSeconds */
function setPremiumUserId(userId, expiresInSeconds = 86400) {
  if (userId) setCookie(LEARNER_USER_ID_COOKIE, userId, expiresInSeconds);
}

/**
 * Validates a learner token against the Premium Learning API.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function isTokenPLValid(token) {
  try {
    const { plApiBaseUrl } = getConfig();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.api+json' };
    const res = await fetch(`${plApiBaseUrl}/user`, { headers });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Exchanges an IMS token for an Premium learner token via the Premium Learning Auth endpoint.
 * Stores the result in cookies.
 * @param {string} imsToken
 */
async function retrivePLToken(imsToken) {
  try {
    const { premiumLearningAuthAPI } = getConfig();
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

    setPLAccessToken(accessToken, expiresIn);
    if (userId) setPremiumUserId(userId, expiresIn);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to exchange IMS token for Premium Learning token:', error);
  }
}

/**
 * Validates the existing PL cookie. Clears auth data if invalid.
 * @returns {Promise<boolean>} true if a valid cookie exists
 */
async function validateExistingPLToken() {
  const existingPLToken = getCookie(LEARNER_TOKEN_COOKIE);
  if (!existingPLToken) return false;
  const isValid = await isTokenPLValid(existingPLToken);
  if (!isValid) clearAllPLAuthData();
  return isValid;
}

/**
 * Processes the PL authentication flow for the Premium Learning application.
 * @param {string} imsToken
 */
async function processPLAuthFlow(imsToken) {
  try {
    // existing valid cookie — skip Premium Learning Auth call
    if (await validateExistingPLToken()) return;
    // exchange IMS token
    if (imsToken) await retrivePLToken(imsToken);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Premium Learning Authentication initialization failed:', err);
  }
}

/**
 * Returns whether the premium learner cookie (ALM access token) is present.
 * Use this to show Premium Learning nav/links only when the user has ALM auth.
 * @returns {boolean}
 */
export function isPremiumLearner() {
  return !!getCookie(LEARNER_TOKEN_COOKIE);
}

/**
 * Main entry point for Premium Learning app authentication.
 * Called only for signed-in users — retrieves IMS token and processes PL auth flow.
 */
export default async function initializePLAuthentication() {
  const imsToken = window.adobeIMS.getAccessToken()?.token || null;
  await processPLAuthFlow(imsToken);
}
