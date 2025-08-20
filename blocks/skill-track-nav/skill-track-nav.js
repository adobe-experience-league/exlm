import { getCurrentStepInfo } from '../../scripts/utils/learning-collection-utils.js';
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

  if (!stepInfo) return;

  // Clear block and add class
  block.textContent = '';
  block.classList.add('skill-track-nav');

  // Find current step
  const currentStepIndex = stepInfo.skillTrackSteps.findIndex((step) => step.url === window.location.pathname);

  // Create container
  const container = document.createElement('div');
  container.className = 'skill-track-nav-buttons';

  // Go Back link
  const goBackLink = document.createElement('a');
  goBackLink.className = 'button skill-track-nav-button skill-track-nav-back secondary';
  goBackLink.textContent = placeholders['learning-collection-go-back'] || 'Go Back';

  // Disable go back button if on first step
  if (currentStepIndex === 0) {
    goBackLink.classList.add('disabled');
    goBackLink.href = '#';
    goBackLink.style.pointerEvents = 'none';
    goBackLink.style.opacity = '0.5';
  } else {
    goBackLink.href = stepInfo.prevStep || '#';
  }

  // Second link based on step type
  const secondLink = document.createElement('a');
  secondLink.className = 'button skill-track-nav-button';

  // Check if recap or quiz step - use root level properties
  const isRecap = stepInfo?.isRecap || false;
  const isQuiz = stepInfo?.isQuiz || false;

  if (isRecap) {
    // Take Quiz link
    secondLink.classList.add('skill-track-nav-quiz');
    secondLink.textContent = placeholders['learning-collection-take-quiz'] || 'Take Quiz';
    secondLink.href = stepInfo.skillTrackQuiz || '#';
  } else if (isQuiz) {
    // Submit Answers link
    secondLink.classList.add('skill-track-nav-submit');
    secondLink.textContent = placeholders['learning-collection-submit-answers'] || 'Submit Answers';
    secondLink.href = stepInfo.nextStep || '#';
    secondLink.addEventListener('click', async (e) => {
      e.preventDefault();

      // Disable the button immediately to prevent multiple submissions
      secondLink.disabled = true;
      secondLink.classList.add('disabled');

      // Call the quiz submission handler if it exists
      if (window.submitQuizHandler) {
        const success = await window.submitQuizHandler();

        if (success && stepInfo.nextStep) {
          window.location.href = stepInfo.nextStep;
        }
      }
    });
  } else {
    // Next link
    secondLink.classList.add('skill-track-nav-next');
    secondLink.textContent = placeholders['learning-collection-next'] || 'Next';
    secondLink.href = stepInfo.nextStep || '#';
  }

  // Add links to container
  container.appendChild(goBackLink);
  container.appendChild(secondLink);

  // Add to block
  block.appendChild(container);
}
