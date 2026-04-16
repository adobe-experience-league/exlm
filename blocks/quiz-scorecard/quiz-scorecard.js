import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { getCurrentStepInfo } from '../../scripts/courses/course-utils.js';
import { pushLinkClick } from '../../scripts/analytics/lib-analytics.js';

/**
 * Decorate the quiz scorecard block
 * @param {Element} block The quiz scorecard block element
 */
export default async function decorate(block) {
  const isError = block.classList.contains('error');
  const isFail = block.classList.contains('fail');
  const isPass = block.classList.contains('pass');

  const [resultDiv, descriptionDiv, cta1Div, cta2Div] = [...block.children];

  const resultHtml = resultDiv?.innerHTML || '';
  const descriptionPlain = descriptionDiv?.textContent?.trim() || '';
  const descriptionHtml = descriptionDiv?.innerHTML?.trim() || '';

  // Fetch language placeholders
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  block.textContent = '';

  const correctAnswers = block.dataset.correctAnswers || '0';
  const totalQuestions = block.dataset.totalQuestions || '0';

  let ctaHTML = '';
  if (isFail && cta1Div && cta2Div) {
    const cta1Container = cta1Div.querySelector('div');
    const cta2Container = cta2Div.querySelector('div');

    cta2Container?.querySelector('a')?.classList.add('retake-quiz-button');

    ctaHTML = `
      <div class="quiz-scorecard-cta-container">
        ${decorateCustomButtons(cta1Container, cta2Container)}
      </div>
    `;
  }

  let icon = 'wrong';
  if (isPass) {
    icon = 'correct';
  }

  const scoreLineSection = isError
    ? ''
    : `
        <div class="quiz-scorecard-result">${
          placeholders?.courseScorecardResult
            ? `${placeholders?.courseScorecardResult.replace('{}', correctAnswers).replace('{}', totalQuestions)}`
            : `${correctAnswers} out of ${totalQuestions} correct`
        }</div>
      `;

  const descriptionContent = isError ? descriptionHtml : descriptionPlain;

  const scorecardHTML = `
    <div class="quiz-scorecard-container">
      <div class="quiz-scorecard-icon-container">
        <span class="icon icon-${icon}"></span>
      </div>
      <div class="quiz-scorecard-content">
        <div class="quiz-scorecard-text">${resultHtml}</div>
        ${scoreLineSection}
        <div class="quiz-scorecard-description">${descriptionContent}</div>
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

  const backToStepOneButton = scorecardElement.querySelector(
    '.quiz-scorecard-cta-container a:not(.retake-quiz-button)',
  );
  if (!backToStepOneButton) return;

  try {
    getCurrentStepInfo().then((stepInfo) => {
      const firstStepUrl = stepInfo?.moduleSteps?.[0]?.url;
      if (firstStepUrl) {
        backToStepOneButton.href = firstStepUrl;

        // calling pushLinkClick explicitly
        backToStepOneButton.addEventListener('click', (e) => {
          pushLinkClick(e);
        });
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error setting href for the first step:', error);
  }
}
