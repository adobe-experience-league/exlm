import { decorateIcon } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const cards = block.querySelectorAll('div > div');

  function toggleCard(card) {
    const isCurrentlyFlipped = card.classList.contains('flipped');
    const [frontFace, backFace] = card.children;

    if (isCurrentlyFlipped) {
      card.classList.remove('flipped');
      card.setAttribute('aria-pressed', 'false');
      // Update active class
      frontFace.classList.add('active');
      backFace.classList.remove('active');
    } else {
      card.classList.add('flipped');
      card.setAttribute('aria-pressed', 'true');
      // Update active class
      frontFace.classList.remove('active');
      backFace.classList.add('active');
    }
  }

  function addFlipText(cardContent) {
    cardContent.innerHTML += `
      <div class="flip-container">
        <span class="icon icon-refresh" aria-hidden="true"></span>
        <span class="flip-text" aria-label="Flip">${placeholders.flipText || 'Flip'}</span>
      </div>
    `;

    const flipContainer = cardContent.querySelector('.flip-container:last-child');
    const refreshIcon = flipContainer.querySelector('.icon-refresh');

    decorateIcon(refreshIcon);

    flipContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = cardContent.parentElement;
      toggleCard(card);
    });
  }

  cards.forEach((card, index) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Flip card ${index + 1}`);

    const cardDivs = Array.from(card.children);

    // Using object destructuring for child elements
    const [frontTitleDiv, backTitleDiv, frontContentDiv, backContentDiv] = cardDivs;
    // Check if we have titles
    const hasFrontTitle = frontTitleDiv?.firstElementChild;
    const hasBackTitle = backTitleDiv?.firstElementChild;

    // Extract the title elements and add appropriate classes
    if (hasFrontTitle) {
      const frontTitleElement = frontTitleDiv.firstElementChild;
      frontTitleElement.classList.add('flip-card-title');
    }

    if (hasBackTitle) {
      const backTitleElement = backTitleDiv.firstElementChild;
      backTitleElement.classList.add('flip-card-title');
    }

    card.innerHTML = `
      <div>
        ${frontTitleDiv ? frontTitleDiv.innerHTML : ''}
        ${frontContentDiv ? `<div class="flip-card-content">${frontContentDiv.innerHTML}</div>` : ''}
      </div>
      <div>
        ${backTitleDiv ? backTitleDiv.innerHTML : ''}
        ${backContentDiv ? `<div class="flip-card-content">${backContentDiv.innerHTML}</div>` : ''}
      </div>
    `;

    const [frontContainer, backContainer] = card.children;
    // Add active class to front face initially
    frontContainer.classList.add('active');
    addFlipText(frontContainer);
    addFlipText(backContainer);

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });
}
