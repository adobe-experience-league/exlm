import { decorateIcons } from '../../scripts/lib-franklin.js';
import { adobeAccountDOM } from '../../scripts/profile/profile.js';

export default async function decorate(block) {
  const accountCardDOM = document.createRange().createContextualFragment(adobeAccountDOM);
  block.textContent = '';
  block.append(accountCardDOM);
  await decorateIcons(block);
}
