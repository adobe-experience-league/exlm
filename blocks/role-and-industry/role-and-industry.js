import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const { industryUrl } = getConfig();
const PROFILE_UPDATED = placeholders?.profileUpdated || 'Your profile changes have been saved!';
const PROFILE_NOT_UPDATED = placeholders?.profileNotUpdated || 'Your profile changes have not been saved!';
const SELECT_ROLE = placeholders?.selectRole || 'Select this role';

async function fetchIndustryOptions() {
  try {
    const response = await fetch(industryUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return [];
  }
}

export default async function decorate(block) {
  const isSignedIn = await isSignedInUser();
  const industryOptions = await fetchIndustryOptions();
  const updatedIndustryOptions = industryOptions.data.map((industry) => ({
    ...industry,
    value: industry.Name,
    title: industry.Name,
  }));
  const [roleAndIndustryTitle, roleAndIndustryDescription] = block.querySelectorAll(':scope div > div');

  const roleCardsData = [
    {
      role: 'User',
      title: placeholders.filterRoleUserTitle || 'Business User',
      icon: 'business-user',
      description:
        placeholders.filterRoleUserDescription ||
        `Responsible for utilizing Adobe solutions to achieve daily job functions, complete tasks, and achieve business objectives.`,
      selectionDefault: placeholders.noSelectionDefault || '(No selection default)',
    },
    {
      role: 'Developer',
      title: placeholders.filterRoleDeveloperTitle || 'Developer',
      icon: 'developer',
      description:
        placeholders.filterRoleDeveloperDescription ||
        `Responsible for engineering Adobe solutions' implementation, integration, data-modeling, data engineering, and other technical skills.`,
      selectionDefault: '',
    },
    {
      role: 'Admin',
      title: placeholders.filterRoleAdminTitle || 'Administrator',
      icon: 'admin',
      description:
        placeholders.filterRoleAdminDescription ||
        `Responsible for the technical operations, configuration, permissions, management, and support needs of Adobe solutions.`,
      selectionDefault: '',
    },
    {
      role: 'Leader',
      title: placeholders.filterRoleLeaderTitle || 'Business Leader',
      icon: 'business-leader',
      description:
        placeholders.filterRoleLeaderDescription ||
        `Responsible for owning the digital strategy and accelerating value through Adobe solutions.`,
      selectionDefault: '',
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
    <div class="role-cards-holder">
    ${roleCardsData
      .map(
        (card, index) => `
            <div class="role-cards-item">
              <div class="role-cards-description">
                <div class="role-cards-title">
                  <span class="icon icon-${card.icon}"></span>
                  <h3>${card.title}</h3>
                </div>
                <p>${card.description}</p>
              </div>
              <div class="role-cards-default-selection">
                ${isSignedIn ? `<p>${card.selectionDefault}</p>` : ''}
                <span class="role-cards-checkbox">
                  <input name="${card.role}" type="checkbox" id="selectRole-${index}">
                  <label class="subText" for="selectRole-${index}">${SELECT_ROLE}</label>
                </span>
              </div>
            </div>`,
      )
      .join('')}
  </div>
`);

  block.textContent = '';
  block.append(roleAndIndustryDiv);

  const selectIndustryDropDown = new Dropdown(
    block.querySelector('.industry-selection-dropdown'),
    `${placeholders?.select || 'Select'}`,
    updatedIndustryOptions,
  );
  if (isSignedIn) {
    selectIndustryDropDown.handleOnChange((industrySelection) => {
      defaultProfileClient.updateProfile('industryInterests', industrySelection, true);
    });
  }

  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    const role = profileData?.role;
    const industryInterest = profileData?.industryInterests;

    if (industryInterest) {
      const selectedOption = industryInterest;
      selectIndustryDropDown.updateDropdownValue(selectedOption);
    }

    role.forEach((el) => {
      const checkBox = document.querySelector(`input[name="${el}"]`);
      if (checkBox) {
        checkBox.checked = true;
        checkBox.closest('.role-cards-item').classList.toggle('role-cards-highlight', checkBox.checked);
      }
    });
  }

  block.querySelectorAll('.role-cards-item').forEach((card) => {
    const updatedRoles = [];
    const checkbox = card.querySelector('input[type="checkbox"]');

    card.addEventListener('click', (e) => {
      const isLabelClicked = e.target.tagName === 'LABEL' || e.target.classList.contains('subText');
      if (e.target !== checkbox && !isLabelClicked) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      const isChecked = checkbox.checked;
      checkbox.closest('.role-cards-item').classList.toggle('role-cards-highlight', isChecked);

      if (isSignedIn) {
        const profileKey = checkbox.getAttribute('name');
        updatedRoles.push(profileKey);
        defaultProfileClient
          .updateProfile('role', updatedRoles)
          .then(() => sendNotice(PROFILE_UPDATED))
          .catch(() => sendNotice(PROFILE_NOT_UPDATED));
      }
    });
  });

  decorateIcons(block);
}
