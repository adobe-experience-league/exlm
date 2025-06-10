import { decorateIcons, loadCSS } from './lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/styles/ue-styles.css`);
/**
 * Displays SEO warnings for specific tags.
 */
export default function renderSEOWarnings() {
  const tags = ['h1'];
  let warningBanner = document.querySelector('.ue-warning-banner');
  const messages = [];

  tags.forEach((tag) => {
    const headerTagElements = document.querySelectorAll(`main ${tag}`);
    let totalCount = headerTagElements?.length;

    // For article-marquee, Headings are rendered as text instead of tag
    const articleMarqueeDivs = document.querySelectorAll('.article-marquee div');
    articleMarqueeDivs?.forEach((el) => {
      if (el.textContent.trim().toLowerCase() === tag.toLowerCase()) {
        totalCount += 1;
      }
    });

    if (totalCount === 0) {
      messages.push(
        `Warning: This page does not have a ${tag.toUpperCase()} element. Please include exactly one ${tag.toUpperCase()} tag.`,
      );
    } else if (totalCount > 1) {
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
