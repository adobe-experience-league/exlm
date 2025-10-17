// import { getConfig } from "../scripts";

const VIDEO_KEY = 'videos';
// Languages currently supported for MPC captions
const mpcLanguagesMap = {
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
 * Fetches localized video ID from AIO
 * @param {string} videoId - The original video ID
 * @param {string} lang - The language code (short code, e.g., 'de', 'fr')
 * @returns {Promise<string|null>} - Localized video ID or null if not found
 */
async function fetchLOCVideoId(videoId, lang) {
  const cacheKey = `${VIDEO_KEY}-${videoId}-${lang}`;
  // const { mpcVideoUrl } = getConfig();

  try {
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return parsed.localizedVideoId;
    }

    const response = await fetch(
      `https://51837-657fuchsiazebra-test.adobeioruntime.net/api/v1/web/main/videos?videoId=${videoId}&lang=${lang}`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    const localizedVideoId = json.data?.localizedVideoId;

    sessionStorage.setItem(cacheKey, JSON.stringify({ localizedVideoId, timestamp: Date.now() }));

    return localizedVideoId;
  } catch (error) {
    sessionStorage.removeItem(cacheKey);
    // eslint-disable-next-line
    console.error('Error fetching localized video ID:', error);
    return null;
  }
}

/**
 * Updates the video URL with a localized video ID (if available)
 * @param {string} url - The original video URL (e.g., https://video.host/v/16419)
 * @param {string} lang - The target language (e.g., 'de')
 * @returns {Promise<string>} - Updated video URL with localized ID or same URL
 */
export default async function updateVideoUrl(url, lang) {
  if (!url || typeof url !== 'string') return url;

  const match = url.match(/\/v\/(\d+)/);
  if (!match) return url;

  const originalId = match[1];

  try {
    const localizedId = await fetchLOCVideoId(originalId, lang);

    if (localizedId && localizedId !== originalId) {
      return url.replace(`/v/${originalId}`, `/v/${localizedId}`);
    }
  } catch (error) {
    // eslint-disable-next-line
    console.warn(`Failed to fetch localized video ID for ${originalId}:`, error);
  }

  // Fallback - add language param for captions and audio
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('language')) {
      const languageCode = mpcLanguagesMap[lang] || lang;
      urlObj.searchParams.append('language', languageCode);
    }
    return urlObj.href;
  } catch (error) {
    // eslint-disable-next-line
    console.error('Error parsing URL:', error);
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
