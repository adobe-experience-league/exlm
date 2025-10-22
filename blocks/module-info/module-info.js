import { getCurrentStepInfo } from '../../scripts/courses/course-utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { MODULE_STATUS, startModule, getModuleStatus } from '../../scripts/courses/course-profile.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';

export default async function decorate(block) {
  // Check if user is signed in, if not trigger sign in
  const isSignedIn = await isSignedInUser();
  if (!isSignedIn) {
    // Trigger sign in
    window.adobeIMS?.signIn();
    return;
  }

  const moduleStatus = await getModuleStatus();

  // Store current step URL in localStorage when user is on a step page
  // This will be used to redirect back to this page after login
  localStorage.setItem('lastStepUrl', window.location.pathname);

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const stepInfo = await getCurrentStepInfo(placeholders);

  if (!stepInfo) {
    // eslint-disable-next-line no-console
    console.warn('No step info available for module-info');
    return;
  }

  // If module is disabled, redirect to course page
  // Otherwise, update module status in profile
  if (!moduleStatus || moduleStatus === MODULE_STATUS.DISABLED) {
    // Uncomment this to redirect to course page once profile API updates are done (https://jira.corp.adobe.com/browse/UGP-13737)
    document.querySelector('main').style.visibility = 'hidden';
    setTimeout(() => {
      window.location.href = stepInfo.courseUrl;
    }, 3000);
  } else {
    startModule();
  }

  // Clear existing content
  block.textContent = '';
  block.classList.add('module-info');

  // Create main container
  const container = document.createElement('div');
  container.className = 'module-info-parent';

  // Back to course link
  const backLink = document.createElement('a');
  backLink.className = 'back-to-course';
  backLink.href = stepInfo.courseUrl;
  backLink.innerHTML = `<span class="icon icon-collection-icon" aria-label="${
    placeholders['course-back-to-course-icon'] || 'Back to course icon'
  }"></span>
    <span class="icon icon-back-arrow" aria-label="Back arrow"></span>
    <span class="back-to-course-label">${placeholders['course-back-to-course-button'] || 'BACK TO THE COURSE'}</span>
  `;

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'module-content';

  // Title
  const title = document.createElement('span');
  title.className = 'module-title';
  title.textContent = stepInfo.moduleHeader;

  // Progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'progress-section';

  // Step selector using dropdown utility
  const stepSelectorContainer = document.createElement('div');
  stepSelectorContainer.className = 'step-selector-container';

  const currentStep = stepInfo.moduleSteps.find((step) => step.url === window.location.pathname);
  const currentStepName = currentStep ? currentStep.name : placeholders['course-select-step'] || 'Select Step';

  // Create form element for dropdown
  const dropdownForm = document.createElement('form');
  dropdownForm.className = 'step-dropdown-form';

  // Prepare options for dropdown
  const dropdownOptions = stepInfo.moduleSteps.map((step) => ({
    title: step.name,
    value: step.url,
  }));

  // Create dropdown using utility
  const dropdown = new Dropdown(dropdownForm, currentStepName, dropdownOptions, DROPDOWN_VARIANTS.ANCHOR);

  // Handle dropdown selection
  dropdown.handleOnChange((selectedUrl) => {
    if (selectedUrl) {
      window.location.href = selectedUrl;
    }
  });

  stepSelectorContainer.appendChild(dropdownForm);

  progressSection.appendChild(stepSelectorContainer);

  contentArea.appendChild(title);
  contentArea.appendChild(progressSection);

  container.appendChild(backLink);
  container.appendChild(contentArea);
  block.appendChild(container);

  // Decorate icons after all content is added
  decorateIcons(backLink);
}
