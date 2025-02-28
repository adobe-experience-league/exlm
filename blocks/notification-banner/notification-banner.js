import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Removes the banner and updates storage.
 * @param {HTMLElement} block - The notification banner block.
 * @param {string} bannerId - The unique identifier for the banner.
 * @param {string} storage - The storage type (sessionStorage/localStorage).
 */
function removeBanner(block, bannerId, storage = 'sessionStorage') {
  block.parentElement.remove();
  if (bannerId && storage && window[storage]) {
    window[storage].setItem('notification-banner', JSON.stringify({ id: bannerId, dismissed: true }));
  }
}

/**
 * Determines the storage type (localStorage or sessionStorage) for a given key.
 * @param {string} key - The storage key to check.
 * @returns {string|boolean} - The storage type or false if not found.
 */
function getStorageType(key) {
  if (localStorage.getItem(key) !== null) {
    return 'localStorage';
  }
  if (sessionStorage.getItem(key) !== null) {
    return 'sessionStorage';
  }
  return false;
}

/**
 * Creates the banner DOM structure.
 * @param {string} headingHTML - HTML for the banner heading.
 * @param {string} descriptionHTML - HTML for the banner description.
 * @param {string} ctaHTML - HTML for the call-to-action element.
 * @returns {DocumentFragment} - The generated banner DOM.
 */
function createBannerDOM(headingHTML, descriptionHTML, ctaHTML) {
  return document.createRange().createContextualFragment(`
    <div class='notification-banner-content'>
      <h3>${headingHTML}</h3>
      <p>${descriptionHTML}</p>
    </div>
    <div class="notification-banner-actions">
      <div class='notification-banner-cta'>${ctaHTML}</div>
      <div class='notification-banner-close'>
        <span class="icon icon-close-light"></span>
      </div>
    </div>
  `);
}

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
function initializeBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem) {
  block.textContent = '';
  window[storage].removeItem('notification-banner');
  window[storage].setItem('notification-banner', JSON.stringify({ id: bannerId, dismissed: false }));

  const cta = ctaElem.querySelector('a');
  cta.classList.add('button', 'secondary');

  const bannerDOM = createBannerDOM(headingElem.innerHTML, descriptionElem.innerHTML, ctaElem.innerHTML);
  decorateIcons(bannerDOM);

  const bgColor = bgColorElem?.textContent?.trim();
  block.style.backgroundColor = `var(${bgColor})`;

  const closeIcon = bannerDOM.querySelector('.notification-banner-close .icon');
  closeIcon.addEventListener('click', () => removeBanner(block, bannerId, storage));
  block.append(bannerDOM);
}

export default async function decorate(block) {
  const [idElem, headingElem, descriptionElem, ctaElem, bgColorElem, dismissalElem] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const bannerId = idElem?.textContent?.trim();
  const storage = dismissalElem?.textContent?.trim();

  if (window[storage]?.getItem('notification-banner')) {
    const existingBannerInfo = JSON.parse(window[storage].getItem('notification-banner'));
    if (
      existingBannerInfo.id === bannerId &&
      getStorageType('notification-banner') === storage &&
      existingBannerInfo.dismissed
    ) {
      block.parentElement.remove();
    } else {
      initializeBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem);
    }
  } else {
    block.textContent = '';
    const existingStorage = getStorageType('notification-banner');
    if (existingStorage) {
      window[existingStorage].removeItem('notification-banner');
    }
    initializeBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem);
  }
}
