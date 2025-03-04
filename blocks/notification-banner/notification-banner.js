import { decorateIcons } from '../../scripts/lib-franklin.js';

const STORAGE_KEY = 'notification-banner';

const bannerStore = {
  remove: () => localStorage.removeItem(STORAGE_KEY),
  /**
   * @param {string} id
   * @param {boolean} dismissed
   * @returns {id: string, dismissed: boolean}
   */
  set: (id, dismissed) => localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, dismissed })),
  /** @returns {id: string, dismissed: boolean} */
  get: () => (localStorage.getItem(STORAGE_KEY) !== undefined ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : null),
};

/**
 * Initializes the banner by setting up its content and event listeners.
 * @param {HTMLElement} block - The notification banner block.
 * @param {string} bannerId - The unique identifier for the banner.
 * @param {string} storage - The storage type (sessionStorage/localStorage).
 * @param {HTMLElement} headingElem - The heading element.
 * @param {HTMLElement} descriptionElem - The description element.
 * @param {HTMLElement} ctaElem - The call-to-action element.
 * @param {HTMLElement} bgColorElem - The background color element.
 */
function decorateBanner({ block, bannerId, headingElem, descriptionElem, ctaElem, dismissable }) {
  block.textContent = '';

  const cta = ctaElem.querySelector('a');
  cta.classList.add('button', 'secondary', 'custom', 'text-white');

  const dismissButton = `
  <div class='notification-banner-close'>
    <span class="icon icon-close-light"></span>
  </div>`;

  block.innerHTML = `
    <div>
      <div class='notification-banner-content'>
          <h3>${headingElem.innerHTML}</h3>
          <p>${descriptionElem.innerHTML}</p>
        </div>
        <div class="notification-banner-actions">
          <div class='notification-banner-cta'>${ctaElem.innerHTML}</div>
          ${dismissable ? dismissButton : ''}
        </div>
      </div>
    </div>
  `;

  decorateIcons(block);

  const closeIcon = block.querySelector('.notification-banner-close');
  closeIcon?.addEventListener('click', () => {
    block.parentElement.remove();
    bannerStore.set(bannerId, true); // dismissed
  });
}

export default async function decorate(block) {
  const [idElem, headingElem, descriptionElem, ctaElem] = [...block.children].map((row) => row.firstElementChild);
  const classes = Array.of(...block.classList);
  const dismissable = classes.includes('dismissable');

  const bannerId = idElem?.textContent?.trim();
  const bannerState = bannerStore.get();

  if (dismissable && bannerState && bannerState.id === bannerId && bannerState.dismissed) {
    block.remove(); // remove the banner section if it was dismissed
  } else {
    decorateBanner({ block, bannerId, headingElem, descriptionElem, ctaElem, dismissable });
  }
}
