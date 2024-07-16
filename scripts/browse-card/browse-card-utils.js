import { getConfig } from '../scripts.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';

const domParser = new DOMParser();
const { prodAssetsCdnOrigin, cdnOrigin } = getConfig();

/**
 * Converts a string to title case.
 * @param {string} str - The input string.
 * @returns {string} The string in title case.
 */
export const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

function createThumbnailURL(doc, contentType) {
  if (contentType === 'Course') {
    const courseThumbnail = getMetadata('course-thumbnail', doc);
    return courseThumbnail ? `${prodAssetsCdnOrigin}/thumb/${courseThumbnail.split('thumb/')[1]}` : '';
  }

  if (contentType === 'Tutorial') {
    let urlString = doc?.querySelector('iframe')?.getAttribute('src');
    if (!urlString) {
      urlString = doc.querySelector('[href*="tv.adobe.com"]')?.getAttribute('href');
    }
    const videoUrl = urlString ? new URL(urlString) : null;
    const videoId = videoUrl?.pathname?.split('/v/')[1]?.split('/')[0];
    return videoId ? `https://video.tv.adobe.com/v/${videoId}?format=jpeg` : '';
  }
  return '';
}

/**
 * Create article card data for the given article path.
 * @param {string} articlePath
 * @param {Object} placeholders
 * @returns
 */
export const getCardData = async (articlePath, placeholders) => {
  let response = '';
  try {
    response = await fetch(articlePath.toString());
    if (!response.ok) {
      return undefined;
    }
  } catch (err) {
    return undefined;
  }
  const html = await response.text();
  const doc = domParser.parseFromString(html, 'text/html');
  let fullURL = new URL(articlePath, window.location.origin).href;
  if (window.hlx.aemRoot || window.location.href.includes('.html')) {
    if (fullURL.includes('/docs/')) {
      fullURL = `${cdnOrigin}${articlePath.replace(`${window.hlx.codeBasePath}`, '')}`;
    } else {
      const nonDocPath = new URL(
        articlePath.replace(window.hlx.codeBasePath, window.hlx.aemRoot),
        window.location.origin,
      ).href;
      fullURL = `${nonDocPath}.html`;
    }
  }

  let type = getMetadata('coveo-content-type', doc);
  if (!type) {
    type = getMetadata('type', doc);
  }

  let solutions = getMetadata('solutions', doc)
    .split(',')
    .map((s) => s.trim());

  if (solutions.length < 2) {
    solutions = getMetadata('coveo-solution', doc)
      .split(';')
      .map((s) => s.trim());
  }

  return {
    id: getMetadata('id', doc),
    title: doc.querySelector('title').textContent.split('|')[0].trim(),
    description: getMetadata('description', doc),
    type,
    contentType: type,
    badgeTitle: type ? CONTENT_TYPES[type.toUpperCase()]?.LABEL : '',
    thumbnail: createThumbnailURL(doc, type) || '',
    product: solutions,
    authorInfo: {
      name: getMetadata('author-name', doc)
        .split(',')
        .map((name) => name.trim()),
      type: [getMetadata('author-type', doc)],
    },
    tags: [],
    copyLink: fullURL,
    bookmarkLink: '',
    viewLink: fullURL,
    viewLinkText: placeholders[`browseCard${convertToTitleCase(type)}ViewLabel`]
      ? placeholders[`browseCard${convertToTitleCase(type)}ViewLabel`]
      : `View ${type}`,
  };
};
