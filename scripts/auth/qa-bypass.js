// DRAFT — QA IMS bypass. Cookie-only, for PoC / approval testing.
// Not for production sign-off without security review.

import { getCookie } from '../utils/cookie-utils.js';

const TOKEN_COOKIE = 'qa_ims_token';
const PROFILE_COOKIE = 'qa_ims_profile';
const EXPIRES_COOKIE = 'qa_ims_expires_in';

const DEFAULT_PROFILE = {
  authId: 'qa-authid',
  userId: 'qa-userid',
  email: 'qa@example.com',
  first_name: 'QA',
  last_name: 'Automation',
  displayName: 'QA Automation',
  account_type: 'type3',
  ownerOrg: '',
  session: '',
};

function parseProfileCookie() {
  const raw = getCookie(PROFILE_COOKIE);
  if (!raw) return { ...DEFAULT_PROFILE };
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export default function installQaImsBypass() {
  const token = getCookie(TOKEN_COOKIE);
  if (!token) return false;
  if (window.adobeIMS && !window.exlm?.qaImsBypass) return false;

  const profile = parseProfileCookie();
  const expiresIn = Number.parseInt(getCookie(EXPIRES_COOKIE), 10) || 86400;
  const tokenObject = {
    token,
    expire: { valueOf: () => Date.now() + expiresIn * 1000 },
    token_type: 'bearer',
    expires_in: expiresIn,
    sid: profile.session || '',
  };

  window.adobeIMS = {
    isSignedInUser: () => true,
    getAccessToken: () => tokenObject,
    getProfile: () => Promise.resolve(profile),
    refreshToken: () => Promise.resolve(tokenObject),
    signIn: () => {},
    signOut: () => {
      ['qa_ims_token', 'qa_ims_profile', 'qa_ims_expires_in'].forEach((c) => {
        document.cookie = `${c}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
      window.location.reload();
    },
  };

  window.exlm = window.exlm || {};
  window.exlm.qaImsBypass = true;
  window.imsLoaded = Promise.resolve();
  window.adobeid = window.adobeid || {};

  return true;
}
