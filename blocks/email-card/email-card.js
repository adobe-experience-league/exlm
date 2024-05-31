import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const MANAGE_ADOBE_ACCOUNT = placeholders?.manageAdobeAccount || 'Manage Adobe account';
const PRIMARY_EMAIL = placeholders?.primaryEmail || 'Primary email';

export default async function decorate(block) {
  block.textContent = '';

  const { adobeAccountURL } = getConfig();
  const isSignedIn = await isSignedInUser();
  let email = '';

  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    email = profileData?.email;
  }

  const emailCardDiv = document.createRange().createContextualFragment(`
    <div class="email-card-title">
    <div>${PRIMARY_EMAIL}</div>
    <a href="${adobeAccountURL}" target="_blank">
    <span class="icon icon-new-tab"></span>
    ${MANAGE_ADOBE_ACCOUNT}
    </a>
    </div>
    <div class="email-card-user-email">${email}</div>
  `);

  block.append(emailCardDiv);
  decorateIcons(block);
}
