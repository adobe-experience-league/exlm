import {
  getCurrentStepInfo,
  isLastStep,
  getNextModuleFirstStep,
  isLastModuleOfCourse,
  getCourseCompletionPageUrl,
  getCourseFragmentUrl,
} from '../../scripts/courses/course-utils.js';
import { fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { submitQuizHandler } from '../quiz/quiz.js';
import { finishModule, completeCourse } from '../../scripts/courses/course-profile.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Helper function to update back button to point to course landing page
async function updateBackButtonToCourseUrl(button, placeholdersObj) {
  if (!button) return;
  button.textContent = placeholdersObj?.backToCourseOverview || 'Back to Course Overview';
  const courseUrl = await getCourseFragmentUrl();
  if (courseUrl) {
    button.href = courseUrl;
  }
}

async function handleQuizNextButton(e) {
  e.preventDefault();

  // Disable the button immediately to prevent multiple submissions
  e.target.classList.add('disabled');

  // Call the quiz submission handler if it exists
  const handler = submitQuizHandler();
  if (!handler) return;
  const isQuizPassed = await handler();

  const backButton = document.querySelector('.module-nav-button.module-nav-back');
  const nextButton = document.querySelector('.module-nav-button.module-nav-submit');

  // Check if quiz-scorecard block is present (quiz has been successfully submitted)
  const quizScorecard = document.querySelector('.quiz-scorecard');

  if (quizScorecard) {
    if (backButton) {
      await updateBackButtonToCourseUrl(backButton, placeholders);
    }
    if (nextButton) {
      nextButton.textContent = placeholders?.nextBtnLabel || 'Next';
    }
  }

  if (!isQuizPassed) {
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
    return;
  }

  // Remove the event listener when quiz is passed
  e.target.removeEventListener('click', handleQuizNextButton);

  // Check if this is the last step in the module
  if (!(await isLastStep())) return;

  // Check if this is the last module of the course and complete the course
  if (await isLastModuleOfCourse()) {
    await completeCourse();
    const url = await getCourseCompletionPageUrl();
    if (url) e.target.href = url;
  } else {
    await finishModule();
    const url = await getNextModuleFirstStep();
    if (url) e.target.href = url;
  }

  if (nextButton) {
    nextButton.classList.remove('disabled');
  }
}

export default async function decorate(block) {
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
  previousLink.textContent = placeholders?.playlistPreviousLabel || 'Previous';

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

  // Check if next step is a quiz step
  const isNextStepQuiz = stepInfo?.nextStep === stepInfo?.moduleQuiz;

  // Get environment config
  const { isProd } = getConfig();

  // Check if quiz should be skipped (already passed and not in production)
  const skipQuiz = isQuiz && !isProd && sessionStorage.getItem('course.skipQuiz') === 'true';

  // Function to set up the next button for regular navigation
  const setupNextButton = () => {
    nextLink.classList.add('module-nav-next');
    nextLink.textContent = placeholders?.courseNext || 'Next';
    nextLink.href = stepInfo.nextStep || '#';
  };

  if (isRecap || isNextStepQuiz) {
    // Take Quiz link
    nextLink.classList.add('module-nav-quiz');
    nextLink.textContent = placeholders?.courseTakeQuiz || 'Take Quiz';
    nextLink.href = stepInfo.moduleQuiz || '#';
  } else if (isQuiz && !skipQuiz) {
    // Submit Answers link
    nextLink.classList.add('module-nav-submit');
    nextLink.textContent = placeholders?.courseSubmitAnswers || 'Submit Answers';
    nextLink.href = stepInfo.nextStep || '#';
    nextLink.addEventListener('click', handleQuizNextButton);
  } else {
    // Regular Next link (for normal steps or skipped quizzes)
    setupNextButton();

    // Update previous button text and href if this is a skipped quiz
    if (isQuiz && skipQuiz) {
      await updateBackButtonToCourseUrl(previousLink, placeholders);
    }
  }

  // Check if this is the last step - maintaining the original condition exactly
  if ((!isQuiz || skipQuiz) && (await isLastStep())) {
    nextLink.classList.add('disabled');
    if (await isLastModuleOfCourse()) {
      await completeCourse();
      const courseCompletionPageUrl = await getCourseCompletionPageUrl();
      if (courseCompletionPageUrl) {
        nextLink.href = courseCompletionPageUrl;
      }
    } else {
      await finishModule();
      const nextModuleFirstStepUrl = await getNextModuleFirstStep();
      if (nextModuleFirstStepUrl) {
        nextLink.href = nextModuleFirstStepUrl;
      }
    }
    nextLink.classList.remove('disabled');
  }

  // Check if quiz-scorecard block is present on page load
  const quizScorecard = document.querySelector('.quiz-scorecard');
  if (quizScorecard && isQuiz) {
    await updateBackButtonToCourseUrl(previousLink, placeholders);
    if (nextLink.classList.contains('module-nav-submit')) {
      nextLink.textContent = placeholders?.nextBtnLabel || 'Next';
    }
  }

  // Add links to container
  container.appendChild(previousLink);
  container.appendChild(nextLink);

  // Add to block
  block.appendChild(container);
}
