import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';
import { COVEO_DATE_OPTIONS } from './browse-cards-constants.js';
import { getConfig } from '../scripts.js';
import { getDateRange } from '../utils/date-utils.js';

const domParser = new DOMParser();
const { cdnOrigin } = getConfig();

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
  if (contentType === 'Playlist') {
    const courseThumbnail = getMetadata('og:image', doc);
    return courseThumbnail || '';
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

  const coveoSolution = getMetadata('coveo-solution', doc);
  let solutions = getMetadata('solution', doc)
    .split(',')
    .map((s) => s.trim());
  if (solutions.length < 2 && coveoSolution) {
    solutions = coveoSolution.split(';').map((s) => s.trim());
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

/**
 * Extracts capabilities from a comma-separated string and populates relevant arrays.
 * Existence of variables declared on top: capabilities, productKey, featureKey, products, versions, features.
 */
export const extractCapability = (capabilities) => {
  const products = [];
  const features = [];
  const versions = [];
  const productKey = 'exl:solution';
  const featureKey = 'exl:feature';

  const items = capabilities.split(',');
  items.forEach((item) => {
    const [type, productBase64, subsetBase64] = item.split('/');
    if (productBase64) {
      const decryptedProduct = atob(productBase64);
      if (!products.includes(decryptedProduct)) {
        products.push(decryptedProduct);
      }
    }
    if (type === productKey) {
      if (subsetBase64) versions.push(atob(subsetBase64));
    } else if (type === featureKey) {
      if (subsetBase64) features.push(atob(subsetBase64));
    }
  });

  return { products, features, versions };
};

/**
 * Removes duplicate items from an array of products/solutions (with sub-solutions)
 * @returns {Array} - Array of unique products.
 */
export const removeProductDuplicates = (products) => {
  const filteredProducts = [];
  for (let outerIndex = 0; outerIndex < products.length; outerIndex += 1) {
    const currentItem = products[outerIndex];
    let isDuplicate = false;
    for (let innerIndex = 0; innerIndex < products.length; innerIndex += 1) {
      if (outerIndex !== innerIndex && products[innerIndex].startsWith(currentItem)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      filteredProducts.push(products[outerIndex]);
    }
  }
  return filteredProducts;
};

/**
 * Constructs date criteria based on a list of date options.
 * @returns {Array} Array of date criteria.
 */
export const createDateCriteria = (dateList) => {
  const dateCriteria = [];
  const dateOptions = {
    [COVEO_DATE_OPTIONS.WITHIN_ONE_MONTH]: { monthsAgo: 1 },
    [COVEO_DATE_OPTIONS.WITHIN_SIX_MONTHS]: { monthsAgo: 6 },
    [COVEO_DATE_OPTIONS.WITHIN_ONE_YEAR]: { yearsAgo: 1 },
    [COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO]: { yearsAgo: 50 }, // Assuming 50 years ago as the "more than one year ago" option
  };
  dateList.forEach((date) => {
    if (dateOptions[date]) {
      const { monthsAgo, yearsAgo } = dateOptions[date];
      const currentDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (monthsAgo || 0));
      startDate.setFullYear(startDate.getFullYear() - (yearsAgo || 0));
      if (date === COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO) {
        // For "MORE_THAN_ONE_YEAR_AGO", adjust startDate by adding one more year
        currentDate.setFullYear(currentDate.getFullYear() - 1);
      }
      dateCriteria.push(getDateRange(startDate, currentDate));
    }
  });
  return dateCriteria;
};

// Function to convert a string to title case
export const formatTitleCase = (str) => str.replace(/[-\s]/g, '').replace(/\b\w/g, (match) => match.toUpperCase());
