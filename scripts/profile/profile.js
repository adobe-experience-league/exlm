import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  /* eslint-disable-next-line no-console */
  console.error('Error fetching placeholders:', err);
}

const { adobeAccountURL, communityAccountURL } = getConfig();

let adobeDisplayName = '';
let company = '';
let email = '';
let profilePicture = '';
let roles = '';
let industry = '';
let interests = '';

let communityUserName = '';
let communityUserTitle = '';
let communityUserLocation = '';

const isSignedIn = await isSignedInUser();
if (isSignedIn) {
  const profileData = await defaultProfileClient.getMergedProfile();
  adobeDisplayName = profileData?.displayName || '';
  email = profileData?.email || '';
  industry = profileData?.industryInterests || '';
  const profileRoles = profileData?.role || [];
  const profileInterests = profileData?.interests || [];

  if (profileRoles.length > 0) {
    roles = profileRoles.join('&nbsp;&nbsp;');
  }

  if (profileInterests.length > 0) {
    interests = profileInterests.join('&nbsp;&nbsp;');
  }

  const ppsProfileData = await defaultProfileClient.getPPSProfile();
  profilePicture = ppsProfileData?.images?.['100'] || '';
  company = ppsProfileData?.company || '';

  const communityProfileDetails = await defaultProfileClient.fetchCommunityProfileDetails();
  communityUserName = communityProfileDetails?.username || '';
  communityUserTitle = communityProfileDetails?.title || '';
  communityUserLocation = communityProfileDetails?.location || '';
}

export const adobeAccountDOM = `<div class="profile-row adobe-account">
  <div class="profile-card-header adobe-account-header">
    <div class="my-adobe-account">${placeholders?.myAdobeAccount || 'My Adobe Account'}</div>
    <div class="manage-adobe-account">
      <a href="${adobeAccountURL}" target="_blank">
      <span class="icon icon-new-tab"></span>
      ${placeholders?.manageAdobeAccount || 'Manage Adobe account'}
      </a>
    </div>
  </div>
  <div class="profile-card-body adobe-account-body">
    <div class="profile-avatar">
      ${
        profilePicture
          ? `<img width="64" height="64" class="profile-picture" src="${profilePicture}" alt="Profile Picture" />`
          : '<span class="icon icon-profile"></span>'
      }
    </div>
    <div class="profile-user-info">
      <div class="display-name adobe-display-name">${adobeDisplayName}</div>
      <div class="user-details">
        <div class="user-company">${company}</div>
        <div class="user-email">${email}</div>
      </div>
    </div>
  </div>
</div>`;

export const communityAccountDOM = `<div class="profile-row community-account">
  <div class="profile-card-header community-account-header">
    <div class="my-community-account">${placeholders?.myCommunityAccount || 'My Community Profile'}</div>
    <div class="manage-community-account">
      <a href="${communityAccountURL}" target="_blank">
      <span class="icon icon-new-tab"></span>
      ${placeholders?.updateCommunityProfile || 'Update profile'}
      </a>
    </div>
  </div>
  <div class="profile-card-body community-account-body">
    <div class="profile-user-info">
      <div class="display-name community-display-name">${communityUserName}</div>
      ${
        communityUserTitle
          ? `<div class="community-title"><span class="heading">${
              placeholders?.title || 'Title'
            }: </span><span>${communityUserTitle}</span></div>`
          : ''
      }
      ${
        communityUserLocation
          ? `<div class="community-location"><span class="heading">${
              placeholders?.location || 'Location'
            }: </span><span>${communityUserLocation}</span></div>`
          : ''
      }
    </div>
  </div>
</div>`;

export const additionalProfileInfoDOM = `
  <div class="profile-row additional-data">
    <div class="profile-card-body additional-data-body">
      <div class="profile-user-info">
        ${
          roles && ((Array.isArray(roles) && roles.length > 0) || (typeof roles === 'string' && roles.trim() !== ''))
            ? `<div class="user-role"><span class="heading">${
                placeholders?.myRole || 'My Role'
              }: </span><span>${roles}</span></div>`
            : ''
        }
        ${
          industry &&
          ((Array.isArray(industry) && industry.length > 0) || (typeof industry === 'string' && industry.trim() !== ''))
            ? `<div class="user-industry"><span class="heading">${
                placeholders?.myIndustry || 'My Industry'
              }: </span><span>${industry}</span></div>`
            : ''
        }
        ${
          interests &&
          ((Array.isArray(interests) && interests.length > 0) ||
            (typeof interests === 'string' && interests.trim() !== ''))
            ? `<div class="user-interests"><span class="heading">${
                placeholders?.myInterests || 'My Interests'
              }: </span><span>${interests}</span></div>`
            : ''
        }
      </div>
    </div>
  </div>`;
