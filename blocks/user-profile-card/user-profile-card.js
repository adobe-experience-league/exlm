import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { generateProfileDOM } from '../../scripts/profile/profile.js';
import { htmlToElement } from '../../scripts/scripts.js';

function lazyLoadCommunityAccountDOM(block) {
  const profileFlags = ['communityProfile'];
  generateProfileDOM(profileFlags).then(({ communityAccountDOM }) => {
    const communityAccountElement = block.querySelector('.profile-row.community-account');
    if (communityAccountElement) {
       const communityProfileFragment = document.createRange().createContextualFragment(communityAccountDOM);
      communityAccountElement.replaceWith(communityProfileFragment);
    }
  })
}

export default async function decorate(block) {
  const profileFlags = ['exlProfile'];
  const { adobeAccountDOM, additionalProfileInfoDOM } = await generateProfileDOM(profileFlags);

  const userProfileDOM = document.createRange().createContextualFragment(`
    <div class="user-profile-card-box">
      ${adobeAccountDOM}
      <div class="profile-row community-account"></div>
      ${additionalProfileInfoDOM}
    </div>
  `);

  block.textContent = '';
  block.append(userProfileDOM);
  const communityDom = block.querySelector('.profile-row.community-account');
  const shimmer = new BuildPlaceholder(1);
  shimmer.add(communityDom);

  const cardDecor = htmlToElement(`<div class="user-profile-card-decor"></div>`);
  block.append(cardDecor);
  await decorateIcons(block);
  lazyLoadCommunityAccountDOM(block);
}
