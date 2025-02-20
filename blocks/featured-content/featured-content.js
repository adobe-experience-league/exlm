import { div } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { fetchAuthorBio } from '../../scripts/utils/author-utils.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Fetches content from the provided link and extracts relevant information from the HTML response.
 * @param {string} link - The URL of the content to fetch.
 * @returns {Promise<Object>} A promise that resolves to an object containing the extracted content information.
 */
export async function getContentReference(link) {
  try {
    const response = await fetch(link);
    const html = await response.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, 'text/html');

    const description = htmlDoc.querySelector('main div p')?.textContent;
    let authorBioPage = htmlDoc.querySelector('meta[name="author-bio-page"]')?.content;

    if (authorBioPage && window.hlx.aemRoot) {
      authorBioPage = authorBioPage
        .split(',')
        .map((authorBioPageLink) => `${authorBioPageLink.trim()}.html`)
        .join(', ');
    }
    let authorDetails = [];
    if (authorBioPage) {
      const authorBioPagesCall = authorBioPage
        .split(',')
        .map((authorLink) => (authorLink ? fetchAuthorBio(authorLink.trim()) : null));
      const authorDetailsResponse = await Promise.all(authorBioPagesCall);
      authorDetails = authorDetailsResponse.filter(Boolean);
    }

    return {
      contentTitle: htmlDoc.title,
      contentDescription: description,
      authorInfo: authorDetails,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return null;
  }
}

/**
 * Builds the featured content block.
 *
 * @param {HTMLElement} contentArray - The element representing the featured content block.
 * @returns {Promise<void>} - A promise that resolves when the featured content is built.
 */
/**
 * Builds the featured content block.
 *
 * @param {HTMLElement} block - The block element.
 * @param {Array} contentArray - The array of content elements.
 * @returns {Promise<void>} - A promise that resolves when the featured content block is built.
 */
async function buildFeaturedContent(block, contentArray) {
  let desc;
  if (contentArray.length === 2) {
    desc = contentArray.shift();
  }
  const cta = contentArray.shift();

  const link = cta.querySelector('a');
  const contentInfo = await getContentReference(link.href);
  const contentDescription = desc.textContent || contentInfo.contentDescription.replace(/^SUMMARY: /, '');
  desc.parentElement.remove();

  const contentDiv = htmlToElement(`
  <div class="description">
    <h2>${contentInfo.contentTitle}</h2>
    <p>${contentDescription}</p>
    <div class="cta">${decorateCustomButtons(cta)}</div>
  </div>
`);
  const authorContainer = div({ class: 'author-container' });
  const authorWrapper = div({ class: 'author-wrapper' });
  const authorHeader = div({ class: 'author-header' });
  authorContainer.appendChild(authorHeader);
  authorContainer.appendChild(authorWrapper);
  const { authorInfo } = contentInfo;
  if (authorInfo.length) {
    const headerTextKey = authorInfo.length > 1 ? 'featuredAuthors' : 'featuredAuthor';
    const headerText = placeholders[headerTextKey] ?? `Featured Author${authorInfo.length > 1 ? 's' : ''}`;
    authorHeader.innerHTML = `<h3>${headerText}</h3>`;
  }
  authorInfo.forEach((author) => {
    const { authorName: name, authorImage: pic, authorTitle, authorSocialLinkURL, authorSocialLinkText } = author;
    const authorDiv = div(
      { class: 'author' },
      div({ class: 'author-image' }, createOptimizedPicture(pic, name, 'eager', [{ width: '100' }])),
    );
    if (authorDiv) {
      const socialDetails = authorSocialLinkURL && authorSocialLinkText;
      const authorBiodata = htmlToElement(`
          <div class="author-details">
            <div class="author-name">${name}</div>
            <div class="author-title">${authorTitle}</div>
            ${socialDetails ? `<a class="author-social" href="${authorSocialLinkURL}">${authorSocialLinkText}</a>` : ''}
          </div>
      `);
      authorDiv.appendChild(authorBiodata);
      authorWrapper.append(authorDiv);
    }
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
      image
        .querySelector('picture')
        .replaceWith(createOptimizedPicture(imageInfo.src, imageInfo.alt, 'eager', [{ width: '720' }]));
      image.append(
        div({ class: 'source-tag' }, isAdobe ? placeholders.articleAdobeTag : placeholders.articleExternalTag),
      );
    }
  }

  buildFeaturedContent(block, props);
}
