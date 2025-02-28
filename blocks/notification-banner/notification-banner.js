import { decorateIcons } from '../../scripts/lib-franklin.js';

const STORAGE_TYPE = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
};

const STORAGE_KEY = 'notification-banner';

/**
 * Determines the storage type (localStorage or sessionStorage) for a given key.
 * @param {string} key - The storage key to check.
 * @returns {string|boolean} - The storage type or false if not found.
 */
function getStorageType() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return STORAGE_TYPE.LOCAL;
  if (sessionStorage.getItem(STORAGE_KEY) !== null) return STORAGE_TYPE.SESSION;
  return false;
}

function getBannerStore(storage, key = STORAGE_KEY) {
  /** @type {WindowLocalStorage | WindowSessionStorage} */
  const store = storage === 'localStorage' ? localStorage : sessionStorage;

  return {
    remove: () => store.removeItem(key),
    set: (id, dismissed) => store.setItem(key, JSON.stringify({ id, dismissed })),
    get: () => (store.getItem(key) !== undefined ? JSON.parse(store.getItem(key)) : null),
  };
}

/**
 * Removes the banner and updates storage.
 * @param {HTMLElement} block - The notification banner block.
 * @param {string} bannerId - The unique identifier for the banner.
 * @param {string} storage - The storage type (sessionStorage/localStorage).
 */
function removeBanner(block, bannerId, storage = 'sessionStorage') {
  block.parentElement.remove();
  getBannerStore(storage).set(bannerId, true); // dismissed
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
function decorateBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem) {
  block.textContent = '';
  const store = getBannerStore(storage);
  store.remove();
  store.set(bannerId, false); // not dismissed

  const cta = ctaElem.querySelector('a');
  cta.classList.add('button', 'secondary');

  block.innerHTML = `
    <div>
      <div class='notification-banner-content'>
          <h3>${headingElem.innerHTML}</h3>
          <p>${descriptionElem.innerHTML}</p>
        </div>
        <div class="notification-banner-actions">
          <div class='notification-banner-cta'>${ctaElem.innerHTML}</div>
          <div class='notification-banner-close'>
            <span class="icon icon-close-light"></span>
          </div>
        </div>
      </div>
    </div>
  `;

  decorateIcons(block);

  const bgColor = bgColorElem?.textContent?.trim();
  block.style.backgroundColor = `var(${bgColor})`;

  const closeIcon = block.querySelector('.notification-banner-close');
  closeIcon.addEventListener('click', () => removeBanner(block, bannerId, storage));
}

export default async function decorate(block) {
  const [idElem, headingElem, descriptionElem, ctaElem, bgColorElem, dismissalElem] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const bannerId = idElem?.textContent?.trim();
  const storage = dismissalElem?.textContent?.trim();
  const store = getBannerStore(storage);

  const existingBannerInfo = store.get();
  if (existingBannerInfo) {
    if (existingBannerInfo.id === bannerId && getStorageType() === storage && existingBannerInfo.dismissed) {
      block.parentElement.remove();
    } else {
      decorateBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem);
    }
  } else {
    block.textContent = '';
    const existingStorage = getStorageType();
    if (existingStorage) getBannerStore(existingStorage).remove();
    decorateBanner(block, bannerId, storage, headingElem, descriptionElem, ctaElem, bgColorElem);
  }
}
