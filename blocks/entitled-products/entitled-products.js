import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { getConfig } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import eventHandler from '../../scripts/profile/profile-interests-event.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

const { jilAPi, ims } = getConfig();

export default async function decorate(block) {
  const [...configs] = [...block.children].map((row) => row.firstElementChild);

  const [headingElement, descElement] = configs.map((cell) => cell);
  const [headingContent, descContent] = configs.map((cell) => cell?.textContent?.trim() ?? '');
  const styledHeader =
    headingElement.firstElementChild === null ? `<h3>${headingContent}</h3>` : headingElement.innerHTML;

  const entitlementsDOM = document.createRange().createContextualFragment(`
  ${styledHeader !== '' ? `<div class="heading">${styledHeader}</div>` : ``}
    ${descElement !== '' ? `<div class="description">${descContent}</div>` : ``}
      <div class="product-card">
      <span class="checkbox">
      <input data-name="Analytics" type="checkbox">
      <label for="Analytics" class="subtext">Analytics</label>
    </span><span class="checkbox">
    <input data-name="Target" type="checkbox">
    <label for="Target" class="subtext">Target</label>
  </span>
      </div>
  `);

  block.innerHTML = '';
  block.append(entitlementsDOM);
  eventHandler();
  // await decorateIcons(block);

  // const isSignedIn = await isSignedInUser();
  // if (isSignedIn) {
  //     const profileData = await defaultProfileClient.getMergedProfile();
  //     const solutionLevels = profileData?.solutionLevels || [];
  //     defaultProfileClient
  //     .updateProfile("solutionLevels", isChecked)
  //     .then(() => sendNotice(PROFILE_UPDATED))
  //     .catch(() => sendNotice(PROFILE_NOT_UPDATED));
  // }

  // if (isSignedIn) {
  //   const preferenceName = checkbox.getAttribute('data-name');
  //   defaultProfileClient
  //     .updateProfile(preferenceName, isChecked)
  //     .then(() => sendNotice(PROFILE_UPDATED))
  //     .catch(() => sendNotice(PROFILE_NOT_UPDATED));
  // }
}
