import { decorateIcon } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const cards = block.querySelectorAll('div > div');

  function toggleCard(card) {
    const isCurrentlyFlipped = card.classList.contains('flipped');

    if (isCurrentlyFlipped) {
      card.classList.remove('flipped');
      card.setAttribute('aria-pressed', 'false');
    } else {
      card.classList.add('flipped');
      card.setAttribute('aria-pressed', 'true');
    }
  }

  function addFlipText(cardContent) {
    cardContent.innerHTML += `
      <div class="flip-container">
        <span class="icon icon-refresh" aria-hidden="true"></span>
        <span class="flip-text" aria-label="Flip">Flip</span>
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

    const frontTitleText = cardDivs[0]?.textContent.trim() || '';
    const frontTitleTag = cardDivs[1]?.textContent.trim() || 'h3';
    const backTitleText = cardDivs[2]?.textContent.trim() || '';
    const backTitleTag = cardDivs[3]?.textContent.trim() || 'h3';
    const frontContentDiv = cardDivs[4];
    const backContentDiv = cardDivs[5];

    const hasFrontContent = frontContentDiv && frontContentDiv.textContent.trim() !== '';
    const hasBackContent = backContentDiv && backContentDiv.textContent.trim() !== '';

    card.innerHTML = `
      <div>
        ${
          frontTitleText
            ? `<${frontTitleTag} class="flip-card-title ${
                hasFrontContent ? '' : 'flip-card-title-only'
              }">${frontTitleText}</${frontTitleTag}>`
            : ''
        }
        ${frontContentDiv ? `<div class="flip-card-content">${frontContentDiv.innerHTML}</div>` : ''}
      </div>
      <div>
        ${
          backTitleText
            ? `<${backTitleTag} class="flip-card-title ${
                hasBackContent ? '' : 'flip-card-title-only'
              }">${backTitleText}</${backTitleTag}>`
            : ''
        }
        ${backContentDiv ? `<div class="flip-card-content">${backContentDiv.innerHTML}</div>` : ''}
      </div>
    `;

    const [frontContainer, backContainer] = card.children;
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
