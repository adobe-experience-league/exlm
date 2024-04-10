// eslint-disable-next-line import/no-cycle
import { getConfig, loadIms } from '../scripts.js';
import loadJWT from './jwt.js';
import csrf from './csrf.js';

window.exl = window.exl || {};
window.exl.profileData = window.exl.profileData || null;
window.exl.meta = window.exl.meta || {};

const { profileUrl, JWTTokenUrl } = getConfig();

const override = /^(recommended|votes)$/;

export async function isSignedInUser() {
  try {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser() || false;
  } catch (err) {
    return false;
  }
}

class ProfileClient {
  constructor(url) {
    this.url = url;
    this.jwt = loadJWT();
    this.isSignedIn = isSignedInUser();

    this.cache = {};
  }

  static signOut() {
    ['JWT', 'coveoToken', 'attributes', 'profile'].forEach((key) => sessionStorage.removeItem(key));
    window.adobeIMS?.signOut();
  }

  async getAttributes() {
    return this.fetchProfile({ method: 'OPTIONS' }, 'attributes');
  }

  async getProfile() {
    return this.fetchProfile({}, 'exl-profile');
  }

  async getMergedProfile(refresh) {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;
    const storageKey = 'profile';
    if (!refresh) {
      const fromStorage = sessionStorage.getItem(storageKey);
      if (fromStorage) return JSON.parse(fromStorage);
      if (this.cache[storageKey]) return this.cache[storageKey];
    }
    this.cache[storageKey] = new Promise((resolve, reject) => {
      Promise.all([this.getProfile(refresh), window.adobeIMS?.getProfile()])
        .then(([profile, imsProfile]) => {
          const mergedProfile = { ...profile, ...imsProfile };
          sessionStorage.setItem(storageKey, JSON.stringify(mergedProfile));
          resolve(mergedProfile);
        })
        .catch(reject);
    });
    return this.cache[storageKey];
  }

  async updateProfile(key, val, replace = false) {
    const profile = await this.profile();
    const attribute = await this.getAttributes();

    Object.keys(profile).forEach((i) => {
      if (attribute.write.includes(i) === false) {
        delete profile[i];
      }
    });

    // eslint-disable-next-line
    if (override.test(key) || replace === true) {
      profile[key] = val;
    } else if (window.exl.meta.types[key] === 'array') {
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
    this.fetchProfile();
  }

  async fetchProfile(options, storageKey, refresh) {
    if (!refresh) {
      const fromStorage = sessionStorage.getItem(storageKey);
      if (fromStorage) return JSON.parse(fromStorage);
      if (this.cache[storageKey]) return this.cache[storageKey];
    }
    this.cache[storageKey] = new Promise((resolve, reject) => {
      fetch(this.url, {
        ...options,
        credentials: 'include',
        headers: {
          authorization: this.jwt,
          accept: 'application/json',
          ...options.headers,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          sessionStorage.setItem(storageKey, JSON.stringify(data.data));
          resolve(data.data);
        })
        .catch(reject);
    });

    return this.cache[storageKey];
  }
}

export const defaultProfileClient = new ProfileClient(profileUrl);
