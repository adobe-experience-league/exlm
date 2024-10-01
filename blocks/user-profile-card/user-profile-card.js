import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchIndustryOptions, getIndustryNameById, generateProfileDOM } from '../../scripts/profile/profile.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { productExperienceEventEmitter, globalEmitter } from '../../scripts/events.js';

function loadCommunityAccountDOM(block) {
  const profileFlags = ['communityProfile'];
  generateProfileDOM(profileFlags).then(async ({ communityAccountDOM }) => {
    const communityAccountElement = block.querySelector('.profile-row.community-account');
    if (communityAccountElement) {
      const communityProfileFragment = document.createRange().createContextualFragment(communityAccountDOM);
      communityAccountElement.replaceWith(communityProfileFragment);
      await decorateIcons(block);
    }
  });
}

const decorateUserProfileCard = async (block) => {
  const profileFlags = ['exlProfile'];
  const profileInfoPromise = generateProfileDOM(profileFlags);

  const userProfileDOM = document.createRange().createContextualFragment(`
    <div class="user-profile-card-box">
      <div class="profile-row adobe-account loading">
        <div class="adobe-account-logo profile-row-shimmer"></div>
        <div class="adobe-account-text profile-row-shimmer"></div>
      </div>
      <div class="profile-row community-account loading">
        <div class="profile-row-shimmer"></div>
      </div>
      <div class="profile-row additional-data loading profile-row-shimmer"></div>
    </div>
  `);

  block.textContent = '';
  block.append(userProfileDOM);

  const cardDecor = htmlToElement(`<div class="user-profile-card-decor"></div>`);
  block.append(cardDecor);
  loadCommunityAccountDOM(block);
  profileInfoPromise.then(async ({ adobeAccountDOM, additionalProfileInfoDOM }) => {
    const adobeAccountElement = block.querySelector('.profile-row.adobe-account');
    const additionalProfileElement = block.querySelector('.profile-row.additional-data');
    if (adobeAccountDOM && adobeAccountElement) {
      const profileFragment = document.createRange().createContextualFragment(adobeAccountDOM);
      adobeAccountElement.replaceWith(profileFragment);
    }

    if (additionalProfileInfoDOM && additionalProfileElement) {
      const profileFragment = document.createRange().createContextualFragment(additionalProfileInfoDOM);
      additionalProfileElement.replaceWith(profileFragment);
    }
    await decorateIcons(block);
  });
};

export default async function decorate(block) {
  await decorateUserProfileCard(block);

  productExperienceEventEmitter.on('dataChange', async (data) => {
    const { key, value } = data;
    const updatedInterests = productExperienceEventEmitter.get('interests_data') ?? [];
    const interests = updatedInterests.find((interest) => interest.id === key);
    if (interests) {
      interests.selected = value;
    }

    const selectedInterests = updatedInterests.filter((interest) => interest.selected).map((interest) => interest.Name);
    const newInterestsSpan = document.createElement('span');
    newInterestsSpan.innerHTML = selectedInterests.join(' | ');

    const interestsElement = block.querySelector('.user-interests span:last-child');
    interestsElement?.replaceWith(newInterestsSpan);
  });

  globalEmitter.on('roleChange', async (data) => {
    let placeholders = {};
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }

    const roleMappings = {
      Developer: placeholders?.roleCardDeveloperTitle || 'Developer',
      User: placeholders?.roleCardUserTitle || 'Business User',
      Leader: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
      Admin: placeholders?.roleCardAdministratorTitle || 'Administrator',
    };

    const selectedRoles = data;
    const newRolesSpan = document.createElement('span');
    newRolesSpan.innerHTML = selectedRoles.map((role) => roleMappings[role] || role).join(' | ');

    const rolesElement = block.querySelector('.user-role span:last-child');
    rolesElement?.replaceWith(newRolesSpan);
  });

  globalEmitter.on('industryChange', async (data) => {
    const selectedIndustry = data;
    const industryOptions = await fetchIndustryOptions();
    let industryName = '';
    if (Array.isArray(selectedIndustry)) {
      industryName = getIndustryNameById(selectedIndustry[0], industryOptions);
    }
    if (typeof selectedIndustry === 'string') {
      industryName = getIndustryNameById(selectedIndustry, industryOptions);
    }
    const newIndustrySpan = document.createElement('span');
    newIndustrySpan.innerHTML = industryName;

    const industryElement = block.querySelector('.user-industry span:last-child');
    industryElement?.replaceWith(newIndustrySpan);
  });
}
