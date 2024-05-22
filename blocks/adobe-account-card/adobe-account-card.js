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

export default async function decorate(block) {
  let displayName = '';
  let company = '';
  let email = '';
  let profilePicture = '';

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    displayName = profileData?.displayName || '';
    email = profileData?.email || '';
    const ppsProfileData = await defaultProfileClient.getPPSProfile();
    profilePicture = ppsProfileData?.images?.['100'] || '';
    company = ppsProfileData?.company || '';
  }

  const accountCardDOM = document.createRange().createContextualFragment(`
    <div class="card-header">
      <div class="adobe-account">${placeholders?.myAdobeAccount}</div>
      <div class="update-profile">
        <span class="icon icon-new-tab"></span>
        <a href="${adobeAccountLink}" target="_blank">${placeholders?.makeChanges}</a>
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
