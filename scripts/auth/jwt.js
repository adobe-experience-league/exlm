// eslint-disable-next-line import/no-cycle
import csrf from './csrf.js';
import { getConfig } from '../scripts.js';
import { isSignedInUser } from './profile.js';

const { JWTTokenUrl } = getConfig();

/**
 * Fetches and stores JWT token in the session storage.
 *
 * @throws {Error} If JWT retrieval fails.
 * @returns {Promise<string | Error>} A promise that resolves with the JWT token or an error.
 */
async function fetchAndStoreJWT() {
  try {
    // Get user profile data from Adobe IMS
    const profileData = await adobeIMS?.getProfile(); // eslint-disable-line
    // Construct the request body
    const requestBody = {
      firstName: profileData?.first_name || '',
      lastName: profileData?.last_name || '',
      displayName: profileData?.displayName || '',
      email: profileData?.email || '',
      userId: profileData?.authId || '', // UGP-13266 use authId as the userId
      accessToken: adobeIMS.getAccessToken()?.token || '', // eslint-disable-line
      sessionId: (profileData?.session || '').replace(/.*\//, ''),
      accountType: profileData?.account_type || '',
      ownerOrg: profileData?.ownerOrg || '',
    };

    // Send a request to fetch JWT token from the server
    const response = await fetch(JWTTokenUrl, {
      credentials: 'include',
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': await csrf(JWTTokenUrl),
      },
      body: JSON.stringify(requestBody),
    });

    // Check if the request was successful and the JWT is present in the response headers
    if (response.ok && response.headers.has('authorization')) {
      const token = response.headers.get('authorization');
      // Store the JWT token in session storage
      sessionStorage.setItem('JWT', token);
      return token;
    }
    return new Error('Failed to retrieve JWT');
  } catch (error) {
    return new Error(`Failed to retrieve JWT: ${error}`);
  }
}

export default async function loadJWT() {
  window.exlm = window.exlm || {};
  window.exlm.JWTToken =
    window.exlm.JWTToken ||
    new Promise((resolve, reject) => {
      isSignedInUser().then((signedIn) => {
        if (signedIn) {
          // If JWT is present in session storage, return it; otherwise, fetch and store JWT
          if ('JWT' in sessionStorage) {
            resolve(sessionStorage.getItem('JWT'));
          } else {
            sessionStorage.removeItem('coveoToken');
            fetchAndStoreJWT().then(resolve).catch(reject);
          }
        }
      });
    });
  return window.exlm.JWTToken;
}
