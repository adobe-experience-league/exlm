import { JWT } from './session-keys.js';
import { signOut } from './auth-operations.js';
import { JWTToken as JWTTokenUrl } from './urls.js';
import csrf from './csrf.js';
import fetchData from '../request.js';

/**
 * Fetches and stores JWT token in the session storage.
 *
 * @throws {Error} If JWT retrieval fails.
 * @returns {Promise<string | Error>} A promise that resolves with the JWT token or an error.
 */
export default async function fetchAndStoreJWT() {
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
      const JWTToken = response.headers.get('authorization');
      // Store the JWT token in session storage
      sessionStorage.setItem(JWT, JWTToken);
      return JWTToken;
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
