import { decorateIcons } from '../../scripts/lib-franklin.js';

function decorateButtons(...buttons) {
  return buttons
    .map((button) => {
      const link = button?.querySelector('a');
      if (link) {
        link.classList.add('button');
        if (link.parentElement.tagName === 'EM') link.classList.add('secondary');
        if (link.parentElement.tagName === 'STRONG') link.classList.add('primary');
        return link.outerHTML;
      }
      return '';
    })
    .join('');
}

// Function to remove previously added keys from the browser storage
function removeStorageKeys() {
  const browserStorage = ['localStorage', 'sessionStorage'];
  browserStorage.forEach((storage) => {
    window[storage].removeItem('hideSiteWideBanner');
  });
}

// Function to hide a sitewideBanner and update the key in the browser storage
function hideSiteWideBanner(block, storage = 'sessionStorage') {
  block.style.display = 'none';
  removeStorageKeys();
  window[storage].setItem('hideSiteWideBanner', 'true');
}

// Function to check browser storage and hide the sitewideBanner if it was previously closed
function isSiteWideBannerHidden(storage = 'sessionStorage') {
  return window[storage].getItem('hideSiteWideBanner') === 'true';
}

export default async function decorate(block) {
  const [image, description, firstCta, storage, bgColor] = [...block.children].map((row) => row.firstElementChild);
  // The `storage` value will be either 'localStorage' or 'sessionStorage',
  // as defined in the `components-models.json` file.
  if (isSiteWideBannerHidden(storage?.textContent)) {
    block.style.display = 'none';
    return;
  }

  description?.classList.add('site-wide-banner-description');
  let bgColorVariable;
  if (bgColor.innerHTML.includes('bg-')) {
    const bgSpectrumColor = bgColor.innerHTML.substr(3); // Remove 'bg-' prefix
    bgColorVariable = `var(--${bgSpectrumColor})`; // Use the CSS variable
  }

  const sitewideBannerDom = document.createRange().createContextualFragment(`
  <div class="site-wide-banner-image">
  ${image ? image.outerHTML : ''}
  </div>
  <div class="site-wide-banner-content-container">
    <div class="site-wide-banner-default-content">
      ${description ? description.outerHTML : ''}
    </div>
    <div class="site-wide-banner-button-container">
      ${decorateButtons(firstCta)}
    </div>
    </div>
    <span class="icon icon-close-black"></span>
  `);

  block.textContent = '';
  block.append(sitewideBannerDom);
  block.style.backgroundColor = bgColorVariable;

  const icon = block.querySelector('.icon');
  if (icon) {
    if (block.classList.contains('dark')) {
      // If dark class is present, change the icon to light
      icon.classList.remove('icon-close-black');
      icon.classList.add('icon-close-light');
    } else {
      // Otherwise default icon
      icon.classList.remove('icon-close-light');
      icon.classList.add('icon-close-black');
    }
  }
  decorateIcons(block);

  // Add close button functionality
  ['.icon-close-black', '.icon-close-light'].forEach((selectedIcon) => {
    const closeIcon = block.querySelector(selectedIcon);
    if (closeIcon && !window.location.href.includes('.html')) {
      closeIcon.addEventListener('click', () => hideSiteWideBanner(block, storage?.textContent));
    }
  });
}
