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
  const [collectDataLabel, collectDataDesc, emailLabel, emailDesc, legal] = block.querySelectorAll(':scope div > div');

  // Extract text content and trim it
  const collectDataLabelText = collectDataLabel.textContent.trim();
  const collectDataDescText = collectDataDesc.textContent.trim();
  const emailLabelText = emailLabel.textContent.trim();
  const emailDescText = emailDesc.textContent.trim();
  const legalText = legal.textContent.trim();

  // Build DOM
  const dom = document.createRange().createContextualFragment(`
    <div class="notification-container">
      <div class='row notification'>
        ${
          collectDataLabelText !== ''
            ? `<label class="checkbox">
            <input data-autosave='true' data-name="inProductActivity" type="checkbox">
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
            <input data-autosave='true' data-name="emailOptIn" type="checkbox">
            <span class="subtext">${emailLabelText}</span>
          </label>`
            : ``
        }
        ${emailDescText !== '' ? `<p>${emailDescText}</p>` : ``}
      </div>
      <div class='row'>
        ${legalText !== '' ? `<p>${legalText}</p>` : ``}
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(dom);
  const isSignedIn = await isSignedInUser();

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
}
