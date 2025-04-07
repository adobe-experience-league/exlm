import { decorateIcons } from '../../scripts/lib-franklin.js';
import { MD5 } from '../../scripts/crypto.js';

const STORAGE_KEY = 'notification-banner';

const bannerStore = {
  remove: () => localStorage.removeItem(STORAGE_KEY),
  /**
   * @param {string} id
   * @returns {id: string}
   */
  set: (id) => localStorage.setItem(STORAGE_KEY, JSON.stringify({ id })),
  /** @returns {id: string} */
  get: () => (localStorage.getItem(STORAGE_KEY) !== undefined ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : null),
};

function generateHash(content) {
  if (typeof content !== 'string') return '';
  return MD5(content);
}

/**
 * Initializes the banner by setting up its content and event listeners.
 * @param {HTMLElement} block - The notification banner block.
 * @param {string} storage - The storage type (sessionStorage/localStorage).
 * @param {HTMLElement} headingElem - The heading element.
 * @param {HTMLElement} descriptionElem - The description element.
 * @param {HTMLElement} ctaElem - The call-to-action element.
 * @param {HTMLElement} bgColorElem - The background color element.
 */
function decorateBanner({ block, bannerId, headingElem, descriptionElem, ctaElem, dismissable }) {
  block.textContent = '';

  const cta = ctaElem?.querySelector('a');
  cta?.classList.add('button', 'secondary', 'custom', 'text-white');

  const dismissButton = `
  <div class='notification-banner-close'>
    <span class="icon icon-close-light"></span>
  </div>`;

  block.innerHTML = `
    <div>
    <div class='notification-banner-content'>
      <div class='notification-banner-text'>
        ${headingElem?.textContent.trim() ? `<h3>${headingElem.innerHTML}</h3>` : ''}
        ${descriptionElem?.textContent.trim() ? `<p>${descriptionElem.innerHTML}</p>` : ''}
      </div>
      ${ctaElem?.textContent.trim() ? `<div class='notification-banner-cta'>${ctaElem?.innerHTML}</div>` : ''}
    </div>
      ${dismissable ? dismissButton : ''}
    </div>
  `;

  decorateIcons(block);

  if (dismissable) {
    const closeIcon = block.querySelector('.notification-banner-close');
    closeIcon?.addEventListener('click', () => {
      block.parentElement.remove();
      bannerStore.set(bannerId); // dismissed
    });
  }
}

export default async function decorate(block) {
  const [headingElem, descriptionElem, ctaElem] = [...block.children].map((row) => row.firstElementChild);
  const classes = Array.of(...block.classList);
  const dismissable = classes.includes('dismissable');
  let bannerId = '';
  let bannerState = null;

  if (dismissable) {
    const ctaData = ctaElem?.querySelector('a');
    const ctaLink = ctaData?.getAttribute('href');
    const ctaText = ctaData?.textContent.trim();
    bannerId = generateHash(
      [headingElem, descriptionElem, ctaText, ctaLink]
        .filter(Boolean)
        .map((el) => el?.textContent?.trim() || el)
        .join(' '),
    );
    bannerState = bannerStore.get();
  }

  if (dismissable && bannerState && bannerState.id === bannerId) {
    block.remove(); // remove the banner section if it was dismissed
  } else {
    decorateBanner({ block, bannerId, headingElem, descriptionElem, ctaElem, dismissable });
  }
}
