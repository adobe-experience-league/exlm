import { sendNotice } from '../../scripts/toast/toast.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  /* eslint-disable-next-line no-console */
  console.error('Error fetching placeholders:', err);
}

const PROFILE_UPDATED = placeholders?.profileUpdated || 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED = placeholders?.profileNotUpdated || 'Your profile changes have not been saved!';

export default async function decorate(block) {
  const [collectDataLabel, collectDataDesc, emailLabel, emailDesc, legal] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const collectDataLabelText = collectDataLabel.textContent.trim();
  const collectDataDescText = collectDataDesc.textContent.trim();
  const emailLabelText = emailLabel.textContent.trim();
  const emailDescText = emailDesc.textContent.trim();
  const legalText = legal.textContent.trim();

  const notificationDOM = document.createRange().createContextualFragment(`
    <div class="notification-container">
      <div class='row notification'>
        ${
          collectDataLabelText !== ''
            ? `<span class="checkbox">
            <input data-name="inProductActivity" id="inProductActivity" type="checkbox">
            <label for="inProductActivity" class="subtext">${collectDataLabelText}</label>
          </span>`
            : ``
        }
        ${collectDataDescText !== '' ? `<div>${collectDataDesc.innerHTML}</div>` : ``}
      </div>
      <div class='row notification'>
        ${
          emailLabelText !== ''
            ? `<span class="checkbox">
            <input data-name="emailOptIn" id="emailOptIn" type="checkbox">
            <label for="emailOptIn" class="subtext">${emailLabelText}</label>
          </span>`
            : ``
        }
        ${emailDescText !== '' ? `<div>${emailDesc.innerHTML}</div>` : ``}
      </div>
      <div class='row legal'>
        ${legalText !== '' ? `<div>${legal.innerHTML}</div>` : ``}
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

  block.querySelectorAll('.notification').forEach((notification) => {
    const checkbox = notification.querySelector('input[type="checkbox"]');

    notification.addEventListener('click', (e) => {
      const isLabelClicked = e.target.tagName === 'LABEL' || e.target.classList.contains('subtext');
      if (e.target !== checkbox && !isLabelClicked) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      const isChecked = checkbox.checked;
      checkbox.closest('.notification').classList.toggle('highlight', isChecked);

      if (isSignedIn) {
        const preferenceName = checkbox.getAttribute('data-name');
        defaultProfileClient
          .updateProfile(preferenceName, isChecked)
          .then(() => sendNotice(PROFILE_UPDATED))
          .catch(() => sendNotice(PROFILE_NOT_UPDATED));
      }
    });
  });
}
