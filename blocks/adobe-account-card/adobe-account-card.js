import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

export default async function decorate(block) {
  const { adobeAccountURL } = getConfig();

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const isSignedIn = await isSignedInUser();
  let profileData = {};
  let ppsProfileData = {};

  if (isSignedIn) {
    try {
      [profileData, ppsProfileData] = await Promise.all([
        defaultProfileClient.getMergedProfile(),
        defaultProfileClient.getPPSProfile(),
      ]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching profile data:', err);
    }
  }

  const adobeDisplayName = UEAuthorMode ? 'User Name' : profileData?.displayName || '';
  const email = UEAuthorMode ? 'User Email' : profileData?.email || '';
  const profilePicture = ppsProfileData?.images?.['100'] || '';
  const company = UEAuthorMode ? 'User Company' : ppsProfileData?.company || '';

  const accountCardDOM = document.createRange().createContextualFragment(`<div class="profile-row adobe-account">
    <div class="profile-card-header adobe-account-header">
      <div class="my-adobe-account">${placeholders?.myAdobeAccount || 'My Adobe Account'}</div>
      <div class="manage-adobe-account">
        <a href="${adobeAccountURL}" target="_blank">
        <span class="icon icon-new-tab"></span>
        ${placeholders?.manageAdobeAccount || 'Manage Adobe account'}
        </a>
      </div>
    </div>
    <div class="profile-card-body adobe-account-body">
      <div class="profile-avatar">
        ${
          profilePicture
            ? `<img width="64" height="64" class="profile-picture" src="${profilePicture}" alt="Profile Picture" />`
            : '<span class="icon icon-profile"></span>'
        }
      </div>
      <div class="profile-user-info">
        <div class="display-name adobe-display-name" data-cs-mask="true">${adobeDisplayName}</div>
        <div class="user-details">
          <div class="user-company">${company}</div>
          <div class="user-email" data-cs-mask="true">${email}</div>
        </div>
      </div>
    </div>
  </div>`);
  block.textContent = '';
  block.append(accountCardDOM);
  decorateIcons(block);
}
