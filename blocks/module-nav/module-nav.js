import { getCurrentStepInfo, isLastStep, getNextModuleFirstStep } from '../../scripts/utils/course-utils.js';
import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
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
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const stepInfo = await getCurrentStepInfo(placeholders);

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
  const nextLink = document.createElement('a');
  nextLink.className = 'button module-nav-button';

  // Check if recap or quiz step - use root level properties
  const isRecap = stepInfo?.isRecap || false;
  const isQuiz = stepInfo?.isQuiz || false;

  // Get environment config
  const { isProd } = getConfig();

  // Check if quiz should be skipped (already passed and not in production)
  const skipQuiz = isQuiz && !isProd && sessionStorage.getItem('course.skipQuiz') === 'true';

  if (isRecap) {
    // Take Quiz link
    nextLink.classList.add('module-nav-quiz');
    nextLink.textContent = placeholders['course-take-quiz'] || 'Take Quiz';
    nextLink.href = stepInfo.moduleQuiz || '#';
  } else if (isQuiz) {
    if (skipQuiz) {
      // Quiz already passed, show Next button
      nextLink.classList.add('module-nav-next');
      nextLink.textContent = placeholders?.nextBtnLabel || 'Next';
      nextLink.href = stepInfo.nextStep || '#';

      // Update previous button text
      previousLink.textContent = placeholders?.backToCourseOverview || 'Back to Course Overview';
    } else {
      // Submit Answers link
      nextLink.classList.add('module-nav-submit');
      nextLink.textContent = placeholders['course-submit-answers'] || 'Submit Answers';
      nextLink.href = stepInfo.nextStep || '#';
      nextLink.addEventListener('click', handleQuizNextButton, { once: true });
    }
  } else {
    // Next link
    nextLink.classList.add('module-nav-next');
    nextLink.textContent = placeholders['course-next'] || 'Next';
    nextLink.href = stepInfo.nextStep || '#';
  }

  // Check if this is the last step
  if ((!isQuiz || skipQuiz) && (await isLastStep())) {
    const nextModuleFirstStepUrl = await getNextModuleFirstStep();
    if (nextModuleFirstStepUrl) {
      nextLink.href = nextModuleFirstStepUrl;
    }
  }

  // Add links to container
  container.appendChild(previousLink);
  container.appendChild(nextLink);

  // Add to block
  block.appendChild(container);
}
