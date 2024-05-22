import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  /* eslint-disable-next-line no-console */
  console.error('Error fetching placeholders:', err);
}
const adobeAccountLink = 'https://account.adobe.com/';
const ADOBE_ACCOUNT = placeholders?.myAdobeAccount || 'My Adobe Account';
const MAKE_CHANGES_TEXT = placeholders?.makeChanges || 'Make changes';

export default async function decorate(block) {
  let displayName = 'Username';
  let company = 'Company';
  let email = 'Email';
  let profilePicture = null;

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    displayName = profileData?.displayName || displayName;
    email = profileData?.email || email;
    company = profileData?.company || company;
    const profileImgData = await defaultProfileClient.getPPSProfile();
    profilePicture = profileImgData?.images?.['50'] || profilePicture;
  }

  const accountCardDOM = document.createRange().createContextualFragment(`
    <div class="card-header">
      <div class="adobe-account">${ADOBE_ACCOUNT}</div>
      <div class="make-changes">
        <span class="icon icon-new-tab"></span>
        <a href="${adobeAccountLink}" target="_blank">${MAKE_CHANGES_TEXT}</a>
      </div>
    </div>
    <div class="card-body">
      <div class="avatar">
        ${
          profilePicture
            ? `<img class="profile-picture" src="${profilePicture}" alt="profile picture" />`
            : '<span class="icon icon-profile"></span>'
        }
      </div>
      <div class="user-info">
        <div class="display-name">${displayName}</div>
        <div class="company">${company}</div>
        <div class="email">${email}</div>
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(accountCardDOM);
  await decorateIcons(block);
}
