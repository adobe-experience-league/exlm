import { getCurrentStepInfo } from '../../scripts/utils/learning-collection-utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';

export default async function decorate(block) {
    const stepInfo = await getCurrentStepInfo();

    if (!stepInfo) {
        console.warn('No step info available for skill-track-info');
        return;
    }

    // Clear existing content
    block.textContent = '';
    block.classList.add('skill-track-info');

    // Create main container
    const container = document.createElement('div');
    container.className = 'skill-track-info-parent';

    // Back to collection button
    const backButton = document.createElement('button');
    backButton.className = 'back-to-collection';
    backButton.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#D9D9D9"/>
<g clip-path="url(#clip0_876_4473)">
<path d="M23.2224 8.22266H17.6669C17.5195 8.22266 17.3782 8.28119 17.274 8.38537C17.1699 8.48956 17.1113 8.63087 17.1113 8.77821V11.556H19.3336C19.6282 11.556 19.9109 11.6731 20.1192 11.8814C20.3276 12.0898 20.4447 12.3724 20.4447 12.6671V14.8893H23.2224C23.3698 14.8893 23.5111 14.8308 23.6153 14.7266C23.7195 14.6224 23.778 14.4811 23.778 14.3338V8.77821C23.778 8.63087 23.7195 8.48956 23.6153 8.38537C23.5111 8.28119 23.3698 8.22266 23.2224 8.22266Z" fill="#464646"/>
<path d="M14.3333 17.1094H8.77772C8.4709 17.1094 8.22217 17.3581 8.22217 17.6649V23.2205C8.22217 23.5273 8.4709 23.776 8.77772 23.776H14.3333C14.6401 23.776 14.8888 23.5273 14.8888 23.2205V17.6649C14.8888 17.3581 14.6401 17.1094 14.3333 17.1094Z" fill="#464646"/>
<path d="M18.7776 12.668H13.2221C13.0747 12.668 12.9334 12.7265 12.8292 12.8307C12.725 12.9349 12.6665 13.0762 12.6665 13.2235V16.0013H14.8887C15.1834 16.0013 15.466 16.1184 15.6744 16.3267C15.8828 16.5351 15.9998 16.8177 15.9998 17.1124V19.3346H18.7776C18.925 19.3346 19.0663 19.2761 19.1705 19.1719C19.2746 19.0677 19.3332 18.9264 19.3332 18.7791V13.2235C19.3332 13.0762 19.2746 12.9349 19.1705 12.8307C19.0663 12.7265 18.925 12.668 18.7776 12.668Z" fill="#464646"/>
</g>
<defs>
<clipPath id="clip0_876_4473">
<rect width="20" height="20" fill="white" transform="translate(6 6)"/>
</clipPath>
</defs>
</svg>

    <span>BACK TO THE COLLECTION</span>
  `;
    backButton.addEventListener('click', () => {
        window.location.href = stepInfo.collectionUrl;
    });

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
    progressText.textContent = `${stepInfo.currentStep} of ${stepInfo.totalSteps} Steps Complete`;

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

    const currentStep = stepInfo.skillTrackSteps.find(step => step.url === window.location.pathname);
    const currentStepName = currentStep ? currentStep.name : 'Select Step';

    // Create form element for dropdown
    const dropdownForm = document.createElement('form');
    dropdownForm.className = 'step-dropdown-form';

    // Prepare options for dropdown
    const dropdownOptions = stepInfo.skillTrackSteps.map(step => ({
        title: step.name,
        value: step.url
    }));

    // Create dropdown using utility
    const dropdown = new Dropdown(
        dropdownForm,
        currentStepName,
        dropdownOptions,
        DROPDOWN_VARIANTS.ANCHOR
    );

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

    container.appendChild(backButton);
    container.appendChild(contentArea);
    block.appendChild(container);
}
