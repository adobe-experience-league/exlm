import { getCurrentStepInfo } from '../../scripts/utils/learning-collection-utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const stepInfo = await getCurrentStepInfo();
  const placeholders = await fetchLanguagePlaceholders();

  if (!stepInfo) {
    // eslint-disable-next-line no-console
    console.warn('No step info available for skill-track-info');
    return;
  }

  // Clear existing content
  block.textContent = '';
  block.classList.add('skill-track-info');

  // Create main container
  const container = document.createElement('div');
  container.className = 'skill-track-info-parent';

  // Back to collection link
  const backLink = document.createElement('a');
  backLink.className = 'back-to-collection';
  backLink.href = stepInfo.collectionUrl;
  backLink.innerHTML = `<span class="icon icon-learning-collection" aria-label="${
    placeholders['learning-collection-back-to-collection-icon'] || 'Back to collection icon'
  }"></span>
    <span class="back-to-collection-label">${
      placeholders['learning-collection-back-to-collection-button'] || 'BACK TO THE COLLECTION'
    }</span>
  `;

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'skill-track-content';

  // Title
  const title = document.createElement('h1');
  title.className = 'skill-track-title';
  title.textContent = stepInfo.skillTrackHeader;

  // Progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'progress-section';

  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.textContent = `${stepInfo.currentStep} of ${stepInfo.totalSteps} ${
    placeholders['learning-collection-steps-complete'] || 'Steps Complete'
  }`;

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressFill.style.width = `${(stepInfo.currentStep / stepInfo.totalSteps) * 100}%`;

  progressBar.appendChild(progressFill);

  // Step selector using dropdown utility
  const stepSelectorContainer = document.createElement('div');
  stepSelectorContainer.className = 'step-selector-container';

  const currentStep = stepInfo.skillTrackSteps.find((step) => step.url === window.location.pathname);
  const currentStepName = currentStep
    ? currentStep.name
    : placeholders['learning-collection-select-step'] || 'Select Step';

  // Create form element for dropdown
  const dropdownForm = document.createElement('form');
  dropdownForm.className = 'step-dropdown-form';

  // Prepare options for dropdown
  const dropdownOptions = stepInfo.skillTrackSteps.map((step) => ({
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

  // Assemble the layout
  const progressSectionWrapper = document.createElement('div');
  progressSectionWrapper.className = 'progress-section-wrapper';

  progressSectionWrapper.appendChild(progressText);
  progressSectionWrapper.appendChild(progressBar);

  progressSection.appendChild(progressSectionWrapper);

  progressSection.appendChild(stepSelectorContainer);

  contentArea.appendChild(title);
  contentArea.appendChild(progressSection);

  container.appendChild(backLink);
  container.appendChild(contentArea);
  block.appendChild(container);

  // Decorate icons after all content is added
  decorateIcons(backLink);
}
