import { decorateIcons } from '../../scripts/lib-franklin.js';
import { generateProfileDOM } from '../../scripts/profile/profile.js';
import { htmlToElement } from '../../scripts/scripts.js';
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
    if (interestsElement) {
      interestsElement.replaceWith(newInterestsSpan);
    }
  });

  globalEmitter.on('roleChange', (data) => {
    const selectedRoles = data;
    const newRolesSpan = document.createElement('span');
    newRolesSpan.innerHTML = selectedRoles.join(' | ');

    const rolesElement = block.querySelector('.user-role span:last-child');
    if (rolesElement) {
      rolesElement.replaceWith(newRolesSpan);
    }
  });
}
