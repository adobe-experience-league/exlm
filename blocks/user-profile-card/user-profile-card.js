import { decorateIcons } from '../../scripts/lib-franklin.js';
import { adobeAccountDOM, communityAccountDOM, additionalProfileInfoDOM } from '../../scripts/profile/profile.js';
import { htmlToElement } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const userProfileDOM = document.createRange().createContextualFragment(`
    <div class="user-profile-card-box">
      ${adobeAccountDOM}
      ${communityAccountDOM}
      ${additionalProfileInfoDOM}
    </div>
  `);

  block.textContent = '';
  block.append(userProfileDOM);

  const cardDecor = htmlToElement(`<div class="user-profile-card-decor"></div>`);
  block.append(cardDecor);
  await decorateIcons(block);
}
