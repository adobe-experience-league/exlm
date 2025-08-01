import { loadIms } from './scripts.js';

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
