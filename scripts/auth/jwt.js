import { JWT, COVEO_TOKEN } from './session-keys.js';
import { signOut } from './auth-operations.js';
import { JWTTokenUrl } from '../urls.js';
import csrf from './csrf.js';
import fetchData from '../request.js';

let JWTToken;

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
      userId: profileData?.userId || '',
      accessToken: adobeIMS.getAccessToken()?.token || '', // eslint-disable-line
      sessionId: (profileData?.session || '').replace(/.*\//, ''),
      accountType: profileData?.account_type || '',
      ownerOrg: profileData?.ownerOrg || '',
    };

    // Send a request to fetch JWT token from the server
    const response = await fetchData(JWTTokenUrl, {
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
      sessionStorage.setItem(JWT, token);
      return token;
    }

    // If the request was not successful or JWT is not present, sign out and throw an error
    signOut();
    return new Error('Failed to retrieve JWT');
  } catch (error) {
    // Sign out and throw an error if an exception occurs during JWT retrieval
    signOut();
    return new Error(`Failed to retrieve JWT: ${error}`);
  }
}

export default async function loadJWT() {
  JWTToken =
    JWTToken ||
    new Promise((resolve) => {
      const isSignedInUser = window.adobeIMS && window.adobeIMS?.isSignedInUser();
      if (isSignedInUser) {
        // If JWT is present in session storage, return it; otherwise, fetch and store JWT
        if (JWT in sessionStorage) {
          resolve(sessionStorage.getItem(JWT));
        } else {
          sessionStorage.removeItem(COVEO_TOKEN);
          const jwt = fetchAndStoreJWT();
          resolve(jwt);
        }
      }
      resolve(null);
    });
  return JWTToken;
}
