import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { htmlToElement, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import getEmitter from '../../scripts/events.js';
import FormValidator from '../../scripts/form-validator.js';

const { interestsUrl } = getConfig();
const interestsEventEmitter = getEmitter('interests');
const profileEventEmitter = getEmitter('profile');
const signupDialogEventEmitter = getEmitter('signupDialog');

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
  const newInterestIds = [];
  const profileDataValue = await defaultProfileClient.getMergedProfile();
  const { solutionLevels = [] } = profileDataValue;
  block.querySelectorAll('li input:checked').forEach((input) => {
    newInterests.push(input.title);
    newInterestIds.push(input.id.replace('interest__', ''));
  });
  const newSoutionsToAdd = solutionLevels.filter((solutionId) => {
    const [id] = solutionId.split(':');
    return newInterestIds.includes(id);
  });

  const missingSolutionIds = newInterestIds.filter(
    (interestId) =>
      !newSoutionsToAdd.find((solutionId) => {
        const [id] = solutionId.split(':');
        return interestId === id;
      }),
  );
  missingSolutionIds.forEach((id) => {
    newSoutionsToAdd.push(`${id}:Beginner`);
  });
  await defaultProfileClient.updateProfile(['interests', 'solutionLevels'], [newInterests, newSoutionsToAdd], true);
}

function decorateInterests(block) {
  const [title, description] = block.children;
  if (!title.querySelector('h1,h2,h3,h4,h5,h6')) {
    title.innerHTML = `<h3>${title.textContent}</h3>`;
  }
  title?.classList.add('product-interest-header');
  description?.classList.add('product-interest-description');

  const content = htmlToElement(`
    <form class="product-interests-form">
      <div class="product-interests-form-error form-error hidden">
        ${placeholders?.formFieldGroupError || 'Please select at least one option.'}
      </div>
      <ul class="interests-container"></ul>
    </form>`);

  const columnsContainer = content.querySelector('.interests-container');
  const formErrorContainer = content.querySelector('.product-interests-form-error');
  const userInterests = profileData?.interests ? profileData.interests : [];
  // Sort the interests data by Name
  // eslint-disable-next-line no-nested-ternary
  interests.data.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
  const clonedInterests = structuredClone(interests.data);

  interestsEventEmitter.set('interests_data', clonedInterests);

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
      interestsEventEmitter.set(interest.id, true);
    } else {
      interest.selected = false;
    }
  });

  block.appendChild(content);

  interestsEventEmitter.on('dataChange', ({ key, value }) => {
    if (formErrorContainer) {
      formErrorContainer.classList.toggle('hidden', true);
    }
    const inputEl = block.querySelector(`#interest__${key}`);
    if (inputEl) {
      inputEl.checked = value;
    }
    const checkedCheckboxes = Array.from(block.querySelectorAll('.interests-container input[type="checkbox"]')).filter(
      (el) => el.checked,
    );
    // const isInSignupDialog = block.closest('.signup-dialog');
    const isAnyCheckboxChecked = checkedCheckboxes.length > 0;
    if (isAnyCheckboxChecked) {
      updateInterests(block)
        .then(() => {
          defaultProfileClient.getMergedProfile().then((profile) => {
            if (JSON.stringify(profileData.interests) !== JSON.stringify(profile.interests)) {
              profileData = profile;
              sendNotice(placeholders?.profileUpdated || 'Profile updated successfully');
              profileEventEmitter.emit('profileDataUpdated');
            }
          });
        })
        .catch(() => {
          sendNotice(
            placeholders?.profileNotUpdated ||
              'An error occurred during profile update. Please try again at a later time.',
            'error',
          );
        });
    }
  });
}

function validateForm(formSelector) {
  if (!formSelector) return true;

  const options = {
    aggregateRules: { checkBoxGroup: {} },
  };

  const validator = new FormValidator(formSelector, placeholders, options);
  return validator.validate();
}

function handleProductInterestChange(block) {
  const isInSignupDialog = block.closest('.signup-dialog') !== null;
  const formElement = block.querySelector('.product-interests-form');
  const formErrorElement = formElement.querySelector('.product-interests-form-error');
  const checkboxList = block.querySelectorAll('.interests-container input[type="checkbox"]');

  const toggleFormError = (visible) => {
    if (formErrorElement) {
      formErrorElement.classList.toggle('hidden', !visible);
    }
  };

  checkboxList.forEach((checkbox) => {
    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();

      const isValid = validateForm(formElement);
      toggleFormError(false);

      if (!isInSignupDialog && !isValid) {
        toggleFormError(true);
        event.preventDefault();
        return;
      }

      if (event.target.tagName === 'INPUT') {
        const [, id] = event.target.id.split('__');
        interestsEventEmitter.set(id, event.target.checked);
      }
    });
  });
}

export default async function decorateProfile(block) {
  const blockInnerHTML = block.innerHTML;
  decorateInterests(block);
  handleProductInterestChange(block);

  signupDialogEventEmitter.on('signupDialogClose', async () => {
    block.innerHTML = blockInnerHTML;
    decorateInterests(block);
    handleProductInterestChange(block);
  });
}
