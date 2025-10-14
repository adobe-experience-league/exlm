// import { getConfig } from "../scripts";

const VIDEO_KEY = 'videos';
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

async function fetchLOCVideoId(videoId, lang) {
  const cacheKey = `${VIDEO_KEY}-${videoId}-${lang}`;
  // const { mpcVideoUrl } = getConfig();
  try {
    if (cacheKey in sessionStorage) {
      const cachedData = JSON.parse(sessionStorage[cacheKey]);
      return cachedData.localizedVideoId;
    }
    // TODO: Replace Adobe IO URL with {mpcVideoUrl}
    const response = await fetch(
      `https://51837-657fuchsiazebra-test.adobeioruntime.net/api/v1/web/main/videos?videoId=${videoId}&lang=${lang}`,
    );
    const json = await response.json();
    const localizedVideoId = json.data?.localizedvideoId;

    const cacheData = {
      localizedVideoId,
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return localizedVideoId;
  } catch (error) {
    sessionStorage.removeItem(cacheKey);
    /* eslint-disable no-console */
    console.error('Error fetching localized video ID', error);
    return null;
  }
}

export default async function updateVideoUrl(url, lang) {
  const match = url?.match(/\/v\/(\d+)/);
  if (!match) return url;

  const originalId = match[1];
  const localizedId = await fetchLOCVideoId(originalId, lang);

  if (localizedId && localizedId !== originalId) {
    const newUrl = url.replace(`/v/${originalId}`, `/v/${localizedId}`);
    // eslint-disable-next-line no-console
    console.log(`Updated video URL: ${newUrl}`);
    return newUrl;
  }

  // Append language param if localizedId not found
  // This enables the Caption display and Localized Audio for the selected language, if available
  const urlObj = new URL(url);
  if (!urlObj.searchParams.has('language')) {
    const languageCode = mpcLanguagesMap[lang] || lang;
    urlObj.searchParams.append('language', languageCode);
  }

  return urlObj.href;
}
