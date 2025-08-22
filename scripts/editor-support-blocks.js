import { loadIms } from './scripts.js';

// track the currently selected flip card
let selectedFlipCard = null;

export function handleFlipCardSelection(event) {
  // handle deselection for flip cards
  if (!event.detail.selected) {
    // unflip the previously selected flip card
    if (selectedFlipCard) {
      selectedFlipCard.classList.remove('flipped');
      selectedFlipCard.setAttribute('aria-pressed', 'false');
      selectedFlipCard = null;
    }
    return;
  }

  // if a flip-card-item was selected
  if (event.target.closest('.flip-card > div')) {
    // unflip the previously selected flip card
    if (selectedFlipCard) {
      selectedFlipCard.classList.remove('flipped');
      selectedFlipCard.setAttribute('aria-pressed', 'false');
    }

    // flip the newly selected card
    const flipCard = event.target.closest('.flip-card > div');
    flipCard.classList.add('flipped');
    flipCard.setAttribute('aria-pressed', 'true');
    selectedFlipCard = flipCard;
  }
}

export async function highlightCodeBlock(document) {
  const codeBlocks = document.querySelectorAll('pre code');

  if (codeBlocks.length === 0) return;

  const highlight = () => {
    codeBlocks.forEach((block) => {
      try {
        window.Prism?.highlightElement(block);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Prism highlight failed:', e);
      }
    });
  };

  if (window.Prism) {
    setTimeout(highlight, 250);
  } else {
    const { default: loadPrism } = await import('./utils/prism-utils.js');
    loadPrism(document)
      .then(() => {
        setTimeout(highlight, 250);
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Failed to load Prism:', e));
  }
}

export async function handleSignUpBlock(signUpBlock) {
  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  new MutationObserver((e) => {
    e.forEach((change) => {
      if (change.target.classList.contains('adobe-ue-edit')) {
        signUpBlock.style.display = 'block';
      } else {
        signUpBlock.style.display = window.adobeIMS?.isSignedInUser() ? 'none' : 'block';
      }
    });
  }).observe(document.documentElement, { attributeFilter: ['class'] });
}
