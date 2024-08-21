import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function decorateButton(profileCtaType, profileCtaText, profileCtaLink) {
  if (!profileCtaLink) return '';
  const a = document.createElement('a');
  a.classList.add('button', profileCtaType === 'primary' ? 'primary' : 'secondary');
  a.href = profileCtaLink;
  a.textContent = profileCtaText;
  return a.outerHTML;
}

export default async function decorate(block) {
  const [
    profileEyebrowText,
    profileHeading,
    profileDescription,
    profileCtaType,
    profileCtaText,
    profileCtaLink,
    incompleteProfileText,
  ] = block.querySelectorAll(':scope div > div');

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    const ppsProfileData = await defaultProfileClient.getPPSProfile();
    const communityProfileData = await defaultProfileClient.fetchCommunityProfileDetails();

    const adobeDisplayName = profileData?.displayName || '';
    const adobeFirstName = profileData?.first_name || '';
    const industry = profileData?.industryInterests || [];
    const roles = profileData?.role || [];
    const interests = profileData?.interests || [];

    const profilePicture = ppsProfileData?.images?.['100'] || '';
    const company = ppsProfileData?.company || '';

    const communityUserName = communityProfileData?.username || '';
    const communityUserTitle = communityProfileData?.title || '';
    const communityUserLocation = communityProfileData?.location || '';

    const roleMappings = {
      Developer: placeholders?.roleCardDeveloperTitle || 'Developer',
      User: placeholders?.roleCardUserTitle || 'Business User',
      Leader: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
      Admin: placeholders?.roleCardAdministratorTitle || 'Administrator',
    };

    const hasInterests =
      interests &&
      ((Array.isArray(interests) && interests.length > 0) ||
        (typeof interests === 'string' && interests.trim() !== ''));

    const hasIndustry =
      industry &&
      ((Array.isArray(industry) && industry.length > 0) || (typeof industry === 'string' && industry.trim() !== ''));

    let industryContent = '';
    if (hasIndustry) {
      industryContent = `
          <div class="profile-user-card-industry">
            <span class="heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
            <span class="${!hasInterests ? 'incompleteProfile' : ''}">
              ${Array.isArray(industry) ? industry.join(', ') : industry}
            </span>
          </div>`;
    } else if (!hasInterests) {
      industryContent = `
          <div class="profile-user-card-industry">
            <span class="heading">${placeholders?.myIndustry || 'MY INDUSTRY'}: </span>
            <span class="${!hasInterests ? 'incompleteProfile' : ''}">
              ${placeholders?.unknown || 'Unknown'}
            </span>
          </div>`;
    }

    const profileWelcomeBlock = document.createRange().createContextualFragment(`
        <div class="profile-curated-card">
                <div class="profile-curated-card-eyebrowtext">
                ${profileEyebrowText.innerHTML.replace('{adobeIMS.first_name}', adobeFirstName)}
                </div>
                <div class="profile-curated-card-heading">
                ${profileHeading.innerHTML}
                </div>
                <div class="profile-curated-card-description">
                ${profileDescription.innerHTML}
                </div>
            </div>
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
                  hasInterests
                    ? `
                    <div class="profile-user-card-communityInfo">
                      ${
                        communityUserTitle
                          ? `<div class="profile-user-card-title">
                      <span class="heading">${placeholders?.title || 'TITLE'}: </span>${communityUserTitle}</div>`
                          : ''
                      }
                      ${
                        communityUserLocation
                          ? `<div class="profile-user-card-location"><span class="heading">${
                              placeholders?.location || 'LOCATION'
                            }: </span>${communityUserLocation}</div>`
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
                    <span class="heading">${placeholders?.myRole || 'MY ROLE'}: </span>
                    <span class="${!hasInterests ? 'incompleteProfile' : ''}">${roles
                      .map((role) => roleMappings[role] || role)
                      .join(' | ')}</span>
                    </div>
                    ${industryContent}
                    <div class="profile-user-card-interests">
                      <span class="heading">${placeholders?.myInterests || 'MY INTERESTS'}: </span>
                      <span class="${!hasInterests ? 'incompleteProfile' : ''}">
                        ${!hasInterests ? placeholders?.unknown || 'Unknown' : interests.join(' | ')}
                      </span>
                    </div>
                  </div>
                    <div class="profile-user-card-cta">${decorateButton(
                      profileCtaType.innerHTML,
                      profileCtaText.innerHTML,
                      profileCtaLink.innerHTML,
                    )}</div>
                </div>    
        </div>
        `);

    block.textContent = '';
    block.append(profileWelcomeBlock);
    decorateIcons(block);
  }
}
