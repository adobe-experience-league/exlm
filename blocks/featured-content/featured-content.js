import { div, h2, p } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export function decorateButton(button) {
  const link = button.querySelector('a');
  if (link) {
    link.classList.add('button');
    if (link.parentElement.tagName === 'EM') {
      link.classList.add('secondary');
    } else if (link.parentElement.tagName === 'STRONG') {
      link.classList.add('primary');
    }
    return link;
  }
  return '';
}

/**
 * Fetches content from the provided link and extracts relevant information from the HTML response.
 * @param {string} link - The URL of the content to fetch.
 * @returns {Promise<Object>} A promise that resolves to an object containing the extracted content information.
 */
export async function getContentReference(link) {
  return fetch(link)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const description = htmlDoc.querySelector('main div p')?.textContent;
      const authorBio = htmlDoc.querySelectorAll('.author-summary-grid');

      return {
        contentTitle: htmlDoc.title,
        contentDescription: description,
        authorInfo: authorBio,
      };
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    });
}

/**
 * Builds the featured content block.
 *
 * @param {HTMLElement} contentArray - The element representing the featured content block.
 * @returns {Promise<void>} - A promise that resolves when the featured content is built.
 */
async function buildFeaturedContent(block, contentArray, isAdobe) {
  let desc;
  if (contentArray.length === 2) {
    desc = contentArray.shift();
  }
  const cta = contentArray.shift();

  const link = cta.querySelector('a');
  const contentInfo = await getContentReference(link.href);
  const company = isAdobe ? 'adobe' : 'external';
  const contentDescription = desc.textContent || contentInfo.contentDescription.replace(/^SUMMARY: /, '');
  desc.parentElement.remove();

  const contentDiv = div(
    { class: 'description' },
    h2(contentInfo.contentTitle),
    p(contentDescription),
    div(
      { class: 'cta' },
      decorateButton(cta),
    ),
  );
  const authorContainer = div({ class: 'author-container' });

  contentInfo.authorInfo.forEach((author) => {
    const authorName = author.querySelector('div:nth-child(2) > div')?.innerText;
    const authorPicture = author.querySelector('div:first-child picture img')?.src;
    const authorDiv = div(
      { class: 'author' },
      div(
        { class: 'author-image' },
        createOptimizedPicture(authorPicture, authorName, 'eager', [{ width: '100' }]),
        div({ class: `company-dot ${company}` }),
      ),
      div({ class: 'author-details' }, div(authorName)),
    );
    if (authorDiv) authorContainer.append(authorDiv);
  });
  cta.replaceWith(contentDiv);
  block.append(authorContainer);
}

/**
 * Decorates a block with featured content.
 *
 * @param {HTMLElement} block - The block element to decorate.
 * @returns {Promise<void>} - A promise that resolves when the decoration is complete.
 */
export default async function decorate(block) {
  const props = Array.from(block.querySelectorAll(':scope > div > div'));
  const isAdobe = block.className.includes('adobe');
  const image = props.shift();

  if (image) {
    image.classList.add('featured-content-image');
    const imageInfo = image.querySelector('picture img');
    if (imageInfo) {
      image.querySelector('picture').replaceWith(
        createOptimizedPicture(imageInfo.src, imageInfo.alt, 'eager', [{ width: '327' }])
      );
      image.append(
        div({ class: 'source-tag' }, isAdobe ? placeholders.articleAdobeTag : placeholders.articleExternalTag)
      );
    }
  }

  buildFeaturedContent(block, props, isAdobe);
}
