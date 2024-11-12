import { decorateIcons, loadCSS } from '../lib-franklin.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../dropdown/dropdown.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import getSolutionByName from '../../blocks/toc/toc-solutions.js';
import loadJWT from '../auth/jwt.js';
import getEmitter from '../events.js';
import { defaultProfileClient } from '../auth/profile.js';
import { sendNotice } from '../toast/toast.js';
import FormValidator from '../form-validator.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/profile/profile-interests.css`);
const interestsEventEmitter = getEmitter('interests');
const profileEventEmitter = getEmitter('profile');

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const PROFILE_UPDATED = placeholders?.profileUpdated || 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED =
  placeholders?.profileNotUpdated || 'An error occurred during profile update. Please try again at a later time.';

const EXP_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  EXPERIENCED: 'Experienced',
  ADVANCED: 'Advanced',
};

const dropdownOptions = [
  {
    value: EXP_LEVELS.BEGINNER,
    title: placeholders.profileExpLevelBeginner || 'Beginner',
  },
  {
    value: EXP_LEVELS.INTERMEDIATE,
    title: placeholders.profileExpLevelIntermediate || 'Intermediate',
  },
  {
    value: EXP_LEVELS.EXPERIENCED,
    title: placeholders.profileExpLevelExperienced || 'Experienced',
  },
];

function validateForm(formSelector) {
  if (!formSelector) return true;

  const options = {
    aggregateRules: {
      checkBoxGroup: {
        groupName: 'profile-interest',
      },
    },
  };

  const validator = new FormValidator(formSelector, placeholders, options);
  return validator.validate();
}

function sanitizeSolutionLevels(solutionLevels) {
  return solutionLevels.map((solLevel) => {
    const [id, level = EXP_LEVELS.BEGINNER] = solLevel.split(':');
    return `${id}:${level === EXP_LEVELS.ADVANCED ? EXP_LEVELS.EXPERIENCED : level}`;
  });
}

// eslint-disable-next-line import/prefer-default-export
export default async function buildProductCard(element, model, isInSignUpFlow) {
  const { id, selected: isSelected, Name: product } = model;
  // Create card container
  const card = document.createElement('div');
  const cardContent = document.createElement('div');
  card.className = `profile-interest-card ${isSelected ? 'profile-interest-card-selected' : ''}`;
  const { class: solutionInfoClassName } = getSolutionByName(product);

  // Header
  const header = htmlToElement(`
        <div class="profile-interest-header">
            <div class="profile-interest-logo-wrapper">
                <span class="icon profile-interest-logo"></span>
                <span class="profile-interest-logo-text">${placeholders.myAdobeProduct || 'My Adobe product'}</span>
            </div>
            <h3>${product}</h3>
        </div>
    `);

  const iconEl = header.querySelector('span');
  iconEl.classList.add(`icon-${solutionInfoClassName}`);

  // Content
  const content = htmlToElement(`
        <div class="profile-interest-content">
            <label for="experience-level">${
              placeholders.selectYourExperienceLevel || 'Select your experience level'
            }</label>
        </div>
    `);

  // Checkbox
  const changeHandler = (e) => {
    const targetElement = e.target;
    const formElement = targetElement.closest('.personalize-interest-form');
    const isInSignupDialog = targetElement.closest('.signup-dialog');
    const formErrorElement = formElement.querySelector('.personalize-interest-form-error');
    const isValid = validateForm(formElement);

    const toggleFormError = (visible) => {
      if (formErrorElement) {
        formErrorElement.classList.toggle('hidden', !visible);
      }
    };

    toggleFormError(false);

    if (!isInSignupDialog && !isValid) {
      e.preventDefault();
      e.target.checked = true;
      toggleFormError(true);
      return false;
    }

    const { checked } = targetElement;
    if (checked) {
      card.classList.add('profile-interest-card-selected');
    } else {
      card.classList.remove('profile-interest-card-selected');
    }
    interestsEventEmitter.set(id, checked);
    return true;
  };
  const checkboxContainer = htmlToElement(`
        <div class="profile-interest-checkbox">
            <input type="checkbox" data-name="${product}" name="profile-interest" id="${product}">
            <label for="${product}" class="subtext">${placeholders.selectThisProduct || 'Select this product'}</label>
        </div>`);
  const checkbox = checkboxContainer.querySelector('input');
  checkbox.checked = isSelected;
  checkbox.onchange = changeHandler;

  // Assemble card
  card.appendChild(header);
  cardContent.appendChild(content);
  cardContent.appendChild(checkboxContainer);
  card.appendChild(cardContent);

  // Add to DOM
  element.appendChild(card);
  const dropdownId = isInSignUpFlow ? `${product}-inDialog` : product;
  const cardDropdown = new Dropdown(
    content,
    dropdownOptions[0].value,
    dropdownOptions,
    DROPDOWN_VARIANTS.DEFAULT,
    dropdownId,
  );
  cardDropdown.handleOnChange(async (level) => {
    const profileData = await defaultProfileClient.getMergedProfile();
    const { solutionLevels = [] } = profileData;
    let defaultSelection = false;
    solutionLevels.forEach((solution) => {
      if (solution === `${id}:${level}`) defaultSelection = true;
    });
    if (!defaultSelection) {
      const newSolutionItems = solutionLevels.filter((solution) => !`${solution}`.includes(id));
      newSolutionItems.push(`${id}:${level}`);
      defaultProfileClient
        .updateProfile('solutionLevels', sanitizeSolutionLevels(newSolutionItems), true)
        .then(() => {
          sendNotice(PROFILE_UPDATED);
          profileEventEmitter.emit('profileDataUpdated');
        })
        .catch(() => sendNotice(PROFILE_NOT_UPDATED, 'error'));
    }
  });

  loadJWT()
    .then(async () => {
      defaultProfileClient
        .getMergedProfile()
        .then(async (data) => {
          if (data?.solutionLevels?.length) {
            const currentSolutionLevel = sanitizeSolutionLevels(data.solutionLevels).find((solutionLevelInfo) =>
              `${solutionLevelInfo}`.includes(id),
            );
            if (currentSolutionLevel) {
              const [, selectedOption] = currentSolutionLevel.split(':') || [undefined, 'Beginner'];
              if (selectedOption) {
                cardDropdown.updateDropdownValue(selectedOption);
              }
            } else {
              cardDropdown.updateDropdownValue('Beginner');
            }
          } else {
            cardDropdown.updateDropdownValue('Beginner');
          }
        })
        .catch(() => {
          cardDropdown.updateDropdownValue('Beginner');
        });
    })
    .catch(() => {
      cardDropdown.updateDropdownValue('Beginner');
    });
  decorateIcons(header, '/solutions');
}
