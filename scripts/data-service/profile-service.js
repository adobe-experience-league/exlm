import { loadIms } from '../scripts.js';
import { signOut } from '../auth/auth-operations.js';
import loadJWT from '../auth/jwt.js';
import csrf from '../auth/csrf.js';
import { JWTTokenUrl, profileUrl } from '../urls.js';
import { Profile, ProfileAttributes } from '../session-keys.js';
import { request } from '../request.js';

export const override = /^(recommended|votes)$/;

const clone = (arg = {}, transferables = []) => structuredClone(arg, transferables);

// eslint-disable-next-line
export let adobeIMS = {
  isSignedInUser: () => false,
};

try {
  await loadIms();
  adobeIMS = window.adobeIMS;
} catch {
  // eslint-disable-next-line no-console
  console.warn('Adobe IMS not available.');
}

// eslint-disable-next-line
let profileData = null,
  meta = {};

export async function profileAttributes() {
  if (ProfileAttributes in sessionStorage === false) {
    const res = await request(profileUrl, {
      credentials: 'include',
      headers: {
        authorization: await loadJWT(),
        accept: 'application/json',
      },
      method: 'OPTIONS',
    });

    if (res.ok) {
      const data = await res.json();

      sessionStorage.setItem(ProfileAttributes, JSON.stringify(data.data));
    }
  }

  return JSON.parse(sessionStorage.getItem(ProfileAttributes) || '{}');
}

async function profileMerge(arg) {
  const tmp = await adobeIMS?.getProfile();

  // eslint-disable-next-line
  return Object.assign({}, tmp, arg, { avatarUrl: adobeIMS.avatarUrl(tmp.userId) });
}

export async function profile(reuse = false, explicit = false) {
  let result = null;

  if (reuse === false) {
    const data = await adobeIMS?.getProfile();

    if (data !== null) {
      if (profileData === null || explicit) {
        const res = await request(profileUrl, {
          credentials: 'include',
          headers: {
            authorization: await loadJWT(),
            accept: 'application/json',
          },
        });

        if (res.ok && res.status === 200) {
          const arg = await res.json();

          result = await profileMerge(arg.data);
          profileData = clone(result);
        } else {
          signOut();
        }
      } else {
        result = clone(profileData);
      }
    } else {
      signOut();
    }
  } else {
    result = clone(profileData);
  }

  if (result !== null) {
    if (!meta || Object.keys(meta).length === 0) {
      meta = await profileAttributes();
    }

    sessionStorage.setItem(Profile, JSON.stringify(result));
  }

  return result;
}

export async function updateProfile(key, val, replace = false) {
  const data = await profile(false, true);

  if (!meta || Object.keys(meta).length === 0) {
    meta = await profileAttributes();
  }

  // TODO - explore meta.write - writes does not seem to be an object anywhere
  Object.keys(data).forEach((i) => {
    if (meta.write.includes(i) === false) {
      delete data[i];
    }
  });

  // eslint-disable-next-line
  if (override.test(key) || replace === true) {
    data[key] = val;
  } else if (meta.types[key] === 'array') {
    // eslint-disable-next-line
    if (data[key] === void 0 || replace === true) {
      data[key] = [val];
    } else if (Array.isArray(data[key]) === false) {
      data[key] = [data[key], val];
    } else {
      (Array.isArray(val) ? val : [val]).forEach((arg) => {
        if (data[key].includes(arg) === false) {
          data[key].push(arg);
        } else {
          data[key].splice(data[key].indexOf(arg), 1);
        }
      });
    }
  } else {
    data[key] = val;
  }

  const res = await request(profileUrl, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      authorization: await loadJWT(),
      accept: 'application/json',
      'content-type': 'application/json-patch+json',
      'x-csrf-token': await csrf(JWTTokenUrl),
    },
    body: JSON.stringify([{ op: 'replace', path: `/${key}`, value: data[key] }]),
  });

  if (res.ok && res.status < 400) {
    const arg = await res.json();

    profileData = await profileMerge(arg.data);
    await profile(true);
    sessionStorage.setItem(Profile, JSON.stringify(profileData));
  }

  return profileData;
}

export async function fetchProfileData(url, cType) {
    try {
      let data;
      const response = await fetch(url, {
        method: 'GET',
      });
      if (response.ok && cType === "json") {
          data = await response.json();
      } else if (response.ok && cType === "text") {
          data = await response.text();
      }
      return data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
}
