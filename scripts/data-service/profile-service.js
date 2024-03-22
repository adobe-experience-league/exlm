// eslint-disable-next-line import/no-cycle
import { getConfig, loadIms } from '../scripts.js';
import { signOut } from '../auth/auth-operations.js';
import loadJWT from '../auth/jwt.js';
import csrf from '../auth/csrf.js';
import { Profile, ProfileAttributes } from '../session-keys.js';
import { request } from '../request.js';

window.exl = window.exl || {};
window.exl.profileData = window.exl.profileData || null;
window.exl.meta = window.exl.meta || {};

const { profileUrl, JWTTokenUrl } = getConfig();

export const override = /^(recommended|votes)$/;

const clone = (arg = {}, transferables = []) => structuredClone(arg, transferables);

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

export async function isSignedInUser() {
  try {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser() || false;
  } catch (err) {
    return false;
  }
}

// eslint-disable-next-line
async function profileMerge(arg) {
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const tmp = await window.adobeIMS?.getProfile();

    // eslint-disable-next-line
    return Object.assign({}, tmp, arg, { avatarUrl: adobeIMS.avatarUrl(tmp.userId) });
  }
}

export async function profile(reuse = false, explicit = false) {
  let result = null;

  if (reuse === false) {
    const isSignedIn = await isSignedInUser();
    if (isSignedIn) {
      const data = await window.adobeIMS?.getProfile();

      if (data !== null) {
        if (window.exl.profileData === null || explicit) {
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
            window.exl.profileData = clone(result);
          } else {
            signOut();
          }
        } else {
          result = clone(window.exl.profileData);
        }
      } else {
        signOut();
      }
    }
  } else {
    result = clone(window.exl.profileData);
  }

  if (result !== null) {
    if (!window.exl.meta || Object.keys(window.exl.meta).length === 0) {
      window.exl.meta = await profileAttributes();
    }

    sessionStorage.setItem(Profile, JSON.stringify(result));
  }

  return result;
}

export async function updateProfile(key, val, replace = false) {
  const data = await profile(false, true);

  if (!window.exl.meta || Object.keys(window.exl.meta).length === 0) {
    window.exl.meta = await profileAttributes();
  }

  // TODO - explore meta.write - writes does not seem to be an object anywhere
  Object.keys(data).forEach((i) => {
    if (window.exl.meta.write.includes(i) === false) {
      delete data[i];
    }
  });

  // eslint-disable-next-line
  if (override.test(key) || replace === true) {
    data[key] = val;
  } else if (window.exl.meta.types[key] === 'array') {
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

    window.exl.profileData = await profileMerge(arg.data);
    await profile(true);
    sessionStorage.setItem(Profile, JSON.stringify(window.exl.profileData));
  }

  return window.exl.profileData;
}
