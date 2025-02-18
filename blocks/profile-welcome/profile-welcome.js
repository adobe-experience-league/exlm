import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchIndustryOptions, getIndustryNameById } from '../../scripts/profile/profile.js';
import getEmitter from '../../scripts/events.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

const profileEventEmitter = getEmitter('profile');
const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function replaceProfileText(field, value) {
  return field.replace('{adobeIMS.first_name}', value);
}

async function decorateProfileWelcomeBlock(block) {
  const [profileEyebrowText, profileHeading, profileDescription, profileCta, incompleteProfileText, showProfileCard] =
    block.querySelectorAll(':scope div > div');

  const eyebrowText = profileEyebrowText.innerHTML;
  const headingText = profileHeading.innerHTML;
  const descriptionText = profileDescription.innerHTML;

  // eslint-disable-next-line no-async-promise-executor
  const fetchProfileData = new Promise(async (resolve) => {
    const isSignedIn = await isSignedInUser();
    let profileDataValue = {};
    let ppsProfileDataValue = {};
    if (isSignedIn) {
      const [profileResult, ppsProfileResult] = await Promise.all([
        defaultProfileClient.getMergedProfile(),
        defaultProfileClient.getPPSProfile(),
      ]);
      ppsProfileDataValue = ppsProfileResult;
      profileDataValue = profileResult;
    }
    resolve({ profileData: profileDataValue, ppsProfileData: ppsProfileDataValue });
  });

  const getProfileInfoData = async () => {
    const { profileData, ppsProfileData } = await fetchProfileData;
    const {
      displayName: adobeDisplayName = UEAuthorMode ? 'User Name' : '',
      first_name: adobeFirstName = UEAuthorMode ? 'First Name' : '',
      industryInterests: industry = UEAuthorMode ? ['User Industry'] : [],
      role: roles = UEAuthorMode ? ['User Roles'] : [],
      interests = UEAuthorMode ? ['User Interests'] : [],
    } = profileData || {};

    const { images: { 100: profilePicture } = '', company = UEAuthorMode ? 'User Company' : '' } = ppsProfileData || {};
    return {
      adobeDisplayName,
      adobeFirstName,
      industry,
      roles,
      interests,
      profilePicture,
      company,
    };
  };

  const roleMappings = {
    Developer: placeholders?.roleCardDeveloperTitle || 'Developer',
    User: placeholders?.roleCardUserTitle || 'Business User',
    Leader: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
    Admin: placeholders?.roleCardAdministratorTitle || 'Administrator',
  };

  const checkIfIndustryExists = (industry) => {
    const hasIndustry =
      industry &&
      ((Array.isArray(industry) && industry.length > 0) || (typeof industry === 'string' && industry.trim() !== ''));
    return hasIndustry;
  };

  const checkIfInterestsExist = (interests) => {
    const hasInterests =
      (interests && Array.isArray(interests) && interests.length > 0) ||
      (typeof interests === 'string' && interests.trim() !== '');
    return hasInterests;
  };

  let industryName = '';
  const profileWelcomeBlock = document.createRange().createContextualFragment(`
    <div class="profile-curated-card">
      <div class="profile-curated-eyebrowtext">
        <p class="profile-text-shimmer loading-shimmer" style="--placeholder-width: 20%; --placeholder-height: 14px"></p>
      </div>
      <div class="profile-curated-card-heading">
          ${[90, 70]
            .map(
              (i) =>
                `<p class="profile-text-shimmer loading-shimmer" style="--placeholder-width: ${i}%; --placeholder-height: 36px"></p>`,
            )
            .join('')}
      </div>
      <div class="profile-curated-card-description">
        ${[100, 90, 95, 30]
          .map(
            (i) =>
              `<p class="profile-text-shimmer loading-shimmer" style="--placeholder-width: ${i}%; --placeholder-height: 20px"></p>`,
          )
          .join('')}
      
      </div>
    </div>
  `);
  block.textContent = '';
  block.append(profileWelcomeBlock);

  // Conditionally display the profile card based on showProfileCard toggle
  if (showProfileCard?.textContent?.trim() === 'true') {
    // eslint-disable-next-line no-async-promise-executor
    const communityProfilePromise = new Promise(async (resolve) => {
      const isSignedIn = await isSignedInUser();
      if (isSignedIn) {
        defaultProfileClient.fetchCommunityProfileDetails().then((data) => {
          resolve(data);
        });
      } else {
        resolve({});
      }
    });
    communityProfilePromise.then(async (communityProfileData) => {
      const { adobeDisplayName, company, interests } = await getProfileInfoData();
      const { username: communityUserName = UEAuthorMode ? 'Community User Name' : '' } = communityProfileData || {};
      const hasInterests = checkIfInterestsExist(interests);
      const communityDataEl =
        hasInterests && !UEAuthorMode
          ? `<div class="profile-user-card-name">${adobeDisplayName}</div>
     ${communityUserName ? `<div class="profile-user-card-tag">@${communityUserName}</div>` : ''}`
          : `<div class="profile-user-card-name">${adobeDisplayName}</div>
     ${communityUserName ? `<div class="profile-user-card-tag">@${communityUserName}</div>` : ''}
     <div class="profile-user-card-org">${company}</div>`;

      const userCardInfoEl = block.querySelector('.profile-user-card-info');
      if (userCardInfoEl) {
        userCardInfoEl.innerHTML = communityDataEl;
      }
    });

    const profileUserCard = document.createRange().createContextualFragment(`
          <div class="profile-user-card">
                <div class="profile-user-card-left">
                  <div class="profile-user-card-avatar-company-info">
                        <div class="profile-user-card-avatar">
                        <p class="loading-shimmer" style="--placeholder-width: 100%; --placeholder-height: 75px"></p>
                        </div>
                        <div class="profile-user-card-info">
                        <p class="profile-text-shimmer loading-shimmer" style="--placeholder-width: 100px; --placeholder-height: 100%"></p>
                        </div> 
                  </div>
                  <div class="profile-card-wrap-section">
                      <p class="loading-shimmer" style="--placeholder-width: 100%; --placeholder-height: 64px"></p>  
                  </div>
                </div>
                <div class="profile-user-card-right">
                  <div class="profile-user-card-details">
                    <div class="profile-user-card-role">
                    <span class="role-heading">
                      <p class="loading-shimmer" style="--placeholder-width: 25%; --placeholder-height: 12px"></p>
                    </span>
                    <span class="profile-role-contents">
                      <p class="loading-shimmer" style="--placeholder-width: 100%; --placeholder-height: 32px"></p>
                    </span>
                    </div>
                    <div class="profile-user-card-industry">
                      <p class="loading-shimmer" style="--placeholder-width: 100%; --placeholder-height: 32px"></p>
                    </div>
                    <div class="profile-user-card-interests">
                      <span class="interest-heading">
                        <p class="loading-shimmer" style="--placeholder-width: 25%; --placeholder-height: 12px"></p>
                      </span>
                      <span class="profile-interest-contents">
                        <p class="loading-shimmer" style="--placeholder-width: 100%; --placeholder-height: 32px"></p>
                      </span>
                    </div>
                  </div>
                    <div class="profile-user-card-cta">${decorateCustomButtons(profileCta)}</div>
                </div>    
              </div>
        `);
    block.append(profileUserCard);
  }

  getProfileInfoData().then(({ interests, industry, adobeFirstName, roles, profilePicture }) => {
    const hasInterests = checkIfInterestsExist(interests);
    const profileCardWrapSectionEl = block.querySelector('.profile-card-wrap-section');
    if (hasInterests && !UEAuthorMode) {
      const profileUserCardParent = block.querySelector('.profile-user-card');
      profileUserCardParent?.classList.add('profile-user-card-mini');
      block.querySelector('.profile-user-card-details')?.remove();
      profileCardWrapSectionEl?.remove();
    } else if (profileCardWrapSectionEl) {
      profileCardWrapSectionEl.innerHTML = `<span class="icon icon-exclamation"></span>
             ${incompleteProfileText.innerHTML}
            `;
      profileCardWrapSectionEl.classList.add('profile-user-card-incomplete');
      decorateIcons(profileCardWrapSectionEl);
    }
    const hasIndustry = checkIfIndustryExists(industry);
    const profileUserCardIndustryPlaceholder = block.querySelector('.profile-user-card-industry');
    if (profileUserCardIndustryPlaceholder) {
      const fetchIndustryData = new Promise((resolve) => {
        if (hasIndustry) {
          fetchIndustryOptions().then((industryData) => {
            resolve(industryData);
          });
        } else {
          resolve(null);
        }
      });
      fetchIndustryData.then((industryOptions) => {
        if (hasIndustry && industryOptions) {
          if (Array.isArray(industry)) {
            industryName = getIndustryNameById(industry[0], industryOptions);
          }
          if (typeof industryName === 'string') {
            industryName = getIndustryNameById(industry, industryOptions);
          }
        }
        const hasIndustryName = industryName.trim() !== '';

        let industryContent = '';
        if (hasIndustryName) {
          industryContent = `
              <span class="industry-heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
              <span class="${!hasInterests ? 'incomplete-profile' : ''}">
                ${industryName}
              </span>`;
        } else if (!hasInterests || UEAuthorMode) {
          industryContent = `
              <span class="industry-heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
              <span class="${!hasInterests ? 'incomplete-profile' : ''}">
                ${placeholders?.unknown || 'Unknown'}
              </span>`;
        }
        if (profileUserCardIndustryPlaceholder) {
          profileUserCardIndustryPlaceholder.innerHTML = industryContent;
        }
      });
    }

    const eyebrowTextEl = block.querySelector('.profile-curated-eyebrowtext');
    if (eyebrowTextEl) {
      eyebrowTextEl.innerHTML = eyebrowText ? replaceProfileText(eyebrowText, adobeFirstName) : ``;
    }
    const curatedHeadingEl = block.querySelector('.profile-curated-card-heading');
    if (curatedHeadingEl) {
      curatedHeadingEl.innerHTML = headingText ? replaceProfileText(headingText, adobeFirstName) : ``;
    }
    const curatedDescriptionEl = block.querySelector('.profile-curated-card-description');
    if (curatedDescriptionEl) {
      curatedDescriptionEl.innerHTML = descriptionText ? replaceProfileText(descriptionText, adobeFirstName) : ``;
    }
    const profileUserCardAvatar = block.querySelector('.profile-user-card-avatar');
    if (profileUserCardAvatar) {
      profileUserCardAvatar.innerHTML = `${
        profilePicture
          ? `<img width="75" height="75" class="profile-picture" src="${profilePicture}" alt="Profile Picture" />`
          : '<span class="icon icon-profile"></span>'
      }`;
      decorateIcons(profileUserCardAvatar);
    }
    const roleHeadingEl = block.querySelector('.role-heading');
    if (roleHeadingEl) {
      roleHeadingEl.innerHTML = `${placeholders?.myRole || 'MY ROLE'}: `;
    }
    const roleContentWrapperEl = block.querySelector('.profile-role-contents');
    if (roleContentWrapperEl) {
      roleContentWrapperEl.innerHTML = `${roles?.map((role) => roleMappings[role] || role)?.join(' | ')}`;
      roleContentWrapperEl.classList.add(!hasInterests ? 'incomplete-profile' : 'content');
    }
    const interestHeadingEl = block.querySelector('.interest-heading');
    if (interestHeadingEl) {
      interestHeadingEl.innerHTML = `${placeholders?.myInterests || 'MY INTERESTS'}: `;
    }
    const interestContentWrapperEl = block.querySelector('.profile-interest-contents');
    if (interestContentWrapperEl) {
      interestContentWrapperEl.innerHTML = `${
        !hasInterests ? placeholders?.unknown || 'Unknown' : interests.join(' | ')
      }`;
      interestContentWrapperEl.classList.add(!hasInterests ? 'incomplete-profile' : 'content');
    }
  });
}

export default async function decorate(block) {
  const blockInnerHTML = block.innerHTML;
  decorateProfileWelcomeBlock(block).then(() => {
    profileEventEmitter.on('profileDataUpdated', async () => {
      block.innerHTML = blockInnerHTML;
      await decorateProfileWelcomeBlock(block);
    });
  });
}
