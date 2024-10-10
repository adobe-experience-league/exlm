import { decorateIcons } from '../../scripts/lib-franklin.js';
import { generateProfileDOM } from '../../scripts/profile/profile.js';

export default async function decorate(block) {
  const profileFlags = ['exlProfile'];
  const { adobeAccountDOM } = await generateProfileDOM(profileFlags);

  const accountCardDOM = document.createRange().createContextualFragment(adobeAccountDOM);
  block.textContent = '';
  block.append(accountCardDOM);
  decorateIcons(block);
}
