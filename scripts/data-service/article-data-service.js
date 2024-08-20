import { getConfig, getPathDetails } from '../scripts.js';

const { articleUrl } = getConfig();

/**
 * Fetch Article data fromcontentTypeD
 * @param {string} id - ID of the content source
 * @returns {Promise<object>} - Promise that resolves to the data results
 */
export async function fetchArticleByID(id) {
  try {
    const { lang } = getPathDetails();
    const url = new URL(articleUrl);
    url.pathname = `${url.pathname}/${id}`;
    url.searchParams.set('lang', lang);
    const response = await fetch(url);
    const json = await response.json();
    return json.data;
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}

/**
 * Extract ID of the page from page content
 * @param {string} pageContent - content of the page in string
 * @returns {string} - Id of the page
 */
function extractIdFromPage(pageContent) {
  return pageContent.match(/<meta name="id" content="(.*)">/)[1];
}

/**
 * Extract contentType of the page from page content
 * @param {string} pageContent - content of the page in string
 * @returns {string} - contentType of the page
 */
function extractContentTypeFromPage(pageContent) {
  // return this.pageContent.match(/<meta name="coveo-content-type" content="(.*)">/)[1];
  return pageContent.match(/<meta name="coveo-content-type" content="(.*)">/)[1];
}

/**
 * Fetch article data from url
 * @param {string} url - Url of the page to fetch the article data from
 * @returns {Promise<object>} - Promise the resolves to the data results
 */

async function fetchArticleByURL(url) {
  try {
    const response = await fetch(url);
    const pageContent = await response.text();
    const id = extractIdFromPage(pageContent);
    const data = await fetchArticleByID(id);
    data.id = id;
    data.contentType = extractContentTypeFromPage(pageContent);
    return data;
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}

export default async function handleArticleDataService(url) {
  const cardData = await fetchArticleByURL(url);
  return cardData;
}
