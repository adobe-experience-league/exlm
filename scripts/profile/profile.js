import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';

const EXL_PROFILE = 'exlProfile';
const COMMUNITY_PROFILE = 'communityProfile';

export const fetchProfileData = async (profileFlags) => {
  const isSignedIn = await isSignedInUser();
  if (!isSignedIn) {
    return null;
  }

  let profileData = {};
  let ppsProfileData = {};
  let communityProfileDetails = {};

  if (profileFlags.includes(EXL_PROFILE)) {
    profileData = await defaultProfileClient.getMergedProfile();
    ppsProfileData = await defaultProfileClient.getPPSProfile();
  }

  if (profileFlags.includes(COMMUNITY_PROFILE)) {
    communityProfileDetails = await defaultProfileClient.fetchCommunityProfileDetails();
  }

  return {
    ...(profileFlags.includes(EXL_PROFILE) && {
      adobeDisplayName: profileData?.displayName || '',
      email: profileData?.email || '',
      industry: profileData?.industryInterests || '',
      roles: profileData?.role || [],
      interests: profileData?.interests || [],
      profilePicture: ppsProfileData?.images?.['100'] || '',
      company: ppsProfileData?.company || '',
    }),
    ...(profileFlags.includes(COMMUNITY_PROFILE) && {
      communityUserName: communityProfileDetails?.username || '',
      communityUserTitle: communityProfileDetails?.title || '',
      communityUserLocation: communityProfileDetails?.location || '',
    }),
  };
};

export const generateProfileDOM = async (profileFlags) => {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const { adobeAccountURL, communityAccountURL } = getConfig();
  const profileData = await fetchProfileData(profileFlags);

  if (!profileData) {
    return ''; // Return empty string or a message indicating the user is not signed in.
  }

  const {
    adobeDisplayName,
    email,
    industry,
    roles,
    interests,
    profilePicture,
    company,
    communityUserName,
    communityUserTitle,
    communityUserLocation,
  } = profileData;

  const adobeAccountDOM = `<div class="profile-row adobe-account">
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

  const communityAccountDOM = `<div class="profile-row community-account">
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

  const additionalProfileInfoDOM = `
    <div class="profile-row additional-data">
      <div class="profile-card-body additional-data-body">
        <div class="profile-user-info">
          ${
            roles && ((Array.isArray(roles) && roles.length > 0) || (typeof roles === 'string' && roles.trim() !== ''))
              ? `<div class="user-role"><span class="heading">${
                  placeholders?.myRole || 'My Role'
                }: </span><span>${roles.join('&nbsp;&nbsp;')}</span></div>`
              : ''
          }
          ${
            industry &&
            ((Array.isArray(industry) && industry.length > 0) ||
              (typeof industry === 'string' && industry.trim() !== ''))
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
                }: </span><span>${interests.join('&nbsp;&nbsp;')}</span></div>`
              : ''
          }
        </div>
      </div>
  </div>`;

  return {
    adobeAccountDOM,
    communityAccountDOM,
    additionalProfileInfoDOM,
  };
};
