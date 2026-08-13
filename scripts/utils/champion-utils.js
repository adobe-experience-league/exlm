import ffetch from '../ffetch.js';
import PreferenceStore from '../preferences/preferences.js';

export const MAX_CHAMPIONS = 18;

// matches ffetch.js's own default concurrency (maxInFlight) for the same kind of fetch-each-entry work
const MAX_CONCURRENT_FETCHES = 5;

// fileReference, name, jobTitle, quoteBio, communityProfileUrl, productDesignation, colorSelection
export const CHAMPION_DETAIL_FIELD_COUNT = 7;

// Color coding is intentional and used in several places throughout the experience:
// yellow for Adobe Champion, purple for Community Advisor, blue for User Group Leader.
export const DESIGNATION_COLORS = ['yellow', 'purple', 'blue'];

const rotationStore = new PreferenceStore('featured-advocates-rotation');

export function getDesignationColor(colorSelection) {
  const normalized = colorSelection?.trim().toLowerCase();
  return DESIGNATION_COLORS.includes(normalized) ? normalized : '';
}

/**
 * Extract Champion profile fields from a champion-detail block.
 * @param {HTMLElement} block
 */
export function extractChampionDetail(block) {
  const [image, name, jobTitle, quoteBio, communityProfile, productDesignation, colorSelection] = [...block.children];

  const img = image?.querySelector('img');
  const communityLink = communityProfile?.querySelector('a');
  const nameText = name?.textContent.trim() || '';

  return {
    image: img?.getAttribute('src') || '',
    imageAlt: img?.getAttribute('alt') || nameText,
    name: nameText,
    jobTitle: jobTitle?.textContent.trim() || '',
    quoteBio: quoteBio?.innerHTML.trim() || '',
    communityProfileUrl: communityLink?.getAttribute('href') || communityProfile?.textContent.trim() || '',
    productDesignation: productDesignation?.textContent.trim() || '',
    colorSelection: colorSelection?.textContent.trim() || '',
  };
}

/**
 * Extract one Associated Content card's fields from a champion-content block.
 * @param {HTMLElement} block
 */
export function extractChampionContent(block) {
  // eyebrowIconAlt/footerIconAlt share their icon's own row — AEM applies them as
  // the <img>'s own alt attribute, same as fileReferenceAlt on champion-detail's image.
  const [eyebrowIcon, contentType, title, description, showByline, footerIcon, footerText, ...ctaRows] = [
    ...block.children,
  ];
  const eyebrowIconImg = eyebrowIcon?.querySelector('img');
  const footerIconImg = footerIcon?.querySelector('img');
  const ctaLink = ctaRows.map((row) => row?.querySelector('a')).find(Boolean);

  return {
    eyebrowIcon: eyebrowIconImg?.getAttribute('src') || '',
    eyebrowIconAlt: eyebrowIconImg?.getAttribute('alt') || '',
    contentType: contentType?.textContent.trim() || '',
    title: title?.textContent.trim() || '',
    description: description?.innerHTML.trim() || '',
    showByline: showByline?.textContent.trim() === 'true',
    footerIcon: footerIconImg?.getAttribute('src') || '',
    footerIconAlt: footerIconImg?.getAttribute('alt') || '',
    footerText: footerText?.innerHTML.trim() || '',
    ctaLabel: ctaLink?.textContent.trim() || '',
    ctaHref: ctaLink?.getAttribute('href') || '',
  };
}

/**
 * A Champion is eligible unless a required field is missing.
 * Quote/Bio is the only field the acceptance criteria exempts.
 * @param {object} detail
 */
export function isChampionEligible(detail) {
  if (!detail) return false;
  return [
    detail.image,
    detail.name,
    detail.jobTitle,
    detail.communityProfileUrl,
    detail.productDesignation,
    detail.colorSelection,
  ].every((value) => !!value);
}

/**
 * Fetch and parse a single Champion page: its champion-detail block plus up to 3 champion-content blocks.
 * @param {string} path
 */
export async function fetchChampionProfile(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const detailBlock = doc.querySelector('.champion-detail');
    if (!detailBlock) return null;
    const detail = extractChampionDetail(detailBlock);
    if (!isChampionEligible(detail)) return null;

    // items aren't class-tagged in raw HTML (only added by client-side decoration),
    // so find them the same way champion-detail.js does: positionally.
    const associatedContent = [...detailBlock.children]
      .slice(CHAMPION_DETAIL_FIELD_COUNT, CHAMPION_DETAIL_FIELD_COUNT + 3)
      .map(extractChampionContent)
      .filter((item) => item.title);

    return { path, detail, associatedContent };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching champion profile at ${path}:`, error);
    return null;
  }
}

/**
 * Discover Champion pages under /champions/* via the site's champion index, fetch each,
 * and return up to MAX_CHAMPIONS eligible Champion profiles.
 * @param {string} lang
 */
export async function getFeaturedChampions(lang) {
  let entries = [];
  try {
    entries = await ffetch(`/${lang}/champion-index.json`).all();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching champion index:', error);
    return [];
  }
  const championPaths = entries
    .map((entry) => entry.path)
    .filter((path) => /\/champions\/.+/.test(path))
    .slice(0, MAX_CHAMPIONS);

  const profiles = [];
  for (let i = 0; i < championPaths.length; i += MAX_CONCURRENT_FETCHES) {
    const batch = championPaths.slice(i, i + MAX_CONCURRENT_FETCHES);
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential to cap concurrent fetches
    const batchProfiles = await Promise.all(batch.map((path) => fetchChampionProfile(path)));
    profiles.push(...batchProfiles.filter(Boolean));
  }
  return profiles;
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Rotate and shuffle the Champion list so a different Champion starts the carousel on each
 * page load, cycling through the full randomized list (no repeats) before reshuffling.
 * @param {Array<object>} champions
 */
export function getRotatedChampions(champions) {
  const paths = champions.map((champion) => champion.path);
  const stateKey = paths.sort().join('|');

  let state = rotationStore.get('state');

  if (!state || state.key !== stateKey || !Array.isArray(state.order) || state.order.length !== paths.length) {
    state = { key: stateKey, order: shuffle(paths), startIndex: 0 };
  } else {
    const previousPath = state.order[state.startIndex];
    state.startIndex += 1;
    if (state.startIndex >= state.order.length) {
      const newOrder = shuffle(paths);
      // avoid showing the same champion two loads in a row when the cycle wraps and reshuffles
      if (newOrder.length > 1 && newOrder[0] === previousPath) {
        const swapWith = 1 + Math.floor(Math.random() * (newOrder.length - 1));
        [newOrder[0], newOrder[swapWith]] = [newOrder[swapWith], newOrder[0]];
      }
      state.order = newOrder;
      state.startIndex = 0;
    }
  }

  rotationStore.set('state', state);

  const rotatedPaths = [...state.order.slice(state.startIndex), ...state.order.slice(0, state.startIndex)];
  return rotatedPaths.map((path) => champions.find((champion) => champion.path === path)).filter(Boolean);
}
