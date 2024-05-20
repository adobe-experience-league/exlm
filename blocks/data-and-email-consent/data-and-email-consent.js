import { loadCSS } from '../../scripts/lib-franklin.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const PROFILE_UPDATED = placeholders?.profileUpdated || 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED = placeholders?.profileNotUpdated || 'Your profile changes have not been saved!';

export default async function decorate(block) {
  const [collectDataLabel, collectDataDesc, emailLabel, emailDesc, legal] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  // Extract text content and trim it
  const collectDataLabelText = collectDataLabel.textContent.trim();
  const collectDataDescText = collectDataDesc.textContent.trim();
  const emailLabelText = emailLabel.textContent.trim();
  const emailDescText = emailDesc.textContent.trim();
  const legalText = legal.textContent.trim();

  // Build DOM
  const notificationDOM = document.createRange().createContextualFragment(`
    <div class="notification-container">
      <div class='row notification'>
        ${
          collectDataLabelText !== ''
            ? `<label class="checkbox">
            <input data-name="inProductActivity" type="checkbox">
            <span class="subtext">${collectDataLabelText}</span>
          </label>`
            : ``
        }
        ${collectDataDescText !== '' ? `<p>${collectDataDescText}</p>` : ``}
      </div>
      <div class='row notification'>
        ${
          emailLabelText !== ''
            ? `<label class="checkbox">
            <input data-name="emailOptIn" type="checkbox">
            <span class="subtext">${emailLabelText}</span>
          </label>`
            : ``
        }
        ${emailDescText !== '' ? `<p>${emailDescText}</p>` : ``}
      </div>
      <div class='row legal'>
        ${legalText !== '' ? `<p>${legalText}</p>` : ``}
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(notificationDOM);

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    const emailOptIn = profileData?.emailOptIn;
    const inProductActivity = profileData?.inProductActivity;

    // Initialize checkbox states based on profile data
    block.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      const preferenceName = checkbox.getAttribute('data-name');
      if (preferenceName === 'emailOptIn' && emailOptIn === true) {
        checkbox.checked = emailOptIn;
      }
      if (preferenceName === 'inProductActivity' && inProductActivity === true) {
        checkbox.checked = inProductActivity;
      }
      checkbox.closest('.notification').classList.toggle('highlight', checkbox.checked);
    });
  }

  // Add event listeners to checkboxes
  block.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', function checkboxChangeHandler(e) {
      e.preventDefault();
      e.stopPropagation();
      const preferenceName = this.getAttribute('data-name');
      const isChecked = this.checked;
      this.closest('.notification').classList.toggle('highlight', isChecked);

      if (isSignedIn) {
        defaultProfileClient
          .updateProfile(preferenceName, isChecked)
          .then(() => sendNotice(PROFILE_UPDATED))
          .catch(() => sendNotice(PROFILE_NOT_UPDATED));
      }
    });
  });

  // Add click event listeners to notification rows
  block.querySelectorAll('.notification').forEach((notification) => {
    notification.addEventListener('click', function notificationClickHandler(e) {
      const checkbox = this.querySelector('input[type="checkbox"]');
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}
