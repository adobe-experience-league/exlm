import { decorateIcon } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  // Get all flip card items
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

  function addRefreshIcon(cardContent) {
    const refreshIcon = document.createElement('span');
    refreshIcon.className = 'icon icon-refresh';
    refreshIcon.setAttribute('aria-label', 'Refresh');
    cardContent.appendChild(refreshIcon);
    decorateIcon(refreshIcon);
  }

  cards.forEach((card, index) => {
    // Make card focusable for accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Flip card ${index + 1}`);

    // Add refresh icons to both front and back content
    const frontContent = card.querySelector('div:first-child');
    const backContent = card.querySelector('div:last-child');

    if (frontContent) {
      addRefreshIcon(frontContent);
    }
    if (backContent) {
      addRefreshIcon(backContent);
    }

    // Add click event listener for flip functionality
    card.addEventListener('click', () => toggleCard(card));

    // Add keyboard support for accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });
}
