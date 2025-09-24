import { getCurrentStepInfo, getCurrentCourseMeta } from '../../scripts/utils/course-utils.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { submitQuizHandler } from '../quiz/quiz.js';

export default async function decorate(block) {
  const stepInfo = await getCurrentStepInfo();
  const courseInfo = await getCurrentCourseMeta();

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
    secondLink.addEventListener('click', async (e) => {
      e.preventDefault();

      // Disable the button immediately to prevent multiple submissions
      secondLink.classList.add('disabled');

      // Call the quiz submission handler if it exists
      const handler = submitQuizHandler();
      if (handler) {
        const success = await handler();

        if (success && stepInfo.nextStep) {
          window.location.href = stepInfo.nextStep;
        } else if (!success) {
          // re-enable submit button after answering all questions
          const inputs = document.querySelectorAll('.question input[type="checkbox"], .question input[type="radio"]');
          inputs.forEach((input) => {
            input.addEventListener(
              'change',
              () => {
                secondLink.classList.remove('disabled');
              },
              { once: true },
            );
          });
        }
      }
    });
  } else {
    // Next link
    secondLink.classList.add('module-nav-next');
    secondLink.textContent = placeholders['course-next'] || 'Next';
    secondLink.href = stepInfo.nextStep || '#';
  }

  // Add links to container
  container.appendChild(previousLink);
  container.appendChild(secondLink);

  // Add to block
  block.appendChild(container);

  const allButtons = block.querySelectorAll('.module-nav-button');
  allButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      // Handle navigation to next module when on last step of current module
      const buttonText = button.textContent.trim();
      const nextText = placeholders['course-next'] || 'Next';
      const isLastStep = currentStepIndex === stepInfo.moduleSteps.length - 1;
      if (buttonText === nextText && isLastStep) {
        e.preventDefault();

        if (courseInfo && courseInfo.modules && courseInfo.modules.length > 0) {
          // Extract the current module path from the URL
          const pathParts = window.location.pathname.split('/');
          const currentModulePath = pathParts.length > 4 ? pathParts[4] : '';

          if (currentModulePath) {
            const currentModuleIndex = courseInfo.modules.findIndex((url) => url.includes(currentModulePath));

            // If there's a next module, navigate to its first step
            if (currentModuleIndex !== -1 && currentModuleIndex < courseInfo.modules.length - 1) {
              const nextModuleUrl = courseInfo.modules[currentModuleIndex + 1];

              // Fetch the next module's metadata to find the first step
              fetch(`${nextModuleUrl}.plain.html`)
                .then((response) => response.text())
                .then((html) => {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  // Find the first step link in the module
                  const moduleElement = doc.querySelector('.module');
                  if (moduleElement && moduleElement.children.length > 0) {
                    const firstStepLink = moduleElement.children[0].querySelector('a');
                    const firstStepUrl = firstStepLink?.getAttribute('href');

                    if (firstStepUrl) {
                      window.location.href = firstStepUrl;
                    }
                  }
                })
                .catch((error) => {
                  // eslint-disable-next-line no-console
                  console.error('Error navigating to next module:', error);
                });
            }
          }
        }
      }
    });
  });
}
