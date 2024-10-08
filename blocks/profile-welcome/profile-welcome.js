import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchIndustryOptions, getIndustryNameById } from '../../scripts/profile/profile.js';
import getEmitter from '../../scripts/events.js';

const profileEventEmitter = getEmitter('profile');
const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function decorateButton(button) {
  const a = button.querySelector('a');
  if (a) {
    a.classList.add('button');
    if (a.parentElement.tagName === 'EM') a.classList.add('secondary');
    if (a.parentElement.tagName === 'STRONG') a.classList.add('primary');
    return a.outerHTML;
  }
  return '';
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
  const isSignedIn = await isSignedInUser();

  let profileData = {};
  let ppsProfileData = {};

  if (isSignedIn) {
    [profileData, ppsProfileData] = await Promise.all([
      defaultProfileClient.getMergedProfile(),
      defaultProfileClient.getPPSProfile(),
    ]);
  }

  const {
    displayName: adobeDisplayName = UEAuthorMode ? 'User Name' : '',
    first_name: adobeFirstName = UEAuthorMode ? 'First Name' : '',
    industryInterests: industry = UEAuthorMode ? ['User Industry'] : [],
    role: roles = UEAuthorMode ? ['User Roles'] : [],
    interests = UEAuthorMode ? ['User Interests'] : [],
  } = profileData || {};

  const { images: { 100: profilePicture } = '', company = UEAuthorMode ? 'User Company' : '' } = ppsProfileData || {};

  const roleMappings = {
    Developer: placeholders?.roleCardDeveloperTitle || 'Developer',
    User: placeholders?.roleCardUserTitle || 'Business User',
    Leader: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
    Admin: placeholders?.roleCardAdministratorTitle || 'Administrator',
  };

  const hasInterests =
    interests &&
    ((Array.isArray(interests) && interests.length > 0) || (typeof interests === 'string' && interests.trim() !== ''));

  const hasIndustry =
    industry &&
    ((Array.isArray(industry) && industry.length > 0) || (typeof industry === 'string' && industry.trim() !== ''));

  let industryName = '';

  if (hasIndustry) {
    const industryOptions = await fetchIndustryOptions();
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
          <div class="profile-user-card-industry">
            <span class="industry-heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
            <span class="${!hasInterests ? 'incomplete-profile' : ''}">
              ${industryName}
            </span>
          </div>`;
  } else if (!hasInterests || UEAuthorMode) {
    industryContent = `
          <div class="profile-user-card-industry">
            <span class="industry-heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
            <span class="${!hasInterests ? 'incomplete-profile' : ''}">
              ${placeholders?.unknown || 'Unknown'}
            </span>
          </div>`;
  }

  const profileWelcomeBlock = document.createRange().createContextualFragment(`
    <div class="profile-curated-card">
      <div class="profile-curated-eyebrowtext">
      ${eyebrowText ? replaceProfileText(eyebrowText, adobeFirstName) : ``}
      </div>
      <div class="profile-curated-card-heading">
      ${headingText ? replaceProfileText(headingText, adobeFirstName) : ``}
      </div>
      <div class="profile-curated-card-description">
      ${descriptionText ? replaceProfileText(descriptionText, adobeFirstName) : ``}
      </div>
    </div>
  `);
  block.textContent = '';
  block.append(profileWelcomeBlock);

  // Conditionally display the profile card based on showProfileCard toggle
  if (showProfileCard.textContent.trim() === 'true') {
    let communityProfileData = {};
    if (isSignedIn) {
      communityProfileData = await defaultProfileClient.fetchCommunityProfileDetails();
    }
    const {
      username: communityUserName = UEAuthorMode ? 'Community User Name' : '',
      title: communityUserTitle = UEAuthorMode ? 'Community User Title' : '',
      location: communityUserLocation = UEAuthorMode ? 'Community User Location' : '',
    } = communityProfileData || {};

    const profileUserCard = document.createRange().createContextualFragment(`
          <div class="profile-user-card">
                <div class="profile-user-card-left">
                  <div class="profile-user-card-avatar-company-info">
                        <div class="profile-user-card-avatar">
                        ${
                          profilePicture
                            ? `<img width="75" height="75" class="profile-picture" src="${profilePicture}" alt="Profile Picture" />`
                            : '<span class="icon icon-profile"></span>'
                        }
                        </div>
                        <div class="profile-user-card-info">
                            <div class="profile-user-card-name">${adobeDisplayName}</div>
                            ${communityUserName ? `<div class="profile-user-card-tag">@${communityUserName}</div>` : ''}
                            <div class="profile-user-card-org">${company}</div>
                        </div> 
                  </div>
                ${
                  hasInterests && !UEAuthorMode
                    ? `
                    <div class="profile-user-card-community-info">
                      ${
                        communityUserTitle
                          ? `<div class="profile-user-card-title">
                      <span class="title-heading">${
                        placeholders?.title || 'TITLE'
                      }: </span><span class="content">${communityUserTitle}</span></div>`
                          : ''
                      }
                      ${
                        communityUserLocation
                          ? `<div class="profile-user-card-location"><span class="location-heading">${
                              placeholders?.location || 'LOCATION'
                            }: </span><span class="content">${communityUserLocation}</span></div>`
                          : ''
                      }
                      </div>
                      `
                    : `
                        <div class="profile-user-card-incomplete">
                          <span class="icon icon-exclamation"></span>
                          ${incompleteProfileText.innerHTML}
                        </div>
                    `
                }
                </div>
                <div class="profile-user-card-right">
                  <div class="profile-user-card-details">
                    <div class="profile-user-card-role">
                    <span class="role-heading">${placeholders?.myRole || 'MY ROLE'}: </span>
                    <span class="${!hasInterests ? 'incomplete-profile' : 'content'}">${roles
                      ?.map((role) => roleMappings[role] || role)
                      ?.join(' | ')}</span>
                    </div>
                    ${industryContent}
                    <div class="profile-user-card-interests">
                      <span class="interest-heading">${placeholders?.myInterests || 'MY INTERESTS'}: </span>
                      <span class="${!hasInterests ? 'incomplete-profile' : 'content'}">
                        ${!hasInterests ? placeholders?.unknown || 'Unknown' : interests.join(' | ')}
                      </span>
                    </div>
                  </div>
                    <div class="profile-user-card-cta">${decorateButton(profileCta)}</div>
                </div>    
              </div>
        `);
    block.append(profileUserCard);
  }
  decorateIcons(block);
}

export default async function decorate(block) {
  const blockInnerHTML = block.innerHTML;
  await decorateProfileWelcomeBlock(block);

  profileEventEmitter.on('profileDataUpdated', async () => {
    block.innerHTML = blockInnerHTML;
    await decorateProfileWelcomeBlock(block);
  });
}
