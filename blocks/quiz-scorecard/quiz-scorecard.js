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
  const [titleDiv, classesDiv, descriptionDiv, cta1Div, cta2Div] = [...block.children];

  // Extract data from divs
  const titleElement = titleDiv.querySelector('h6, h5, h4, h3, h2, h1');
  const classes = classesDiv.querySelector('div').textContent.trim().toLowerCase();
  const description = descriptionDiv?.querySelector('div')?.textContent?.trim() || '';

  // Clear the block content
  block.innerHTML = '';

  // Create scorecard container
  const scorecardContainer = document.createElement('div');
  scorecardContainer.className = 'quiz-scorecard-container';

  // Add classes icon
  const iconElement = htmlToElement(`
    <div class="quiz-scorecard-icon-container">
      <span class="icon icon-${classes === 'pass' ? 'correct' : 'wrong'}"></span>
    </div>
  `);
  scorecardContainer.appendChild(iconElement);
  decorateIcons(scorecardContainer);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'quiz-scorecard-content';

  // Add appropriate class based on status
  block.classList.add(`quiz-scorecard-${classes}`);

  // Create classes text element
  const classesTextElement = titleElement;
  classesTextElement.className = 'quiz-scorecard-classes-text';

  // Only set content as fallback if the title element's content is empty
  if (!titleElement.textContent.trim()) {
    classesTextElement.textContent =
      classes === 'pass'
        ? placeholders?.quizPass || 'You passed the quiz!'
        : placeholders?.quizFail || "You didn't pass the quiz!";
  }
  contentContainer.appendChild(classesTextElement);

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

  // Add CTAs for fail class
  if (classes === 'fail') {
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
