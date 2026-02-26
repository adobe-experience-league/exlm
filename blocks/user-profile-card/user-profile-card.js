import { decorateIcons } from '../../scripts/lib-franklin.js';
import { generateProfileDOM } from '../../scripts/profile/profile.js';
import getEmitter from '../../scripts/events.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { getCountryOptions } from '../../scripts/utils/country.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { sendNotice } from '../../scripts/toast/toast.js';

const profileEventEmitter = getEmitter('profile');

const PROFILE_UPDATED = 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED = 'An error occurred during profile update. Please try again at a later time.';

function buildLocationSection(locationData) {
  const { city = '', country = '' } = locationData || {};

  const wrapper = document.createElement('div');
  wrapper.classList.add('profile-row', 'location-data');

  const header = document.createElement('div');
  header.classList.add('profile-card-header', 'location-data-header');
  header.innerHTML = '<div class="my-location">Location</div>';

  const body = document.createElement('div');
  body.classList.add('profile-card-body', 'location-data-body');

  const fieldsContainer = document.createElement('div');
  fieldsContainer.classList.add('location-fields');

  // City input
  const cityLabel = document.createElement('label');
  cityLabel.classList.add('location-label');
  cityLabel.textContent = 'City';
  cityLabel.htmlFor = 'location-city-input';

  const cityInput = document.createElement('input');
  cityInput.type = 'text';
  cityInput.id = 'location-city-input';
  cityInput.classList.add('city-input');
  cityInput.value = city;
  cityInput.placeholder = 'Enter your city';

  // Country dropdown — Dropdown constructor requires a <form> as parentFormElement
  const countryLabel = document.createElement('label');
  countryLabel.classList.add('location-label');
  countryLabel.textContent = 'Country';

  const countryForm = document.createElement('form');
  countryForm.classList.add('country-dropdown-form');

  const countryDropdown = new Dropdown(countryForm, 'Select country', getCountryOptions());

  if (country) {
    countryDropdown.updateDropdownValue(country);
  }

  // Update Location button
  const updateBtn = document.createElement('button');
  updateBtn.type = 'button';
  updateBtn.classList.add('update-location-btn');
  updateBtn.textContent = 'Update Location';

  updateBtn.addEventListener('click', () => {
    const cityVal = cityInput.value.trim();
    const countryVal = countryDropdown.dropdown.dataset.selected || '';

    defaultProfileClient
      .updateProfile(['city', 'country'], [cityVal, countryVal], true)
      .then(() => {
        sendNotice(PROFILE_UPDATED);
        profileEventEmitter.emit('profileDataUpdated');
      })
      .catch(() => {
        sendNotice(PROFILE_NOT_UPDATED, 'error');
      });
  });

  fieldsContainer.append(cityLabel, cityInput, countryLabel, countryForm, updateBtn);
  body.append(fieldsContainer);
  wrapper.append(header, body);

  return wrapper;
}

function loadCommunityAccountDOM(block) {
  const profileFlags = ['communityProfile'];
  generateProfileDOM(profileFlags).then(async ({ communityAccountDOM }) => {
    const communityAccountElement = block.querySelector('.profile-row.community-account');
    if (communityAccountElement) {
      const communityProfileFragment = document.createRange().createContextualFragment(communityAccountDOM);
      decorateIcons(communityProfileFragment);
      communityAccountElement.replaceWith(communityProfileFragment);
    }
  });
}

async function decorateUserProfileCard(block) {
  const profileFlags = ['exlProfile'];
  const profileInfoPromise = generateProfileDOM(profileFlags);

  const userProfileDOM = document.createRange().createContextualFragment(`
    <div class="user-profile-card-box">
      <div class="profile-row adobe-account loading">
        <div class="adobe-account-logo profile-row-shimmer"></div>
        <div class="adobe-account-text profile-row-shimmer"></div>
      </div>
      <div class="profile-row community-account loading">
        <div class="profile-row-shimmer"></div>
      </div>
      <div class="profile-row additional-data loading profile-row-shimmer"></div>
      <div class="profile-row location-data loading profile-row-shimmer"></div>
    </div>
  `);

  block.textContent = '';
  block.append(userProfileDOM);

  loadCommunityAccountDOM(block);
  profileInfoPromise.then(async ({ adobeAccountDOM, additionalProfileInfoDOM, locationData }) => {
    const adobeAccountElement = block.querySelector('.profile-row.adobe-account');
    const additionalProfileElement = block.querySelector('.profile-row.additional-data');
    const locationElement = block.querySelector('.profile-row.location-data');

    if (adobeAccountDOM && adobeAccountElement) {
      const profileFragment = document.createRange().createContextualFragment(adobeAccountDOM);
      decorateIcons(profileFragment);
      adobeAccountElement.replaceWith(profileFragment);
    }

    if (additionalProfileInfoDOM && additionalProfileElement) {
      const profileFragment = document.createRange().createContextualFragment(additionalProfileInfoDOM);
      decorateIcons(profileFragment);
      additionalProfileElement.replaceWith(profileFragment);
    }

    if (locationElement) {
      if (locationData) {
        locationElement.replaceWith(buildLocationSection(locationData));
      } else {
        locationElement.remove();
      }
    }
  });
}

export default async function decorate(block) {
  const blockInnerHTML = block.innerHTML;
  await decorateUserProfileCard(block);

  profileEventEmitter.on('profileDataUpdated', async () => {
    block.innerHTML = blockInnerHTML;
    await decorateUserProfileCard(block);
  });
}
