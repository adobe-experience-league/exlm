import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { MD5 } from '../../scripts/crypto.js';
import { ANNOUNCEMENT_RIBBON_STORAGE_KEY } from '../../scripts/scripts.js';

const ribbonStore = {
  /**
   * @param {string} pagePath
   * @param {string} id
   */
  set: (pagePath, id) => {
    const existingStore = JSON.parse(localStorage.getItem(ANNOUNCEMENT_RIBBON_STORAGE_KEY)) || [];
    const updatedStore = [...existingStore, { pagePath, id }];
    localStorage.setItem(ANNOUNCEMENT_RIBBON_STORAGE_KEY, JSON.stringify(updatedStore));
  },
  /**
   * Retrieves the entry matching the page path and ribbon id from the store.
   * @param {string} pagePath
   * @returns {{pagePath: string, id: string} | null}
   */
  get: (pagePath) => {
    const storedData = localStorage.getItem(ANNOUNCEMENT_RIBBON_STORAGE_KEY);
    if (storedData) {
      const entries = JSON.parse(storedData);
      return entries.filter((entry) => entry.pagePath === pagePath);
    }
    return [];
  },
};

// Function to hide a ribbon and update the key in the browser storage
function hideRibbon(block, pagePath, ribbonId) {
  block.parentElement.style.display = 'none';
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

  if (dismissable) {
    const icon = block.querySelector('.icon');
    if (icon) {
      const isDark = block.classList.contains('dark');
      icon.classList.toggle('icon-close-light', isDark);
      icon.classList.toggle('icon-close-black', !isDark);
    }

    // Add close button functionality
    ['.icon-close-black', '.icon-close-light'].forEach((selectedIcon) => {
      const closeIcon = block.querySelector(selectedIcon);
      if (closeIcon && !window.location.href.includes('.html')) {
        closeIcon.addEventListener('click', () => hideRibbon(block, pagePath, ribbonId));
      }
    });
  }
  decorateIcons(block);
}

export default async function decorate(block) {
  const [image, heading, description, hexcode, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const dismissable = block.classList.contains('dismissable');
  let pagePath = '';
  let ribbonId = '';
  let isDismissed = false;
  if (dismissable) {
    const firstCtaData = extractAnchorData(firstCta);
    const secondCtaData = extractAnchorData(secondCta);
    pagePath = window.location.pathname;
    ribbonId = generateHash(
      [heading, description, firstCtaData.text, firstCtaData.href, secondCtaData.text, secondCtaData.href]
        .map((el) => {
          if (typeof el === 'string') return el.trim();
          if (el?.textContent?.trim()) return el.textContent.trim();
          return '';
        })
        .filter(Boolean)
        .join('|'),
    );
    if (ribbonId) {
      block.parentElement?.setAttribute('data-id', ribbonId);
    }
    isDismissed = ribbonStore.get(pagePath)?.some((entry) => entry.id === ribbonId);
  }
  if (dismissable && isDismissed) {
    block.parentElement.style.display = 'none';
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
