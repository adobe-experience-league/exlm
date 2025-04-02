import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { getPathDetails } from '../../scripts/scripts.js';
import { MD5 } from '../../scripts/crypto.js';

const STORAGE_KEY = 'hide-ribbon-block';
const ribbonStore = {
  // TODO: update the remove function
  /**
   * @param {string} pagePath
   * @param {string} id
   * @param {boolean} dismissed
   */
  set: (pagePath, id, dismissed) => {
    const existingStore = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const updatedStore = [...existingStore, { pagePath, id, dismissed }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
  },
  /**
   * Retrieves the entry matching the page path and ribbon id from the store.
   * @param {string} pagePath
   * @returns {{pagePath: string, id: string, dismissed: boolean} | null}
   */
  get: (pagePath) => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const entries = JSON.parse(storedData);
      return entries.filter((entry) => entry.pagePath === pagePath);
    }
    return [];
  },
};

// Function to hide a ribbon and update the key in the browser storage
function hideRibbon(block, pagePath, ribbonId) {
  block.parentElement.remove();
  ribbonStore.set(pagePath, ribbonId, true);
}

function generateHash(content) {
  if (typeof content !== 'string') return '';
  return MD5(content);
}

function extractAnchorData(cta) {
  const anchor = cta?.querySelector('p > a');
  return anchor
    ? {
        href: anchor.getAttribute('href'),
        text: anchor.textContent.trim(),
      }
    : { href: '', text: '' };
}

async function decorateRibbon({
  block,
  image,
  heading,
  description,
  pagePath,
  ribbonId,
  dismissable,
  hexcode,
  firstCta,
  secondCta,
}) {
  if (block.classList.contains('internal-banner')) {
    const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
    let displayBlock = false;

    if (UEAuthorMode) {
      displayBlock = true;
    } else {
      const isSignedIn = await isSignedInUser();
      if (isSignedIn) {
        try {
          const profile = await defaultProfileClient.getMergedProfile();
          displayBlock = profile?.email?.includes('@adobe.com');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch profile:', error);
        }
      }
    }

    if (!displayBlock) {
      block.parentElement.remove();
    }
  }

  heading?.classList.add('ribbon-heading');
  description?.classList.add('ribbon-description');
  let bgColorVariable;
  const classes = block.classList;
  const backgroundColorClass = [...classes].find((cls) => cls.startsWith('bg-'));
  if (backgroundColorClass) {
    const bgSpectrumColor = backgroundColorClass.substr(3); // Remove 'bg-' prefix
    bgColorVariable = `var(--${bgSpectrumColor})`; // Use the CSS variable
  } else {
    bgColorVariable = `#${hexcode.innerHTML}`; // Use the hex code directly
  }

  const dismissButton = `<span class="icon icon-close-black"></span>`;

  const ribbonDom = document.createRange().createContextualFragment(`
  <div class="ribbon-image">
  ${image ? image.outerHTML : ''}
  </div>
  <div class="ribbon-content-container">
    <div class="ribbon-default-content">
      ${heading ? heading.outerHTML : ''}
      ${description ? description.outerHTML : ''}
    </div>
    <div class="ribbon-button-container">
      ${decorateCustomButtons(firstCta, secondCta)}
    </div>
    </div>
    ${dismissable ? dismissButton : ''}
  `);

  block.textContent = '';
  block.append(ribbonDom);
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
      closeIcon.addEventListener('click', () => hideRibbon(block, pagePath, ribbonId));
    }
  });
}

export default async function decorate(block) {
  const [image, heading, description, hexcode, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const firstCtaData = extractAnchorData(firstCta);
  const secondCtaData = extractAnchorData(secondCta);

  const { lang } = getPathDetails();
  const dismissable = block.classList.contains('dismissable');
  const url = window.location.href;
  const pagePath = url.includes(`/${lang}/`) ? `/${url.split(`/${lang}/`)[1]}` : '';
  const ribbonComponents = [
    heading,
    description,
    firstCtaData.text,
    firstCtaData.href,
    secondCtaData.text,
    secondCtaData.href,
  ]
    .filter(Boolean)
    .map((el) => el?.textContent?.trim() || el)
    .join(' ');
  const ribbonId = generateHash(ribbonComponents);
  const ribbonStates = ribbonStore.get(pagePath);
  const isDismissed = ribbonStates?.some((entry) => entry.id === ribbonId && entry.dismissed);

  if (dismissable && isDismissed) {
    block.remove(); // remove the block section if any matching entry was dismissed
  } else {
    decorateRibbon({
      block,
      image,
      heading,
      description,
      pagePath,
      ribbonId,
      dismissable,
      hexcode,
      firstCta,
      secondCta,
    });
  }
}
