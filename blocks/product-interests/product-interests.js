import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { productExperienceEventEmitter } from '../../scripts/events.js';

const { interestsUrl } = getConfig();

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export async function fetchProfileData(url, cType) {
  try {
    let data;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response.ok && cType === 'json') {
      data = await response.json();
    } else if (response.ok && cType === 'text') {
      data = await response.text();
    }
    return data;
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}

// eslint-disable-next-line prefer-const
let [interests, profileData] = await Promise.all([
  fetchProfileData(interestsUrl, 'json'),
  defaultProfileClient.getMergedProfile(),
]);

async function updateInterests(block) {
  const newInterests = [];
  block.querySelectorAll('li input:checked').forEach((input) => {
    newInterests.push(input.title);
  });
  await defaultProfileClient.updateProfile('interests', newInterests, true);
}

function decorateInterests(block) {
  const [title, description] = block.children;
  if (!title.querySelector('h1,h2,h3,h4,h5,h6')) {
    title.innerHTML = `<h3>${title.textContent}</h3>`;
  }
  title?.classList.add('product-interest-header');
  description?.classList.add('product-interest-description');

  const formContainer = document.createElement('form');
  formContainer.id = 'product-interests-form';

  const formErrorContainer = document.createElement('div');
  formErrorContainer.classList.add('product-interests-form-error');

  const columnsContainer = document.createElement('ul');
  columnsContainer.classList.add('interests-container');

  formContainer.appendChild(formErrorContainer);
  formContainer.appendChild(columnsContainer);

  const userInterests = profileData?.interests ? profileData.interests : [];
  // Sort the interests data by Name
  // eslint-disable-next-line no-nested-ternary
  interests.data.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
  const clonedInterests = structuredClone(interests.data);

  productExperienceEventEmitter.set('interests_data', clonedInterests);

  clonedInterests.forEach((interest) => {
    const column = document.createElement('li');
    column.innerHTML = `<label class="checkbox">
        <input title='${interest.Name}' type='checkbox' value='${interest.Name}'>
        <span class="subtext">${interest.Name}</span>
    </label>`;
    if (interest.Nested) {
      let subColumnsContainer = columnsContainer.querySelector('li:last-child > ul');
      const parentName = columnsContainer.querySelector('li.interest:last-child  > label').textContent.trim();
      const childLabel = column.querySelector('span.subtext');
      if (childLabel.textContent.trim().includes(parentName)) {
        childLabel.textContent = childLabel.textContent.trim().replace(parentName, '');
      }
      if (!subColumnsContainer) {
        subColumnsContainer = document.createElement('ul');
        columnsContainer.querySelector('li.interest:last-child').appendChild(subColumnsContainer);
        subColumnsContainer.classList.add('sub-interests-container');
        subColumnsContainer.appendChild(column);
        column.classList.add('sub-interest');
      } else {
        subColumnsContainer.appendChild(column);
        column.classList.add('sub-interest');
      }
    } else {
      columnsContainer.appendChild(column);
      column.classList.add('interest');
    }

    const inputEl = column.querySelector('input');
    if (inputEl) {
      inputEl.id = `interest__${interest.id}`;
    }
    if (userInterests.includes(interest.Name)) {
      inputEl.checked = true;
      inputEl.classList.add('checked');
      interest.selected = true;
      productExperienceEventEmitter.set(interest.id, true);
    } else {
      interest.selected = false;
    }
  });

  block.appendChild(formContainer);

  productExperienceEventEmitter.on('dataChange', ({ key, value }) => {
    if (formErrorContainer) {
      formErrorContainer.textContent = '';
    }

    const inputEl = block.querySelector(`#interest__${key}`);
    if (inputEl) {
      inputEl.checked = value;
    }
    updateInterests(block)
      .then(() => {
        defaultProfileClient.getMergedProfile().then((profile) => {
          if (JSON.stringify(profileData.interests) !== JSON.stringify(profile.interests)) {
            profileData = profile;
            sendNotice(placeholders?.profileUpdated || 'Profile updated successfully');
          }
        });
      })
      .catch(() => {
        sendNotice(placeholders?.profileNotUpdated || 'Error updating profile');
      });
  });
}

function handleProductInterestChange(block) {
  const isInSignupDialog = block.closest('.signup-dialog');
  const formErrorContainer = block.querySelector('.product-interests-form-error');
  const checkboxList = block.querySelectorAll('.interests-container input[type="checkbox"]');
  const formErrorMessage = placeholders?.formFieldGroupError || 'Please select at least one option.';

  checkboxList.forEach((checkbox) => {
    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();

      if (formErrorContainer) {
        formErrorContainer.textContent = '';
      }

      const checkedCheckboxes = Array.from(checkboxList).filter((el) => el.checked);

      const isAnyCheckboxChecked = checkedCheckboxes.length > 0;

      if (!isInSignupDialog && !isAnyCheckboxChecked) {
        if (formErrorContainer) {
          formErrorContainer.innerHTML = `<span class='form-error'>${formErrorMessage}</span>`;
        }
        event.preventDefault();
        return false;
      }

      if (event.target.tagName === 'INPUT') {
        const [, id] = event.target.id.split('__');
        productExperienceEventEmitter.set(id, event.target.checked);
      }
      return true;
    });
  });
}

export default async function decorateProfile(block) {
  decorateInterests(block);
  handleProductInterestChange(block);
}
