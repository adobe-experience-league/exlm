export default async function decorate(block) {
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

    const [frontContainer] = card.children;
    // Add active class to front face initially
    frontContainer.classList.add('active');

    // Add click event to the entire card
    card.addEventListener('click', () => {
      toggleCard(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });
}
