import csrf from '../../auth/csrf.js';
import { COVEO_TOKEN } from '../../session-keys.js';
import loadJWT from '../../auth/jwt.js';
import { getConfig } from '../../scripts.js';
import { isSignedInUser } from '../../auth/profile.js';

const { coveoTokenUrl } = getConfig();

/**
 * Decodes a Coveo token to extract its expiration time (`exp`).
 * @param {string} token - The JSON Web Token (JWT) as a string.
 * @returns {number} The expiration time (`exp`) as a Unix timestamp.
 */

function decodeCoveoTokenValidity(token) {
  const tokenPayload = token?.split('.')[1]; // Get the payload
  const jsonPayload = JSON.parse(atob(tokenPayload)); // Decode the Base64-encoded token payload and parse it into a JSON object.
  return jsonPayload?.exp;
}

async function retrieveCoveoToken(email = '', token = '') {
  let result = null;
  let error = null;
  let status = 0;

  try {
    const response = await fetch(coveoTokenUrl, {
      credentials: 'include',
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': token,
      },
      body: JSON.stringify({ email }),
    });

    status = response.status;

    if (response.ok) {
      const data = await response.json();

      if ((data.data || '').length > 0) {
        result = data.data;
      } else {
        error = new Error('Could not retrieve token');
      }
    } else {
      error = new Error('Could not retrieve token');
    }
  } catch (err) {
    error = err;
  }

  return [result, error, status];
}

async function fetchAndStoreCoveoToken() {
  let userEmail = `exl-anonymous-${Math.floor(Math.random() * 1e6)}@experienceleague.local`;

  const signedIn = await isSignedInUser();

  if (signedIn) {
    const userProfile = await window?.adobeIMS?.getProfile();
    userEmail = userProfile.email;
  }

  let coveoToken = '';
  let csrfToken = '';
  let retryCount = 0;
  const maxRetries = 5;
  const retryAttempts = Array.from({ length: 10 }, (_, idx) => idx + 1);

  while (csrfToken.length === 0 && retryCount < maxRetries) {
    try {
      /* eslint-disable no-await-in-loop */
      csrfToken = await csrf(coveoTokenUrl);
    } catch (err) {
      /* eslint-disable no-console */
      console.error("Couldn't retrieve CSRF token for Coveo, trying again", err);
    }
    retryCount += 1;
  }

  if (csrfToken.length > 0) {
    /* eslint-disable no-restricted-syntax */
    for (const attempt of retryAttempts) {
      /* eslint-disable no-await-in-loop */
      const [tokenData, tokenError] = await retrieveCoveoToken(userEmail, csrfToken);

      if (tokenData !== null && tokenError === null) {
        coveoToken = tokenData;
        break;
      } else {
        /* eslint-disable no-console */
        console.error(tokenError?.message ?? `Failed to retrieve Coveo token [${attempt}]`);
      }
    }
  } else {
    /* eslint-disable no-console */
    console.error('Failed to retrieve CSRF token for Coveo access token request');
  }

  if (coveoToken.length > 0) {
    sessionStorage.setItem(COVEO_TOKEN, coveoToken);
  } else {
    sessionStorage.removeItem(COVEO_TOKEN);
  }

  return coveoToken;
}

let coveoResponseToken = '';
let coveoTokenExpirationTime = '';
export default async function loadCoveoToken() {
  const { isProd, coveoToken } = getConfig();
  if (!isProd) {
    return coveoToken;
  }
  const storedCoveoToken = sessionStorage.getItem(COVEO_TOKEN);

  if (storedCoveoToken) {
    const currentTime = Math.floor(Date.now() / 1000);
    coveoTokenExpirationTime = coveoTokenExpirationTime || decodeCoveoTokenValidity(storedCoveoToken);
    if (coveoTokenExpirationTime > currentTime) {
      return storedCoveoToken;
    }
  }

  // `coveoResponseToken` ensures that repeated calls to loadCoveoToken() return the same Promise while a token is being fetched.

  coveoResponseToken =
    coveoResponseToken ||
    new Promise((resolve, reject) => {
      (async () => {
        try {
          const signedIn = await isSignedInUser();

          const processToken = async () => {
            const token = await fetchAndStoreCoveoToken();
            if (token) {
              coveoTokenExpirationTime = decodeCoveoTokenValidity(token);
              resolve(token);
            } else {
              reject(new Error('Error fetching new coveo token'));
            }
            coveoResponseToken = ''; // Reset the token
          };

          if (signedIn) {
            loadJWT()
              .then(processToken)
              .catch((error) => {
                reject(new Error(`Error in loadJWT: ${error.message}`));
                coveoResponseToken = '';
              });
          } else {
            await processToken();
          }
        } catch (error) {
          reject(new Error(`Error fetching new coveo token: ${error.message}`));
          coveoResponseToken = '';
        }
      })();
    });
  return coveoResponseToken;
}
