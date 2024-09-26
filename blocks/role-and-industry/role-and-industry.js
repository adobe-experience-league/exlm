import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { fetchIndustryOptions } from '../../scripts/profile/profile.js';
import FormValidator from '../../scripts/form-validator.js';

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

export default async function decorate(block) {
  const isSignedIn = await isSignedInUser();
  const [roleAndIndustryTitle, roleAndIndustryDescription] = block.querySelectorAll(':scope div > div');

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
        .then(() => sendNotice(PROFILE_UPDATED))
        .catch(() => sendNotice(PROFILE_NOT_UPDATED));
    });

    const profileData = await defaultProfileClient.getMergedProfile();
    const role = profileData?.role;
    const industryInterest = profileData?.industryInterests;

    if (
      (Array.isArray(industryInterest) && industryInterest.length > 0) ||
      (typeof industryInterest === 'string' && industryInterest.trim() !== '')
    ) {
      const selectedOption = Array.isArray(industryInterest) ? industryInterest[0] : industryInterest.trim();
      selectIndustryDropDown.updateDropdownValue(selectedOption);
    }

    role.forEach((el) => {
      const checkBox = block.querySelector(`input[name="${el}"]`);
      if (checkBox) {
        checkBox.checked = true;
        checkBox.closest('.role-cards-item').classList.toggle('role-cards-highlight', checkBox.checked);
      }
    });
  }

  const formElement = block.querySelector('.role-and-industry-form');
  const formErrorElement = formElement.querySelector('.role-and-industry-form-error');

  block.querySelectorAll('.role-cards-item').forEach((card) => {
    const checkbox = card.querySelector('input[type="checkbox"]');

    card.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      }
    });

    const toggleFormError = (visible) => {
      if (formErrorElement) {
        formErrorElement.classList.toggle('hidden', !visible);
      }
    };

    checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      const isInSignupDialog = e.target.closest('.signup-dialog');
      const isValid = validateForm(formElement);
      toggleFormError(false);

      if (!isInSignupDialog && !isValid) {
        checkbox.checked = true;
        toggleFormError(true);
      } else {
        const isChecked = checkbox.checked;
        checkbox.closest('.role-cards-item').classList.toggle('role-cards-highlight', isChecked);

        if (isSignedIn && isValid) {
          const updatedRoles = roleCardsData
            .filter((roleCard) => block.querySelector(`input[name="${roleCard.role}"]`).checked)
            .map((roleCard) => roleCard.role);

          defaultProfileClient
            .updateProfile('role', updatedRoles, true)
            .then(() => sendNotice(PROFILE_UPDATED))
            .catch(() => sendNotice(PROFILE_NOT_UPDATED));
        }
      }
    });
  });

  decorateIcons(block);
}
