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

export default async function decorate(block) {
  const [image, description, cta, storage, sessionVariable, bgColor] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const storageType = storage?.textContent.trim();
  const sessionValue = sessionVariable?.textContent.trim();

  const currentBanner = window[storageType].getItem('site-wide-banner');
  const previousBanner = window[storageType].getItem('previous-banner');

  // If the banner was dismissed and the authored value has not changed, keep it hidden
  if (currentBanner === 'dismissed' && previousBanner === sessionValue) {
    block.style.display = 'none';
    return;
  }

  // If the authored value changes, update the session variable and show the banner again
  if (sessionValue && previousBanner !== sessionValue) {
    window[storageType].setItem('site-wide-banner', sessionValue);
    window[storageType].setItem('previous-banner', sessionValue);
  }

  description?.classList.add('site-wide-banner-description');
  let bgColorVariable;
  if (bgColor.innerHTML.includes('bg-')) {
    const bgSpectrumColor = bgColor.innerHTML.substr(3);
    bgColorVariable = `var(--${bgSpectrumColor})`;
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
        ${decorateButtons(cta)}
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
      icon.classList.remove('icon-close-black');
      icon.classList.add('icon-close-light');
    } else {
      icon.classList.remove('icon-close-light');
      icon.classList.add('icon-close-black');
    }
  }
  decorateIcons(block);

  // Add close button functionality
  ['.icon-close-black', '.icon-close-light'].forEach((selectedIcon) => {
    const closeIcon = block.querySelector(selectedIcon);
    if (closeIcon && !window.location.href.includes('.html')) {
      closeIcon.addEventListener('click', () => {
        block.style.display = 'none';
        window[storageType].setItem('site-wide-banner', 'dismissed');
      });
    }
  });
}
