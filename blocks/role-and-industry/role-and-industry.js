import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { fetchIndustryOptions } from '../../scripts/profile/profile.js';
import FormValidator from '../../scripts/form-validator.js';
import getEmitter from '../../scripts/events.js';

const profileEventEmitter = getEmitter('profile');
const signupDialogEventEmitter = getEmitter('signupDialog');
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const PROFILE_UPDATED = placeholders?.profileUpdated || 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED = placeholders?.profileNotUpdated || 'Your profile changes have not been saved!';
const SELECT_ROLE = placeholders?.selectRole || 'Select this role';
const FORM_ERROR = placeholders?.formFieldGroupError || 'Please select at least one option.';

function validateForm(formSelector) {
  if (!formSelector) return true;

  const options = {
    aggregateRules: { checkBoxGroup: {} },
  };

  const validator = new FormValidator(formSelector, placeholders, options);
  return validator.validate();
}

async function decorateContent(block) {
  const isSignedIn = await isSignedInUser();
  const [roleAndIndustryTitle, roleAndIndustryDescription] = block.querySelectorAll(':scope div > div');
  let selectedRoles = [];
  const roleCardsData = [
    {
      role: 'User',
      title: placeholders?.roleCardUserTitle || 'Business User',
      icon: 'business-user',
      description:
        placeholders?.roleCardUserDescription ||
        `Responsible for utilizing Adobe products to achieve daily job functions, complete tasks, and achieve business objectives.`,
      selectionDefault: placeholders?.noSelectionDefault || 'Default selection',
    },
    {
      role: 'Developer',
      title: placeholders?.roleCardDeveloperTitle || 'Developer',
      icon: 'developer',
      description:
        placeholders?.roleCardDeveloperDescription ||
        `Responsible for engineering Adobe products implementation, integration, data-modeling, data engineering, and other technical skills.`,
    },
    {
      role: 'Admin',
      title: placeholders?.roleCardAdministratorTitle || 'Administrator',
      icon: 'admin',
      description:
        placeholders?.roleCardAdministratorDescription ||
        `Responsible for the technical operations, configuration, permissions, management, and support needs of Adobe products.`,
    },
    {
      role: 'Leader',
      title: placeholders?.roleCardBusinessLeaderTitle || 'Business Leader',
      icon: 'business-leader',
      description:
        placeholders?.roleCardBusinessLeaderDescription ||
        `Responsible for owning the digital strategy and accelerating value through Adobe products.`,
    },
  ];
  const roleAndIndustryDiv = document.createRange().createContextualFragment(`
    <div class="industry-selection-holder">
      <div class="industry-selection-heading">
        <div class="industry-selection-title">${roleAndIndustryTitle.innerHTML}</div>
        <div class="industry-selection-description">${roleAndIndustryDescription.innerHTML}</div>
      </div>
      <form class="industry-selection-dropdown">
        <label for="industry">${
          placeholders?.selectIndustry || 'Choose the best match for your industry (optional)'
        }</label>
      </form>
    </div>
    <form class="role-and-industry-form">
      <div class="role-and-industry-form-error form-error hidden">${FORM_ERROR}</div>
      <div class="role-cards-holder">
      ${roleCardsData
        .map(
          (card) => `
              <div class="role-cards-item">
                <div class="role-cards-description">
                  <div class="role-cards-title">
                    <span class="icon icon-${card.icon}"></span>
                    <h3>${card.title}</h3>
                  </div>
                  <p>${card.description}</p>
                </div>
                <div class="role-cards-default-selection">
                  ${isSignedIn && card?.selectionDefault ? `<p>${card.selectionDefault}</p>` : ''}
                  <span class="role-cards-checkbox">
                    <input name="${card.role}" type="checkbox">
                    <label class="select-role-label">${SELECT_ROLE}</label>
                  </span>
                </div>
              </div>`,
        )
        .join('')}
    </div>
    </form>
`);

  block.textContent = '';
  block.append(roleAndIndustryDiv);

  if (isSignedIn) {
    const industryOptions = await fetchIndustryOptions();
    const updatedIndustryOptions = industryOptions.map((industry) => ({
      ...industry,
      value: industry.id,
      title: industry.Name,
    }));
    const selectIndustryDropDown = new Dropdown(
      block.querySelector('.industry-selection-dropdown'),
      `${placeholders?.select || 'Select'}`,
      updatedIndustryOptions,
    );
    selectIndustryDropDown.handleOnChange((selectedIndustryId) => {
      const industrySelection = [];
      industrySelection.push(selectedIndustryId);
      defaultProfileClient
        .updateProfile('industryInterests', industrySelection, true)
        .then(() => {
          sendNotice(PROFILE_UPDATED);
          profileEventEmitter.emit('profileDataUpdated');
        })
        .catch(() => sendNotice(PROFILE_NOT_UPDATED));
    });

    const profileData = await defaultProfileClient.getMergedProfile();
    selectedRoles = profileData?.role;
    const industryInterest = profileData?.industryInterests;

    if (
      (Array.isArray(industryInterest) && industryInterest.length > 0) ||
      (typeof industryInterest === 'string' && industryInterest.trim() !== '')
    ) {
      const selectedOption = Array.isArray(industryInterest) ? industryInterest[0] : industryInterest.trim();
      selectIndustryDropDown.updateDropdownValue(selectedOption);
    }

    const formElement = block.querySelector('.role-and-industry-form');
    const formErrorElement = formElement.querySelector('.role-and-industry-form-error');

    const updateRoles = (name, isChecked) => {
      if (isChecked) {
        if (!selectedRoles.includes(name)) {
          selectedRoles.push(name);
        }
      } else {
        selectedRoles = selectedRoles.filter((checkboxName) => checkboxName !== name);
      }
    };

    const toggleFormError = (visible) => {
      if (formErrorElement) {
        formErrorElement.classList.toggle('hidden', !visible);
      }
    };

    const handleProfileUpdate = () => {
      defaultProfileClient
        .updateProfile('role', selectedRoles, true)
        .then(() => {
          sendNotice(PROFILE_UPDATED);
          profileEventEmitter.emit('profileDataUpdated');
        })
        .catch(() => sendNotice(PROFILE_NOT_UPDATED));
    };

    block.querySelectorAll('.role-cards-item').forEach((card) => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      const name = checkbox.getAttribute('name');

      // Initial checkbox state and card highlight
      checkbox.checked = selectedRoles.includes(name);
      card.classList.toggle('role-cards-highlight', checkbox.checked);

      const handleCheckboxChange = (e) => {
        e.preventDefault();
        const isInSignupDialog = e.target.closest('.signup-dialog');
        const isValid = validateForm(formElement);
        const isChecked = checkbox.checked;

        card.classList.toggle('role-cards-highlight', isChecked);
        toggleFormError(false);

        if (isInSignupDialog) {
          if (isValid) {
            updateRoles(name, isChecked);
            handleProfileUpdate();
          }
        } else {
          if (!isValid) {
            checkbox.checked = true;
            card.classList.toggle('role-cards-highlight', true);
            toggleFormError(true);
            return;
          }
          updateRoles(name, isChecked);
          handleProfileUpdate();
        }
      };

      card.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          const changeEvent = new Event('change');
          checkbox.dispatchEvent(changeEvent);
        }
      });

      checkbox.addEventListener('change', handleCheckboxChange);
    });

    decorateIcons(block);
  }
}

export default async function decorate(block) {
  const blockInnerHTML = block.innerHTML;
  decorateContent(block);

  signupDialogEventEmitter.on('signupDialogClose', async () => {
    block.innerHTML = blockInnerHTML;
    decorateContent(block);
  });
}
