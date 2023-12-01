import {authenticated, signout} from '../auth/auth-operations';
// import {clone} from '../../utils/clone';
import {csrf} from '../auth/csrf';
// import {keys as headerKeys, values as headerValues} from './headers';
// import {log} from './log';
import {keys as headerKeys, values as headerValues, JWT, Organization, Profile, ProfileAttributes, Ready, SolutionLevel, SolutionRole} from '../auth/session-keys';
// import {override} from './regex';
import {request} from '../request';
// import {createStream} from './stream';
import {token} from '../urls.js';

export const profileUrl = '/api/profile';
export const override = /^(recommended|votes)$/;

const sC = typeof structuredClone === 'function';

export function clone (arg = {}, transferables = []) {
  let result;

  if (sC) {
    result = structuredClone(arg, transferables);
  } else {
    result = JSON.parse(JSON.stringify(arg));

    for (const key of transferables) {
      result[key] = arg[key];
    }
  }

  return result;
}

export function merge (a = {}, b = {}) {
  let result = clone(a);

  for (const key of Reflect.ownKeys(b)) {
    result[key] = Object.assign(clone(result[key] || {}), b[key]);
  }
}

export function log (arg = '', {id = 'app', ts = true, type = 'log'} = {}) {
  const timestamp = type !== 'error' && ts ? new Date().getTime() : 0;

  if (timestamp > 0) {
    console[type](arg instanceof Object ? arg : `[${id}:${timestamp}] ${arg}`);
  } else {
    console[type](arg);
  }
}

let profileData = null,
  meta = {};

export let adobeIMS;

async function profileAttributes () {
  if (ProfileAttributes in sessionStorage === false) {
    const res = await request(profileUrl, {
      credentials: 'include',
      headers: {
        [headerKeys.auth]: sessionStorage.getItem(JWT),
        [headerKeys.accept]: headerValues.json
      },
      method: 'OPTIONS'
    });

    if (res.ok) {
      const data = await res.json();

      sessionStorage.setItem(ProfileAttributes, JSON.stringify(data.data));
    }
  }

  return JSON.parse(sessionStorage.getItem(ProfileAttributes) || '{}');
}

async function profileMerge (arg) {
  const tmp = await adobeIMS.getProfile();

  return Object.assign({}, tmp, arg, {avatarUrl: adobeIMS.avatarUrl(tmp.userId)});
}

export async function profile (reuse = false, cstream = true, explicit = false) {
  let result = null;

  if (reuse === false) {
    if (authenticated) {
      const data = await adobeIMS.getProfile();

      if (data !== null) {
        if (sessionStorage.getItem(JWT) === null) {
          await token(data);
        }

        if (profileData === null || explicit) {
          log('Retrieving Experience League profile');
          const res = await request(profileUrl, {
            credentials: 'include',
            headers: {
              [headerKeys.auth]: sessionStorage.getItem(JWT),
              [headerKeys.accept]: headerValues.json
            }
          });

          if (res.ok && res.status === 200) {
            const arg = await res.json();

            result = await profileMerge(arg.data);
            profileData = clone(result);

            // if (cstream) {
            //   createStream();
            // }
          } else {
            signout();
          }
        } else {
          result = clone(profileData);
        }
      } else {
        signout();
      }
    } else {
      signout();
    }
  } else {
    result = clone(profileData);
  }

  if (result !== null) {
    if (Reflect.ownKeys(meta).length === 0) {
      meta = await profileAttributes();
    }

    const keys = ['industryInterests', 'role'],
      complete = Math.ceil(keys.filter(k => result[k].length > 0).length / keys.length * 100);

    sessionStorage.setItem(Ready, complete === 100);
    sessionStorage.setItem(Organization, result.org || '');
    sessionStorage.setItem(Profile, JSON.stringify(result));
    localStorage.setItem(SolutionLevel, result.level.join(','));
    localStorage.setItem(SolutionRole, result.role.join(','));
  }

  return result;
}

export async function updateProfile (key, val, replace = false) {
  const data = await profile(false, false, true);

  if (Reflect.ownKeys(meta).length === 0) {
    meta = await profileAttributes();
  }

  Reflect.ownKeys(data).forEach(i => {
    if (meta.write.includes(i) === false) {
      delete data[i];
    }
  });

  if (override.test(key) || replace === true) {
    data[key] = val;
  } else if (meta.types[key] === 'array') {
    if (data[key] === void 0 || replace === true) {
      data[key] = [val];
    } else if (Array.isArray(data[key]) === false) {
      data[key] = [data[key], val];
    } else {
      (Array.isArray(val) ? val : [val]).forEach(arg => {
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
      authorization: sessionStorage.getItem(JWT),
      accept: 'application/json',
      'content-type': 'application/json-patch+json',
      'x-csrf-token': await csrf()
    },
    body: JSON.stringify([{op: 'replace', path: `/${key}`, value: data[key]}])
  });

  if (res.ok && res.status < 400) {
    const arg = await res.json();

    profileData = await profileMerge(arg.data);
    await profile(true);
    sessionStorage.setItem(Profile, JSON.stringify(profileData));
  }

  return profileData;
}

export async function bookmark (el, arg) {
  if (authenticated) {
    await updateProfile('bookmarks', arg);
  }

  return arg;
}