// eslint-disable-next-line import/no-cycle, max-classes-per-file
import { getConfig, loadIms } from '../scripts.js';
// eslint-disable-next-line import/no-cycle
import loadJWT from './jwt.js';
import csrf from './csrf.js';
import { getMetadata } from '../lib-franklin.js';
import fetchStaleWhileRevalidate from './fetch-stale-while-revalidate.js';
/* Spike UGP-12844: Profile Data for RTCDP
------------
This file contains the core logic for profile management in ExL.
Key findings for priority fields:
- Profile Creation is handled via IMS integration
- "timestamp" field corresponds to "Profile Created Date" (Priority 1)
- Profile data is retrieved via getProfile() and getMergedProfile() methods
- No explicit field for "Profile Source" exists but can be derived
*/

// NOTE: to keep this viatl utility small, please do not increase the number of imports or use dynamic imports when needed.

const { profileUrl, JWTTokenUrl, ppsOrigin, ims, khorosProfileDetailsUrl } = getConfig();

const override = /^(recommended|votes)$/;

/**
 * @returns {Promise<boolean>n}
 */
export async function isSignedInUser() {
  try {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser() || false;
  } catch (err) {
    return false;
  }
}

/**
 * @see: https://git.corp.adobe.com/IMS/imslib2.js#documentation
 * @see: https://wiki.corp.adobe.com/display/ims/IMS+API+-+logout#IMSApi-logout-signout_options
 */
export async function signOut() {
  ['JWT', 'coveoToken', 'exl-profile', 'attributes', 'profile', 'pps-profile'].forEach((key) =>
    sessionStorage.removeItem(key),
  );
  const signOutRedirectUrl = getMetadata('signout-redirect-url');

  if (signOutRedirectUrl) {
    const currentOrigin = window.location.origin;
    const redirectUrl = signOutRedirectUrl.startsWith('/')
      ? `${currentOrigin}${signOutRedirectUrl}`
      : signOutRedirectUrl;
    const signoutOptions = { redirect_uri: redirectUrl };
    window.adobeIMS?.signOut(signoutOptions);
  } else {
    window.adobeIMS?.signOut();
  }
}

class ProfileClient {
  constructor(url) {
    this.url = url;
    this.jwt = loadJWT();
    this.isSignedIn = isSignedInUser();
  }

  async getAttributes() {
    const attributes = await this.fetchProfile({ method: 'OPTIONS' });
    return structuredClone(attributes);
  }

  async getIMSAccessToken() {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;
    const token = await window.adobeIMS.getAccessToken();
    return token;
  }

  async getIMSProfile() {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;
    const profile = await window.adobeIMS.getProfile();
    return profile;
  }

  async getProfile(forceRefresh = false) {
    const profile = await this.fetchProfile({}, forceRefresh);
    return structuredClone(profile);
  }

  async getPPSProfile() {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;

    const { token } = window.adobeIMS.getAccessToken();
    const accountId = (await window.adobeIMS.getProfile()).userId;

    const ppsProfile = await fetchStaleWhileRevalidate(`${ppsOrigin}/api/profile`, {
      headers: {
        'X-Api-Key': ims.client_id,
        'X-Account-Id': accountId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!ppsProfile) throw new Error('Failed to fetch PPS profile');
    return structuredClone(ppsProfile);
  }

  /* Spike UGP-12844
------------
This method provides the complete profile data including IMS fields.
Important for RTCDP mapping:
- Returns combined profile with all priority fields
- Contains timestamp, role, and industryInterests needed for P1/P2 fields
*/
  async getMergedProfile(forceRefresh = false) {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;

    const [profile, imsProfile] = await Promise.all([this.getProfile(forceRefresh), window.adobeIMS?.getProfile()]);
    const mergedProfile = { ...profile, ...imsProfile };
    return mergedProfile;
  }

  /* Spike UGP-12844
------------
This method updates profile fields and would update the "last modified" timestamp.
*/
  async updateProfile(key, val, replace = false) {
    const profile = await this.getProfile();
    const attriubutes = await this.getAttributes();

    Object.keys(profile).forEach((i) => {
      if (attriubutes.write.includes(i) === false) {
        delete profile[i];
      }
    });
    const replaceMultipleItems = Array.isArray(key) && Array.isArray(val) && replace === true;
    if (replaceMultipleItems) {
      key.forEach((keyId, i) => {
        profile[keyId] = val[i];
      });
    } else if (override.test(key) || replace === true) {
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
    const payload = [];
    if (replaceMultipleItems) {
      key.forEach((keyId) => {
        payload.push({ op: 'replace', path: `/${keyId}`, value: profile[keyId] });
      });
    } else {
      payload.push({ op: 'replace', path: `/${key}`, value: profile[key] });
    }
    await this.fetchProfile({
      method: 'PATCH',
      headers: {
        'content-type': 'application/json-patch+json',
        'x-csrf-token': await csrf(JWTTokenUrl),
      },
      body: JSON.stringify(payload),
    });

    // uppdate the profile in session storage after the changes
    await this.getMergedProfile(true);
  }

  // Fetches the community profile details of the specific logged in user
  async fetchCommunityProfileDetails() {
    const signedIn = await this.isSignedIn;
    if (!signedIn) return null;

    const accountId = (await window.adobeIMS.getProfile()).userId;

    try {
      const response = await fetch(`${khorosProfileDetailsUrl}?user=${accountId}`, {
        method: 'GET',
        headers: {
          'x-ims-token': await window.adobeIMS?.getAccessToken().token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data && data.data ? data.data : null;
      }
    } catch (err) {
      // eslint-disable-next-line
      console.log('Error fetching data!!', err);
    }
    return null;
  }

  /**
   * @param {Request} options
   * @param {string} storageKey
   * @param {boolean} refresh
   * @returns
   */
  async fetchProfile(options, forceRefresh = false) {
    const jwt = await this.jwt;
    const data = await fetchStaleWhileRevalidate(
      this.url,
      {
        ...options,
        credentials: 'include',
        headers: {
          authorization: jwt,
          accept: 'application/json',
          ...options.headers,
        },
      },
      forceRefresh,
    );

    return structuredClone(data.data);
  }

  /**
   * Iterates backward through the interactions array to grab the latest instance
   * of an event.
   *
   * @param {String} interactionName
   * @returns {Object|undefined} Interaction object or undefined if not found
   */
  async getLatestInteraction(interactionName) {
    const profile = await this.getMergedProfile(false);
    if (profile.interactions && profile.interactions.length) {
      return profile.interactions.findLast((interaction) => interaction.event === interactionName);
    }
    return undefined;
  }

  /**
   * Iterates backward through the interactions array to return all instances
   * of an event matching the provided conditions sorted from most recent to oldest.
   *
   * @param {String} event
   * @param {Object} otherConditions - Object of key value pairs to match against interaction
   * @returns Array of interaction objects
   */
  async getAllInteractionsOfType(event, otherConditions) {
    const profile = await this.getMergedProfile(false);
    const conditions = Object.apply({}, { event }, otherConditions || {});
    const foundInteractions = [];

    profile.interactions.forEach((interaction) => {
      const keys = Object.keys(conditions);
      if (!keys.some((key) => interaction[key] !== conditions[key])) {
        foundInteractions.push(interaction);
      }
    });

    return foundInteractions;
  }

  /**
   * Not all legacy events were pushed onto the interaction array and therefore
   * not sorted by date. Only use this for interactions related to Courses
   * or other legacy interactions. You generally should just use getInteraction.
   * @param {String} event
   * @returns Interaction object or undefined if not found
   */
  async getLatestLegacyInteraction(event, otherConditions) {
    const profile = await this.getMergedProfile(false);
    const conditions = Object.apply({}, { event }, otherConditions || {});
    let latest;

    profile.interactions.forEach((interaction) => {
      const keys = Object.keys(conditions);
      const notAMatch = keys.some((key) => interaction[key] !== conditions[key]);

      latest = notAMatch && latest?.timestamp && latest.timestamp < interaction.timestamp ? interaction : latest;
    });

    return latest;
  }

  /**
   * Adds an interactions to the interaction array. Interactions should only ever
   * be added and never removed as they are generally used to track repeatable
   * user interactions of interest through time.
   *
   * @param {String} event - Name of interaction event
   * @param {Object} otherValues - Additional key value pairs to store
   */
  async addInteraction(event, otherValues) {
    const profile = await this.getMergedProfile(false);
    const interaction = Object.apply(
      {},
      {
        event,
        timestamp: new Date().toISOString(),
      },
      otherValues,
    );

    profile.interactions.push(interaction);
    this.updateProfile('interactions', profile.interactions, true);
  }
}

export const defaultProfileClient = new ProfileClient(profileUrl);
