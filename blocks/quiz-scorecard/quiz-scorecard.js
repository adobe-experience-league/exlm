import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

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
export default function decorate(block) {
  // Extract properties using array destructuring
  const [titleRow, statusRow, descriptionRow, cta1Row, cta2Row] = [...block.children];

  // Extract data from rows
  const titleElement = titleRow.querySelector('h6, h5, h4, h3, h2, h1');
  const status = statusRow.querySelector('div').textContent.trim().toLowerCase();
  const description = descriptionRow.querySelector('div').textContent.trim();

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

  // Add status text from title field
  const statusTextElement = document.createElement('p');
  statusTextElement.className = 'quiz-scorecard-status-text';
  // Use title content if available, otherwise fall back to default messages
  if (titleElement && titleElement.textContent.trim()) {
    statusTextElement.textContent = titleElement.textContent.trim();
  } else {
    statusTextElement.textContent = status === 'pass' ? 'You passed the quiz!' : "You didn't pass the quiz!";
  }
  contentContainer.appendChild(statusTextElement);

  // Add quiz score results (correct answers out of total)
  const scoreResultElement = document.createElement('div');
  scoreResultElement.className = 'quiz-scorecard-result';

  // Try to extract a score pattern like "X of Y correct" from title element
  const scorePattern = /(\d+)\s+of\s+(\d+)\s+correct/i;
  const textMatch = titleElement?.textContent.match(scorePattern);

  if (textMatch) {
    scoreResultElement.textContent = textMatch[0];
  } else {
    // Check if there's a data attribute with quiz results
    const correctAnswers = block.dataset.correctAnswers || '0';
    const totalQuestions = block.dataset.totalQuestions || '0';
    scoreResultElement.textContent = `${correctAnswers} out of ${totalQuestions} correct`;
  }

  contentContainer.appendChild(scoreResultElement);

  // Add description
  if (description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'quiz-scorecard-description';
    descriptionElement.textContent = description;
    contentContainer.appendChild(descriptionElement);
  }

  // Add CTAs for fail status
  if (status === 'fail') {
    // Create CTA container with buttons using decorateCustomButtons
    // Go one level deeper (div>div) to get the proper button container elements
    const cta1Container = cta1Row.querySelector('div');
    const cta2Container = cta2Row.querySelector('div');

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
