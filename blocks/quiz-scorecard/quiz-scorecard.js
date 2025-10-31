import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { getCurrentStepInfo } from '../../scripts/courses/course-utils.js';

/**
 * Decorate the quiz scorecard block
 * @param {Element} block The quiz scorecard block element
 */
export default async function decorate(block) {
  // Fetch language placeholders
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  // Extract properties using array destructuring
  const [resultDiv, descriptionDiv, cta1Div, cta2Div] = [...block.children];

  // Extract data from divs
  const description = descriptionDiv?.textContent?.trim() || '';

  // Clear the block content
  block.textContent = '';

  // Get score values from data attributes
  const correctAnswers = block.dataset.correctAnswers || '0';
  const totalQuestions = block.dataset.totalQuestions || '0';

  // Prepare CTA HTML if needed
  let ctaHTML = '';
  if (block.classList.contains('fail')) {
    const cta1Container = cta1Div.querySelector('div');
    const cta2Container = cta2Div.querySelector('div');

    // Add retake-quiz-button class
    cta2Container.querySelector('a')?.classList.add('retake-quiz-button');

    ctaHTML = `
      <div class="quiz-scorecard-cta-container">
        ${decorateCustomButtons(cta1Container, cta2Container)}
      </div>
    `;
  }

  // Create the entire scorecard structure using htmlToElement
  const scorecardHTML = `
    <div class="quiz-scorecard-container">
      <div class="quiz-scorecard-icon-container">
        <span class="icon icon-${block.classList.contains('pass') ? 'correct' : 'wrong'}"></span>
      </div>
      <div class="quiz-scorecard-content">
        <div class="quiz-scorecard-text">${resultDiv.innerHTML || ''}</div>
        <div class="quiz-scorecard-result">${
          placeholders?.courseScorecardResult
            ? `${placeholders?.courseScorecardResult.replace('{}', correctAnswers).replace('{}', totalQuestions)}`
            : `${correctAnswers} out of ${totalQuestions} correct`
        }</div>
        <div class="quiz-scorecard-description">${description}</div>
        ${ctaHTML}
      </div>
    </div>
  `;

  const scorecardElement = htmlToElement(scorecardHTML);
  block.appendChild(scorecardElement);
  decorateIcons(scorecardElement);

  const retakeButton = scorecardElement.querySelector('.retake-quiz-button');
  if (retakeButton) {
    retakeButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  // Add event listener for "Back to step one" button
  const backToStepOneButton = scorecardElement.querySelector(
    '.quiz-scorecard-cta-container a:not(.retake-quiz-button)',
  );
  if (backToStepOneButton) {
    backToStepOneButton.addEventListener('click', async (e) => {
      e.preventDefault();
      // Get the module steps information
      const stepInfo = await getCurrentStepInfo();
      if (stepInfo?.moduleSteps?.length > 0) {
        // Navigate to the first step of the module
        window.location.href = stepInfo.moduleSteps[0].url;
      }
    });
  }
}
