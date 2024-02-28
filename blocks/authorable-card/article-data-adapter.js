import { rewriteDocsPath } from '../../scripts/scripts.js';
import { exlmCDNUrl } from '../../scripts/urls.js';

/**
 * Converts a string to title case.
 * @param {string} str - The input string.
 * @returns {string} The string in title case.
 */
const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

function createThumbnailURL(result) {
  if (result.contentType === 'Course') {
    const thumbnail = result['Full Meta']?.split('\ncourse-thumbnail: ')[1]?.split('\n')[0];
    return thumbnail ? `${exlmCDNUrl}/thumb/${thumbnail.split('thumb/')[1]}` : '';
  }

  if (result.contentType === 'Tutorial') {
    const parser = new DOMParser();
    const urlString = parser
      .parseFromString(result['Full Body'], 'text/html')
      ?.querySelector('iframe')
      ?.getAttribute('src');
    const videoUrl = urlString ? new URL(urlString) : null;
    const videoId = videoUrl?.pathname?.split('/v/')[1]?.split('/')[0];
    return videoId ? `https://video.tv.adobe.com/v/${videoId}?format=jpeg` : '';
  }
  return '';
}

export default async function mapResultToCardsData(result, placeholders) {
  return {
    id: result.id,
    contentType: result.contentType,
    type: result.contentType,
    badgeTitle: result.contentType,
    thumbnail: createThumbnailURL(result),
    product: result?.Solution && (Array.isArray(result.Solution) ? result.Solution : result.Solution.split(/,\s*/)),
    title: result.Title,
    description: result.Description,
    tags: result.Tags,
    copyLink: result.URL,
    bookmarkLink: '',
    viewLink: rewriteDocsPath(result.URL),
    viewLinkText: placeholders[`browseCard${convertToTitleCase(result?.contentType)}ViewLabel`]
      ? placeholders[`browseCard${convertToTitleCase(result?.contentType)}ViewLabel`]
      : `View ${result?.contentType}`,
  };
}
