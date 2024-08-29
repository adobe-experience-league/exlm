import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';
import { defaultProfileClient } from '../auth/profile.js';

const EXL_PROFILE = 'exlProfile';
const COMMUNITY_PROFILE = 'communityProfile';
const { industryUrl } = getConfig();

const fetchExlProfileData = async () => {
  const [profileData, ppsProfileData] = await Promise.allSettled([
    defaultProfileClient.getMergedProfile(),
    defaultProfileClient.getPPSProfile(),
  ]);

  // Throw error only if profileData is rejected
  if (profileData.status === 'rejected') {
    throw new Error(profileData.reason);
  }
  // Return profileData and ppsProfileData (or empty object if ppsProfileData is rejected)
  return { profileData: profileData.value, ppsProfileData: ppsProfileData.value || {} };
};

export async function fetchIndustryOptions() {
  try {
    const response = await fetch(industryUrl);
    const data = await response.json();
    return data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was a problem with the fetch operation:', error);
    return [];
  }
}

export const getIndustryNameById = (industryId, industryOptionsArray) => {
  let industry = {};
  if (Array.isArray(industryId)) {
    // If industryId is an array, find the first matching industry name for any ID in the array
    industry = industryOptionsArray.find((option) => industryId.includes(option.id));
  } else {
    // If industryId is a string, find the matching industry name directly
    industry = industryOptionsArray.find((option) => option.id === industryId);
  }
  return industry ? industry.Name : '';
};

const fetchCommunityProfileData = async () => defaultProfileClient.fetchCommunityProfileDetails();

const fetchProfileData = async (profileFlags) => {
  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
  const exlProfilePromise = profileFlags.includes(EXL_PROFILE) ? fetchExlProfileData() : Promise.resolve({});
  const communityProfilePromise = profileFlags.includes(COMMUNITY_PROFILE)
    ? fetchCommunityProfileData()
    : Promise.resolve({});

  const [{ profileData, ppsProfileData }, communityProfileDetails] = await Promise.all([
    exlProfilePromise,
    communityProfilePromise,
  ]);

  return {
    ...(profileFlags.includes(EXL_PROFILE) && {
      adobeDisplayName: UEAuthorMode ? 'User Name' : profileData?.displayName || '',
      email: UEAuthorMode ? 'User Email' : profileData?.email || '',
      industry: UEAuthorMode ? 'User Industry' : profileData?.industryInterests || '',
      roles: UEAuthorMode ? ['User Roles'] : profileData?.role || [],
      interests: UEAuthorMode ? ['User Interests'] : profileData?.interests || [],
      profilePicture: ppsProfileData?.images?.['100'] || '',
      company: UEAuthorMode ? 'User Company' : ppsProfileData?.company || '',
    }),
    ...(profileFlags.includes(COMMUNITY_PROFILE) && {
      communityUserName: UEAuthorMode ? 'Community User Name' : communityProfileDetails?.username || '',
      communityUserTitle: UEAuthorMode ? 'Community User Title' : communityProfileDetails?.title || '',
      communityUserLocation: UEAuthorMode ? 'Community User Location' : communityProfileDetails?.location || '',
    }),
  };
};

const generateAdobeAccountDOM = (profileData, placeholders, adobeAccountURL) => {
  const { adobeDisplayName, email, profilePicture, company } = profileData;

  return `<div class="profile-row adobe-account">
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
};

const generateCommunityAccountDOM = (profileData, placeholders, communityAccountURL) => {
  const { communityUserName, communityUserTitle, communityUserLocation } = profileData;

  return `<div class="profile-row community-account">
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
};

const generateAdditionalProfileInfoDOM = async(profileData, placeholders) => {
  const { roles, industry, interests } = profileData;
  const industryOptions = await fetchIndustryOptions();
  let industryName = '';
  if (Array.isArray(industry)) {
    industryName = getIndustryNameById(industry[0], industryOptions);
  }
  if (typeof industry === 'string') {
    industryName = getIndustryNameById(industry, industryOptions);
  }

  const roleMappings = {
    Developer: placeholders?.roleCardDeveloperTitle || 'Developer',
    User: placeholders?.roleCardUserTitle || 'Business User',
    Leader: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
    Admin: placeholders?.roleCardAdministratorTitle || 'Administrator',
  };

  return `<div class="profile-row additional-data">
    <div class="profile-card-body additional-data-body">
      <div class="profile-user-info">
        ${
          roles && ((Array.isArray(roles) && roles.length > 0) || (typeof roles === 'string' && roles.trim() !== ''))
            ? `<div class="user-role"><span class="heading">${placeholders?.myRole || 'My Role'}: </span><span>${roles
                .map((role) => roleMappings[role] || role)
                .join('&nbsp;&nbsp;')}</span></div>`
            : ''
        }
        ${
          industryName.trim() !== ''
            ? `<div class="user-industry"><span class="heading">${
                placeholders?.myIndustry || 'My Industry'
              }: </span><span>${industryName}</span></div>`
            : ''
        }
        ${
          interests &&
          ((Array.isArray(interests) && interests.length > 0) ||
            (typeof interests === 'string' && interests.trim() !== ''))
            ? `<div class="user-interests"><span class="heading">${
                placeholders?.myInterests || 'My Interests'
              }: </span><span>${interests.join(' | ')}</span></div>`
            : ''
        }
      </div>
    </div>
  </div>`;
};

// eslint-disable-next-line import/prefer-default-export
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

  const hasExlProfileFlag = profileFlags.includes(EXL_PROFILE);

  const adobeAccountDOM = hasExlProfileFlag
    ? generateAdobeAccountDOM(profileData, placeholders, adobeAccountURL)
    : '';

  // Await the asynchronous call to generate the additional profile information DOM
  const additionalProfileInfoDOM = hasExlProfileFlag
    ? await generateAdditionalProfileInfoDOM(profileData, placeholders)
    : '';

  const communityAccountDOM = profileFlags.includes(COMMUNITY_PROFILE)
    ? generateCommunityAccountDOM(profileData, placeholders, communityAccountURL)
    : '';

  return {
    adobeAccountDOM,
    additionalProfileInfoDOM,
    communityAccountDOM,
  };
};

