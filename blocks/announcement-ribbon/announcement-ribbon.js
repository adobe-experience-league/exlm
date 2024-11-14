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

// Function to hide a  ribbon and update session storage
function hideRibbon(block) {
  block.style.display = 'none';
  sessionStorage.setItem(`hideRibbonBlock`, 'true');
}

// Function to check session storage and hide the ribbon if it was previously closed
function isRibbonHidden() {
  return sessionStorage.getItem('hideRibbonBlock') === 'true';
}

export default async function decorate(block) {
  if (isRibbonHidden()) {
    block.style.display = 'none';
    return;
  }
  const [image, heading, description, bgColor, hexcode, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  heading?.classList.add('ribbon-heading');
  description?.classList.add('ribbon-description');
  let bgColorVariable;
  if (bgColor.innerHTML.includes('bg-')) {
    const bgSpectrumColor = bgColor.innerHTML.substr(3); // Remove 'bg-' prefix
    bgColorVariable = `var(--${bgSpectrumColor})`; // Use the CSS variable
  } else {
    bgColorVariable = `#${hexcode.innerHTML}`; // Use the hex code directly
  }

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
      ${decorateButtons(firstCta, secondCta)}
    </div>
    </div>
    <span class="icon icon-close-black"></span>
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
  const closeIcon = block.querySelector('.icon-close-black');
  if (closeIcon && !window.location.href.includes('.html')) {
    closeIcon.addEventListener('click', () => hideRibbon(block));
  }
}
