import { a, div, h2, p } from "../../scripts/dom-helpers.js";
import { createOptimizedPicture } from "../../scripts/lib-franklin.js";
import { fetchLanguagePlaceholders } from "../../scripts/scripts.js";

let placeholders = {};

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
      const title = htmlDoc.title;
      const description = htmlDoc.querySelector('main div p')?.textContent;
      const authorBio = htmlDoc.querySelectorAll('.author-bio');

      return {
        contentTitle: title,
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
 * @param {HTMLElement} contentElem - The element representing the featured content block.
 * @returns {Promise<void>} - A promise that resolves when the featured content is built.
 */
async function buildFeaturedContent(contentElem, isAdobe) {
  const link = contentElem.querySelectorAll('a');
  const desc = contentElem.querySelector('div p:nth-child(2)');
  const contentInfo = await getContentReference(link[0].href);
  const company = isAdobe ? 'adobe' : 'external';
  const contentDescription = desc ? desc.textContent : contentInfo.contentDescription.replace(/^SUMMARY: /, '');
  contentElem.innerHTML = '';

  const contentDiv = div({ class: 'description' },
    h2(contentInfo.contentTitle),
    p(contentDescription),
    div({ class: 'button-container' },
      a({ href: link[0].href, 'aria-label': 'Read Article', class: 'button secondary' }, 'Read Article'),
    ),
  );
  const authorContainer = div({ class: 'author-container' });

  contentInfo.authorInfo.forEach((author) => {
    const authorName = author.querySelector('div:nth-child(2) > div')?.innerText;
    const authorPicture = author.querySelector('div:first-child picture img')?.src;
    const authorDiv = div({ class: 'author' },
      div({class: 'author-image'},
        createOptimizedPicture(authorPicture, authorName, 'eager', [{ width: '100' }]),
        div({class: `company-dot ${company}`})
      ),
      div({class: 'author-details'}, div( authorName)),
    );

    if (authorDiv) authorContainer.append(authorDiv);
  });
  contentElem.replaceWith(contentDiv);
  contentDiv.parentNode.nextSibling.replaceWith(authorContainer);
}

/**
 * Decorates a block with featured content.
 *
 * @param {HTMLElement} block - The block element to decorate.
 * @returns {Promise<void>} - A promise that resolves when the decoration is complete.
 */
export default async function decorate(block) {
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  const [image, content] = block.querySelectorAll(':scope div > div');
  const isAdobe = block.getAttribute('class').includes('adobe');
  image.classList.add('featured-content-image');
  const imageInfo = image.querySelector('picture img');
  image.querySelector('picture').replaceWith(createOptimizedPicture(imageInfo.src, imageInfo.alt, 'eager', [{ width: '327' }]));
  image.append(div({ class: 'source-tag' }, isAdobe ? placeholders.article-adobe-tag : placeholders.article-external-tag));
  if (content.children?.length >= 1) {
    buildFeaturedContent(content, isAdobe);
  }
}
