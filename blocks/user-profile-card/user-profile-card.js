import { decorateIcons } from '../../scripts/lib-franklin.js';
import { adobeAccountDOM, communityAccountDOM, additionalProfileInfoDOM } from '../../scripts/profile/profile.js';

export default async function decorate(block) {
  const userProfileDOM = document.createRange().createContextualFragment(`
  ${adobeAccountDOM}
    ${communityAccountDOM}
    ${additionalProfileInfoDOM}
  `);

  block.textContent = '';
  block.append(userProfileDOM);
  await decorateIcons(block);
}
