import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

/**
 * Create icon element for pass/fail status
 * @param {string} status - 'pass' or 'fail'
 * @returns {HTMLElement} Icon element
 */
function createStatusIcon(status) {
  const iconContainer = document.createElement('div');
  const iconSpan = document.createElement('span');

  iconContainer.className = 'quiz-scorecard-icon-container';
  iconSpan.className = `icon icon-${status === 'pass' ? 'correct' : 'wrong'}`;

  iconContainer.appendChild(iconSpan);

  return iconContainer;
}

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
  const [titleDiv, statusDiv, descriptionDiv, cta1Div, cta2Div] = [...block.children];

  // Extract data from divs
  const titleElement = titleDiv.querySelector('h6, h5, h4, h3, h2, h1');
  const status = statusDiv.querySelector('div').textContent.trim().toLowerCase();
  const description = descriptionDiv?.querySelector('div')?.textContent?.trim() || '';

  // Clear the block content
  block.innerHTML = '';

  // Add appropriate class based on status
  block.classList.add(`quiz-scorecard-${status}`);

  // Create scorecard container
  const scorecardContainer = document.createElement('div');
  scorecardContainer.className = 'quiz-scorecard-container';

  // Add status icon
  const iconElement = createStatusIcon(status);
  scorecardContainer.appendChild(iconElement);
  decorateIcons(scorecardContainer);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'quiz-scorecard-content';

  // Create status text element
  const statusTextElement = titleElement;
  statusTextElement.className = 'quiz-scorecard-status-text';

  // Only set content as fallback if the title element's content is empty
  if (!titleElement.textContent.trim()) {
    statusTextElement.textContent = status === 'pass' ? 'You passed the quiz!' : "You didn't pass the quiz!";
  }
  contentContainer.appendChild(statusTextElement);

  // Add quiz score results (correct answers out of total)
  const scoreResultElement = document.createElement('div');
  scoreResultElement.className = 'quiz-scorecard-result';

  // Get score values from data attributes
  const correctAnswers = block.dataset.correctAnswers || '0';
  const totalQuestions = block.dataset.totalQuestions || '0';

  scoreResultElement.textContent = `${correctAnswers} ${placeholders?.out || 'out'} ${
    placeholders?.of || 'of'
  } ${totalQuestions}`;

  contentContainer.appendChild(scoreResultElement);

  const descriptionElement = document.createElement('div');
  descriptionElement.className = 'quiz-scorecard-description';
  descriptionElement.textContent = description;
  contentContainer.appendChild(descriptionElement);

  // Add CTAs for fail status
  if (status === 'fail') {
    const cta1Container = cta1Div.querySelector('div');
    const cta2Container = cta2Div.querySelector('div');

    const ctaContainerHTML = `
      <div class="quiz-scorecard-cta-container">
        ${decorateCustomButtons(cta1Container, cta2Container)}
      </div>
    `;

    // Add the CTA container to the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ctaContainerHTML;
    contentContainer.appendChild(tempDiv.firstElementChild);
  }

  // Add content to scorecard
  scorecardContainer.appendChild(contentContainer);
  block.appendChild(scorecardContainer);
}
