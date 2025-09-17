import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';

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
        <div class="quiz-scorecard-result">${correctAnswers} ${placeholders?.out || 'out'} ${
          placeholders?.of || 'of'
        } ${totalQuestions} ${placeholders?.correct || 'correct'}</div>
        <div class="quiz-scorecard-description">${description}</div>
        ${ctaHTML}
      </div>
    </div>
  `;

  const scorecardElement = htmlToElement(scorecardHTML);
  block.appendChild(scorecardElement);
  decorateIcons(scorecardElement);
}
