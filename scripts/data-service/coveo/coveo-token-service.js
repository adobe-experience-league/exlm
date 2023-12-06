import csrf from '../../auth/csrf.js';
import fetchData from '../../request.js';
import { coveoTokenUrl } from '../../urls.js';
import { COVEO_TOKEN } from '../../session-keys.js';
import { loadIms } from '../../scripts.js';
import loadJWT from '../../auth/jwt.js';

const timers = new Map();

async function retrieveCoveoToken(email = '', token = '') {
  let result = null;
  let error = null;
  let status = 0;

  try {
    const response = await fetchData(coveoTokenUrl, {
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
  let adobeIMS = {
    isSignedInUser: () => false,
  };

  try {
    const imsResponse = await loadIms();
    adobeIMS = imsResponse.adobeIMS;
  } catch {
    /* eslint-disable no-console */
    console.warn('Adobe IMS not available.');
  }

  const isUserSignedIn = adobeIMS?.isSignedInUser();

  if (isUserSignedIn) {
    const userProfile = await adobeIMS.getProfile();
    userEmail = userProfile.email;
  }

  let coveoToken = '';
  let csrfToken = '';
  let retryCount = 0;
  const maxRetries = 5;
  const retryAttempts = Array.from({ length: 10 }, (_, idx) => idx + 1);
  let retryInterval = 50;

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
    retryInterval = 6e4 * 5;
  } else {
    sessionStorage.removeItem(COVEO_TOKEN);
  }

  if (timers.has(COVEO_TOKEN)) {
    clearTimeout(timers.get(COVEO_TOKEN));
  }

  timers.set(
    COVEO_TOKEN,
    () => {
      timers.delete(COVEO_TOKEN);
      fetchAndStoreCoveoToken();
    },
    retryInterval,
  );

  return coveoToken;
}

let coveoResponseToken = '';
export default async function loadCoveoToken() {
  coveoResponseToken =
    coveoResponseToken ||
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
      const isSignedInUser = window.adobeIMS && window.adobeIMS?.isSignedInUser();
      if (isSignedInUser) {
        loadJWT().then(async () => {
          if (sessionStorage[COVEO_TOKEN]) {
            resolve(sessionStorage.getItem(COVEO_TOKEN));
          } else {
            const token = await fetchAndStoreCoveoToken();
            resolve(token);
          }
        });
      } else {
        // eslint-disable-next-line no-lonely-if
        if (sessionStorage[COVEO_TOKEN]) {
          resolve(sessionStorage.getItem(COVEO_TOKEN));
        } else {
          const token = await fetchAndStoreCoveoToken();
          resolve(token);
        }
      }
    });
  return coveoResponseToken;
}
