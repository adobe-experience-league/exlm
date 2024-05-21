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
  const accountCardDOM = document.createRange().createContextualFragment(`
    <div class="card-header">
        <div class="adobe-account">${ADOBE_ACCOUNT}</div>
        <div class="make-changes"><span class="icon icon-new-tab"></span><a href="${adobeAccountLink}" target="_blank">${MAKE_CHANGES_TEXT}</a></div>
      </div>
      <div class="card-body">
        <div class="avatar"><span class="icon icon-profile"></span></div>
        <div class="user-info">
          <div class="display-name">Username</div>
          <div class="company">Company</div>
          <div class="email">Email</div>
        </div>
      </div>
  `);

  block.textContent = '';
  block.append(accountCardDOM);
  await decorateIcons(block);

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = JSON.parse(sessionStorage.getItem('profile')) || {};
    const displayName = profileData?.displayName || '';
    const email = profileData?.email || '';
    const company = profileData?.company || '';
    const profileImg = await defaultProfileClient.getPPSProfile().then((ppsProfile) => {
      const profilePicture = ppsProfile?.images['50'];
      if (profilePicture) {
        return `<img class="profile-picture" src="${profilePicture}" alt="profile picture" />`;
      }
      return '<span class="icon icon-profile"></span>'; // Fallback to default icon
    });
    block.querySelector('.display-name').innerHTML = displayName;
    block.querySelector('.company').innerHTML = company;
    block.querySelector('.email').innerHTML = email;
    block.querySelector('.avatar').innerHTML = profileImg;
  }
}
