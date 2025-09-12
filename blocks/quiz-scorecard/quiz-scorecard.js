import { createOptimizedPicture } from '../../scripts/scripts.js';

/**
 * Creates the icon element based on the quiz status
 * @param {string} status - The quiz status ('pass' or 'fail')
 * @returns {HTMLElement} The icon element
 */
function createStatusIcon(status) {
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'quiz-scorecard-icon';
  
  const icon = document.createElement('span');
  icon.className = `icon icon-${status === 'pass' ? 'check' : 'wrong'}`;
  
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  if (status === 'pass') {
    // Checkmark path
    path.setAttribute('d', 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z');
    path.setAttribute('fill', '#007E50'); // Green color for pass
  } else {
    // X mark path
    path.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z');
    path.setAttribute('fill', '#F00'); // Red color for fail
  }
  
  svg.appendChild(path);
  icon.appendChild(svg);
  iconWrapper.appendChild(icon);
  
  return iconWrapper;
}

/**
 * Creates a button element
 * @param {string} text - The button text
 * @param {string} link - The button link
 * @param {string} type - The button type ('primary' or 'secondary')
 * @returns {HTMLElement} The button element
 */
function createButton(text, link, type) {
  if (!text || !link) return null;
  
  const button = document.createElement('a');
  button.className = `button ${type || 'primary'}`;
  button.href = link;
  button.textContent = text;
  
  return button;
}

/**
 * Decorates the quiz-scorecard block
 * @param {Element} block The quiz-scorecard block element
 */
export default function decorate(block) {
  // Extract data from block children
  const [titleDiv, descriptionDiv, statusDiv, scoreDiv, cta1TypeDiv, cta1TextDiv, cta1LinkDiv, cta2TypeDiv, cta2TextDiv, cta2LinkDiv] = [...block.children];
  
  // Get values
  const title = titleDiv?.textContent?.trim() || '';
  const description = descriptionDiv?.textContent?.trim() || '';
  const status = statusDiv?.textContent?.trim()?.toLowerCase() || 'pass';
  const score = scoreDiv?.textContent?.trim() || '';
  const cta1Type = cta1TypeDiv?.textContent?.trim() || 'primary';
  const cta1Text = cta1TextDiv?.textContent?.trim() || '';
  const cta1Link = cta1LinkDiv?.textContent?.trim() || '';
  const cta2Type = cta2TypeDiv?.textContent?.trim() || 'secondary';
  const cta2Text = cta2TextDiv?.textContent?.trim() || '';
  const cta2Link = cta2LinkDiv?.textContent?.trim() || '';
  
  // Clear the block
  block.textContent = '';
  
  // Add status class to block
  block.classList.add(`quiz-scorecard-${status}`);
  
  // Create scorecard container
  const container = document.createElement('div');
  container.className = 'quiz-scorecard-container';
  
  // Add icon
  const iconElement = createStatusIcon(status);
  container.appendChild(iconElement);
  
  // Add result text
  const resultText = document.createElement('div');
  resultText.className = 'quiz-scorecard-result';
  resultText.textContent = status === 'pass' ? 'You passed the quiz!' : 'You didn\'t pass the quiz.';
  container.appendChild(resultText);
  
  // Add score
  if (score) {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'quiz-scorecard-score';
    scoreElement.textContent = score;
    container.appendChild(scoreElement);
  }
  
  // Add description
  if (description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'quiz-scorecard-description';
    descriptionElement.textContent = description;
    container.appendChild(descriptionElement);
  }
  
  // Add buttons container (only for fail status)
  if (status === 'fail') {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'quiz-scorecard-buttons';
    
    // Add first CTA button
    const cta1Button = createButton(cta1Text, cta1Link, cta1Type);
    if (cta1Button) {
      buttonsContainer.appendChild(cta1Button);
    }
    
    // Add second CTA button
    const cta2Button = createButton(cta2Text, cta2Link, cta2Type);
    if (cta2Button) {
      buttonsContainer.appendChild(cta2Button);
    }
    
    // Add buttons to container if there are any
    if (buttonsContainer.children.length > 0) {
      container.appendChild(buttonsContainer);
    }
  }
  
  // Add container to block
  block.appendChild(container);
}
