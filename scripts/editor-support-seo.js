import { decorateIcons, loadCSS } from './lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/styles/ue-styles.css`);
/**
 * Displays SEO warnings for specific tags.
 */
export default function renderSEOWarnings() {
  const EXCLUDED_PATHS = ['/global-fragments/', '/tools/', '/microsites/'];
  const section = document.querySelector('main[data-aue-filter="main"] > div');

  if (EXCLUDED_PATHS.some((path) => window.location.pathname.includes(path)) || !section?.querySelector('div')) return;

  const tags = ['h1'];
  let warningBanner = document.querySelector('.ue-warning-banner');
  const messages = [];

  tags.forEach((tag) => {
    const elements = document.querySelectorAll(`main ${tag}`);
    const count = elements.length;

    if (count === 0) {
      messages.push(
        `Warning: This page does not have a ${tag.toUpperCase()} element. Please include exactly one ${tag.toUpperCase()} tag.`,
      );
    } else if (count > 1) {
      messages.push(
        `Warning: This page has multiple ${tag.toUpperCase()} tags. Please update the page to have only one ${tag.toUpperCase()} tag.`,
      );
    }
  });

  if (messages.length === 0) {
    if (warningBanner) warningBanner.remove();
    return;
  }

  if (!warningBanner) {
    warningBanner = document.createElement('div');
    warningBanner.classList.add('ue-warning-banner');
    document.body.prepend(warningBanner);
  } else {
    warningBanner.innerHTML = '';
  }

  messages.forEach((msg) => {
    const messageLine = document.createElement('div');
    messageLine.classList.add('ue-warning-line');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon icon-warning-light';
    messageLine.appendChild(iconSpan);

    const textNode = document.createTextNode(msg);
    messageLine.appendChild(textNode);

    warningBanner.appendChild(messageLine);
  });

  decorateIcons(warningBanner);
}
