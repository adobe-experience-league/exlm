// import { getConfig } from "../scripts";

const VIDEO_KEY = 'videos';
const API_DELAY_MS = 1000;
const mpcLanguagesMap = {
  en: 'eng',
  de: 'ger',
  es: 'spa',
  fr: 'fre_fr',
  it: 'ita',
  ja: 'jpn',
  ko: 'kor',
  'pt-br': 'por_br',
  sv: 'eng',
  nl: 'eng',
  'zh-hans': 'chi_hans',
  'zh-hant': 'chi_hant',
};

/**
 * Fetches localized video ID from the API in a non-blocking manner
 * @param {string} videoId - The original video ID
 * @param {string} lang - The language code
 * @returns {Promise<string|null>} Promise that resolves to localized video ID or null
 */
async function fetchLOCVideoId(videoId, lang) {
  const cacheKey = `${VIDEO_KEY}-${videoId}-${lang}`;
  // const { mpcVideoUrl } = getConfig();

  try {
    // Check cache first (synchronous operation)
    if (cacheKey in sessionStorage) {
      const cachedData = JSON.parse(sessionStorage[cacheKey]);
      return cachedData.localizedVideoId;
    }

    // Add 1 second delay before making the API call
    await new Promise((resolve) => {
      setTimeout(resolve, API_DELAY_MS);
    });

    // TODO: Replace Adobe IO URL with {mpcVideoUrl}
    const response = await fetch(
      `https://51837-657fuchsiazebra-test.adobeioruntime.net/api/v1/web/main/videos?videoId=${videoId}&lang=${lang}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    const localizedVideoId = json.data?.localizedvideoId;

    // Cache the result
    const cacheData = {
      localizedVideoId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return localizedVideoId;
  } catch (error) {
    // Remove potentially corrupted cache entry
    sessionStorage.removeItem(cacheKey);
    // eslint-disable-next-line no-console
    console.error('Error fetching localized video ID:', error);

    return null;
  }
}

/**
 * Updates video URL with localized video ID in a non-blocking manner
 * @param {string} url - The original video URL
 * @param {string} lang - The language code
 * @returns {Promise<string>} Promise that resolves to updated video URL
 */
export default async function updateVideoUrl(url, lang) {
  // Early return for invalid URLs
  if (!url || typeof url !== 'string') {
    return url;
  }

  const match = url.match(/\/v\/(\d+)/);
  if (!match) {
    return url;
  }

  const originalId = match[1];

  try {
    // Fetch localized ID asynchronously without blocking
    const localizedId = await fetchLOCVideoId(originalId, lang);

    if (localizedId && localizedId !== originalId) {
      const newUrl = url.replace(`/v/${originalId}`, `/v/${localizedId}`);
      // eslint-disable-next-line no-console
      console.log(`Updated video URL: ${newUrl}`);
      return newUrl;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch localized video ID for ${originalId}:`, error);
  }

  // Fallback: Append language param if localizedId not found
  // This enables the Caption display and Localized Audio for the selected language, if available
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('language')) {
      const languageCode = mpcLanguagesMap[lang] || lang;
      urlObj.searchParams.append('language', languageCode);
    }
    return urlObj.href;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', error);
    return url;
  }
}
