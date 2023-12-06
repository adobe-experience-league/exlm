import { loadIms } from '../scripts.js';
import { signOut } from '../auth/auth-operations.js';
import loadJWT from '../auth/jwt.js';
import csrf from '../auth/csrf.js';
import { JWTTokenUrl, profileUrl } from '../urls.js';
import { Profile, ProfileAttributes } from '../session-keys.js';
import { request, headerKeys, headerValues } from '../request.js';

export const override = /^(recommended|votes)$/;

const sC = typeof structuredClone === 'function';

export function clone(arg = {}, transferables = []) {
  let result;

  if (sC) {
    result = structuredClone(arg, transferables);
  } else {
    result = JSON.parse(JSON.stringify(arg));

    // eslint-disable-next-line
    for (const key of transferables) {
      result[key] = arg[key];
    }
  }

  // eslint-disable-next-line
  return result;
}

export function merge(a = {}, b = {}) {
  // eslint-disable-next-line
  let result = clone(a);

  // eslint-disable-next-line
  Object.keys(b).forEach((key) => {
    result[key] = Object.assign(clone(result[key] || {}), b[key]);
  });
}

// eslint-disable-next-line
export let adobeIMS = {
  isSignedInUser: () => false,
};

try {
  const ims = await loadIms();
  adobeIMS = ims.adobeIMS;
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
        [headerKeys.auth]: await loadJWT(),
        [headerKeys.accept]: headerValues.json,
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

export async function profile(reuse = false, cstream = true, explicit = false) {
  let result = null;

  if (reuse === false) {
    const data = await adobeIMS?.getProfile();

    if (data !== null) {
      if (profileData === null || explicit) {
        const res = await request(profileUrl, {
          credentials: 'include',
          headers: {
            [headerKeys.auth]: await loadJWT(),
            [headerKeys.accept]: headerValues.json,
          },
        });

        if (res.ok && res.status === 200) {
          const arg = await res.json();

          result = await profileMerge(arg.data);
          profileData = clone(result);

          if (cstream) {
            // createStream();
          }
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
  const data = await profile(false, false, true);

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
