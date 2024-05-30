// eslint-disable-next-line import/no-cycle, max-classes-per-file
import { getConfig, loadIms } from '../scripts.js';
import initStream from '../events/signup-event-stream.js';
// eslint-disable-next-line import/no-cycle
import loadJWT from './jwt.js';
import csrf from './csrf.js';

const { profileUrl, JWTTokenUrl, ppsOrigin, ims, isProd } = getConfig();

const postSignInStreamKey = 'POST_SIGN_IN_STREAM';
const override = /^(recommended|votes)$/;

export async function isSignedInUser() {
  try {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser() || false;
  } catch (err) {
    return false;
  }
}

export async function signOut() {
  ['JWT', 'coveoToken', 'attributes', 'exl-profile', 'profile', 'pps-profile', postSignInStreamKey].forEach((key) =>
    sessionStorage.removeItem(key),
  );
  window.adobeIMS?.signOut();
}

// A store that saves promises and their results in sessionStorage
class PromiseSessionStore {
  constructor() {
    this.store = {};
  }

  async get(key) {
    const fromStorage = sessionStorage.getItem(key);
    if (fromStorage) return JSON.parse(fromStorage);
    if (this.store[key]) return this.cache[key];
    return null;
  }

  async set(key, promise) {
    this.store[key] = promise;
    promise.then((data) => {
      sessionStorage.setItem(key, JSON.stringify(data));
    });
  }
}

class ProfileClient {
  constructor(url) {
    this.url = url;
    this.jwt = loadJWT();
    this.isSignedIn = isSignedInUser();

    this.store = new PromiseSessionStore();
  }

  async getAttributes() {
    const attributes = await this.fetchProfile({ method: 'OPTIONS' }, 'attributes');
    return structuredClone(attributes);
  }

  async getProfile(refresh = false) {
    const profile = await this.fetchProfile({}, 'exl-profile', refresh);
    return structuredClone(profile);
  }

  async getPPSProfile() {
    const PPS_PROFILE = 'pps-profile';
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;

    const fromStorage = await this.store.get(PPS_PROFILE);
    if (fromStorage) return fromStorage;

    const { token } = window.adobeIMS.getAccessToken();
    const accountId = (await window.adobeIMS.getProfile()).userId;

    const promise = new Promise((resolve, reject) => {
      fetch(`${ppsOrigin}/api/profile`, {
        headers: {
          'X-Api-Key': ims.client_id,
          'X-Account-Id': accountId,
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => (res.ok ? res.json() : undefined))
        .then((json) => {
          if (json) resolve(json);
          else reject(new Error('Failed to fetch PPS profile'));
        })
        .catch(reject);
    });
    this.store.set(PPS_PROFILE, promise);
    return promise;
  }

  async getMergedProfile(refresh) {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;
    const storageKey = 'profile';
    if (!refresh) {
      const fromStore = await this.store.get(storageKey);
      if (fromStore) return fromStore;
    }

    const promise = new Promise((resolve, reject) => {
      Promise.all([this.getProfile(refresh), window.adobeIMS?.getProfile()])
        .then(([profile, imsProfile]) => {
          const mergedProfile = { ...profile, ...imsProfile };
          sessionStorage.setItem(storageKey, JSON.stringify(mergedProfile));
          resolve(mergedProfile);
        })
        .catch(reject);
    });
    this.store.set(storageKey, promise);
    return promise;
  }

  async updateProfile(key, val, replace = false) {
    const profile = await this.getProfile();
    const attriubutes = await this.getAttributes();

    Object.keys(profile).forEach((i) => {
      if (attriubutes.write.includes(i) === false) {
        delete profile[i];
      }
    });

    // eslint-disable-next-line
    if (override.test(key) || replace === true) {
      profile[key] = val;
    } else if (attriubutes.types[key] === 'array') {
      // eslint-disable-next-line
      if (profile[key] === void 0 || replace === true) {
        profile[key] = [val];
      } else if (Array.isArray(profile[key]) === false) {
        profile[key] = [profile[key], val];
      } else {
        (Array.isArray(val) ? val : [val]).forEach((arg) => {
          if (profile[key].includes(arg) === false) {
            profile[key].push(arg);
          } else {
            profile[key].splice(profile[key].indexOf(arg), 1);
          }
        });
      }
    } else {
      profile[key] = val;
    }

    await this.fetchProfile({
      method: 'PATCH',
      headers: {
        'content-type': 'application/json-patch+json',
        'x-csrf-token': await csrf(JWTTokenUrl),
      },
      body: JSON.stringify([{ op: 'replace', path: `/${key}`, value: profile[key] }]),
    });

    // uppdate the profile in session storage after the changes
    await this.getMergedProfile(true);
  }

  /**
   * @param {Request} options
   * @param {string} storageKey
   * @param {boolean} refresh
   * @returns
   */
  async fetchProfile(options, storageKey, refresh) {
    if (storageKey && !refresh) {
      const fromStorage = await this.store.get(storageKey);
      if (fromStorage) return fromStorage;
    }
    const promise = new Promise((resolve, reject) => {
      this.jwt.then((jwt) => {
        fetch(this.url, {
          ...options,
          credentials: 'include',
          headers: {
            authorization: jwt,
            accept: 'application/json',
            ...options.headers,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            // FIXME: hostname check to be removed later.
            if (!isProd && !sessionStorage.getItem(postSignInStreamKey)) {
              initStream();
              sessionStorage.setItem(postSignInStreamKey, 'true');
            }
            if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(data.data));
            resolve(structuredClone(data.data));
          })
          .catch(reject);
      });
    });
    this.store.set(storageKey, promise);
    return promise;
  }
}

export const defaultProfileClient = new ProfileClient(profileUrl);
