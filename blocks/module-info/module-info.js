import { getCurrentStepInfo } from '../../scripts/utils/course-utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const stepInfo = await getCurrentStepInfo();
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  if (!stepInfo) {
    // eslint-disable-next-line no-console
    console.warn('No step info available for module-info');
    return;
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
  backLink.innerHTML = `<span class="icon icon-course" aria-label="${
    placeholders['course-back-to-course-icon'] || 'Back to course icon'
  }"></span>
    <span class="back-to-course-label">${placeholders['course-back-to-course-button'] || 'BACK TO THE COURSE'}</span>
  `;

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'module-content';

  // Title
  const title = document.createElement('h1');
  title.className = 'module-title';
  title.textContent = stepInfo.moduleHeader;

  // Progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'progress-section';

  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.textContent = `${stepInfo.currentStep} of ${stepInfo.totalSteps} ${
    placeholders['course-steps-complete'] || 'Steps Complete'
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
