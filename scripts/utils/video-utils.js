import { getConfig } from '../scripts.js';

/**
 * Languages currently supported for MPC videos
 * Maps language codes to MPC caption language identifiers
 */
const MPC_CAPTION_LANG_MAP = {
  en: 'eng',
  de: 'ger',
  es: 'spa',
  fr: 'fre_fr',
  it: 'ita',
  ja: 'jpn',
  ko: 'kor',
  'pt-br': 'por_br',
  sv: 'swe',
  nl: 'dut',
  'zh-hans': 'chi_hans',
  'zh-hant': 'chi_hant',
};

/**
 * Language to locale mapping for finding localized videos
 * Maps language codes to full locale identifiers
 */
const MPC_LANGUAGES_MAP = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'pt-br': 'pt-BR',
  sv: 'sv-SE',
  nl: 'nl-NL',
  'zh-hans': 'zh-CN',
  'zh-hant': 'zh-TW',
};

/**
 * Video collection constants
 */
const VIDEO_COLLECTION_CONSTANTS = {
  LOCALIZATION: 'localization',
  TRANSLATED: 'translated',
};

/**
 * Fetches video collections data from Adobe TV API
 * @param {string|number} videoId - The video ID to fetch collections for
 * @returns {Promise<Object|null>} - Collections data or null if error occurs
 */
export async function fetchVideoCollections(videoId) {
  if (!videoId) {
    // eslint-disable-next-line no-console
    console.warn('Video ID is required for fetching collections');
    return null;
  }
  const { mpcApiBase } = getConfig();
  const mpcApi = `${mpcApiBase}/${videoId}/collections`;

  try {
    const response = await fetch(mpcApi, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching video collections for ID ${videoId}:`, error);
    return null;
  }
}

/**
 * Checks if a video has captions for the target locale
 * @param {Object} video - Video object with availableCaptions
 * @param {string} targetLocale - Target locale to check for
 * @returns {boolean} - True if video has captions for target locale
 */
function hasTargetLanguageCaptions(video, targetLocale) {
  return video?.availableCaptions?.some((caption) => caption.locale === targetLocale) || false;
}

/**
 * Finds a translated video for the target locale
 * @param {Array} videos - Array of video objects
 * @param {string} targetLocale - Target locale to find
 * @returns {Object|null} - Translated video object or null if not found
 */
function findTranslatedVideo(videos, targetLocale) {
  return (
    videos.find(
      (video) =>
        video.videoType === VIDEO_COLLECTION_CONSTANTS.TRANSLATED && hasTargetLanguageCaptions(video, targetLocale),
    ) || null
  );
}

/**
 * Finds localized video ID from collections data based on language
 * @param {Object} collectionsData - The collections data from API
 * @param {string} lang - The target language (e.g., 'de', 'fr')
 * @returns {Object} - Object with localizedId and hasTargetLanguage properties
 */
function findLocalizedVideoId(collectionsData, lang) {
  const targetLocale = MPC_LANGUAGES_MAP[lang];
  const localizationCollection = collectionsData.collections.find(
    (collection) => collection.collectionType === VIDEO_COLLECTION_CONSTANTS.LOCALIZATION,
  );
  // Early return for invalid input
  if (!collectionsData?.collections?.length || !targetLocale || !localizationCollection?.videos?.length) {
    return { localizedId: null, hasTargetLanguage: false };
  }

  const { videos } = localizationCollection;
  const hasMultipleVideos = videos.length > 1;

  if (hasMultipleVideos) {
    // Find video with matching locale (separate localized video)
    const localizedVideo = findTranslatedVideo(videos, targetLocale);

    return {
      localizedId: localizedVideo?.videoHumanId || null,
      hasTargetLanguage: !!localizedVideo,
    };
  }

  // Single video with multiple captions - check if target language is available
  const [sourceVideo] = videos;
  const hasTargetLanguage = hasTargetLanguageCaptions(sourceVideo, targetLocale);

  return {
    localizedId: null, // Use original ID with language param
    hasTargetLanguage,
  };
}

/**
 * Extracts video ID from URL
 * @param {string} url - Video URL to extract ID from
 * @returns {string|null} - Extracted video ID or null if not found
 */
function extractVideoId(url) {
  const match = url.match(/\/v\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Adds language parameter to URL
 * @param {string} url - Original URL
 * @param {string} lang - Language code to add
 * @returns {string} - URL with language parameter or original URL if error
 */
function addLanguageParameter(url, lang) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('language')) {
      const languageCode = MPC_CAPTION_LANG_MAP[lang] || lang;
      urlObj.searchParams.append('language', languageCode);
    }
    return urlObj.href;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', error);
    return url;
  }
}

/**
 * Updates the video URL with a localized video ID (if available)
 * @param {string} url - The original video URL (e.g., https://video.host/v/16419)
 * @param {string} lang - The target language (e.g., 'de')
 * @returns {Promise<string>} - Updated video URL with localized ID or same URL with language param
 */
export default async function updateVideoUrl(url, lang) {
  if (!url || typeof url !== 'string' || !lang) {
    return url;
  }

  const originalId = extractVideoId(url);
  if (!originalId) {
    return url;
  }

  try {
    const collectionsData = await fetchVideoCollections(originalId);

    if (!collectionsData) {
      return url;
    }
    const { localizedId, hasTargetLanguage } = findLocalizedVideoId(collectionsData, lang);

    // Replace with localized video ID (separate translated video)
    if (localizedId && localizedId !== parseInt(originalId, 10)) {
      return url.replace(`/v/${originalId}`, `/v/${localizedId}`);
    }

    // Single video with multiple captions - add language param if target language is available
    if (hasTargetLanguage) {
      return addLanguageParameter(url, lang);
    }

    // If no target language available, return original URL
    return url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch localized video ID for ${originalId}:`, error);
    // In case of any error, return original URL
    return url;
  }
}

/**
 * Gets localized video URL based on current language
 * @param {string} url - The original video URL
 * @param {string} lang - The current language (defaults to 'en')
 * @returns {Promise<string>} - Localized video URL or original URL for English
 */
export async function getLocalizedVideoUrl(url, lang = 'en') {
  return lang === 'en' ? url : updateVideoUrl(url, lang);
}
