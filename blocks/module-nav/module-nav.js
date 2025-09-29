import { getCurrentStepInfo, isLastStep, getNextModuleFirstStep } from '../../scripts/utils/course-utils.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { submitQuizHandler } from '../quiz/quiz.js';

async function handleQuizNextButton(e) {
  e.preventDefault();

  // Disable the button immediately to prevent multiple submissions
  e.target.classList.add('disabled');

  // Call the quiz submission handler if it exists
  const handler = submitQuizHandler();
  if (handler) {
    const success = await handler();

    if (success) {
      // Check if this is the last step in the module
      if (await isLastStep()) {
        // Get the first step of the next module
        const nextModuleFirstStepUrl = await getNextModuleFirstStep();
        if (nextModuleFirstStepUrl) {
          e.target.href = nextModuleFirstStepUrl;
        }
      }
    } else if (!success) {
      // re-enable submit button after answering all questions
      const inputs = document.querySelectorAll('.question input[type="checkbox"], .question input[type="radio"]');
      inputs.forEach((input) => {
        input.addEventListener(
          'change',
          () => {
            e.target.classList.remove('disabled');
          },
          { once: true },
        );
      });
    }
  }
}
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
  block.classList.add('module-nav');

  // Find current step
  const currentStepIndex = stepInfo.moduleSteps.findIndex((step) => step.url === window.location.pathname);

  // Create container
  const container = document.createElement('div');
  container.className = 'module-nav-buttons';

  // Previous link
  const previousLink = document.createElement('a');
  previousLink.className = 'button module-nav-button module-nav-back secondary';
  previousLink.textContent = placeholders['playlist-previous-label'] || 'Previous';

  // Disable previous button if on first step
  if (currentStepIndex === 0) {
    previousLink.classList.add('disabled');
    previousLink.href = '#';
    previousLink.style.pointerEvents = 'none';
    previousLink.style.opacity = '0.5';
  } else {
    previousLink.href = stepInfo.prevStep || '#';
  }

  // Second link based on step type
  const secondLink = document.createElement('a');
  secondLink.className = 'button module-nav-button';

  // Check if recap or quiz step - use root level properties
  const isRecap = stepInfo?.isRecap || false;
  const isQuiz = stepInfo?.isQuiz || false;

  if (isRecap) {
    // Take Quiz link
    secondLink.classList.add('module-nav-quiz');
    secondLink.textContent = placeholders['course-take-quiz'] || 'Take Quiz';
    secondLink.href = stepInfo.moduleQuiz || '#';
  } else if (isQuiz) {
    // Submit Answers link
    secondLink.classList.add('module-nav-submit');
    secondLink.textContent = placeholders['course-submit-answers'] || 'Submit Answers';
    secondLink.href = stepInfo.nextStep || '#';
    secondLink.addEventListener('click', handleQuizNextButton, { once: true });
  } else {
    // Next link
    secondLink.classList.add('module-nav-next');
    secondLink.textContent = placeholders['course-next'] || 'Next';
    secondLink.href = stepInfo.nextStep || '#';
  }

  // Check if this is the last step
  if (!isQuiz && (await isLastStep())) {
    const nextModuleFirstStepUrl = await getNextModuleFirstStep();
    if (nextModuleFirstStepUrl) {
      secondLink.href = nextModuleFirstStepUrl;
    }
  }

  // Add links to container
  container.appendChild(previousLink);
  container.appendChild(secondLink);

  // Add to block
  block.appendChild(container);
}
