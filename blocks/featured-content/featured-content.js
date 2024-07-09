import { div, h2, p } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { fetchAuthorBio, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';

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
  try {
    const response = await fetch(link);
    const html = await response.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, 'text/html');

    const description = htmlDoc.querySelector('main div p')?.textContent;
    let authorBioPage = htmlDoc.querySelector('meta[name="author-bio-page"]')?.content;

    if (authorBioPage && window.hlx.aemRoot) {
      authorBioPage = `${authorBioPage}.html`;
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
 * @param {boolean} isAdobe - Indicates whether the content is from Adobe or external.
 * @returns {Promise<void>} - A promise that resolves when the featured content block is built.
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
    div({ class: 'cta' }, decorateButton(cta)),
  );
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
      div(
        { class: 'author-image' },
        createOptimizedPicture(pic, name, 'eager', [{ width: '100' }]),
        div({ class: `company-dot ${company}` }),
      ),
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
        .replaceWith(createOptimizedPicture(imageInfo.src, imageInfo.alt, 'eager', [{ width: '327' }]));
      image.append(
        div({ class: 'source-tag' }, isAdobe ? placeholders.articleAdobeTag : placeholders.articleExternalTag),
      );
    }
  }

  buildFeaturedContent(block, props, isAdobe);
}
