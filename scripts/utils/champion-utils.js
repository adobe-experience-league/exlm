import ffetch from '../ffetch.js';

export const MAX_CHAMPIONS = 18;

// Color coding is intentional and used in several places throughout the experience:
// yellow for Adobe Champion, purple for Community Advisor, blue for User Group Leader.
const DESIGNATION_COLORS = ['yellow', 'purple', 'blue'];

const ROTATION_STORAGE_KEY = 'featured-advocates-rotation';

export function getDesignationColor(colorSelection) {
  const normalized = colorSelection?.trim().toLowerCase();
  return DESIGNATION_COLORS.includes(normalized) ? normalized : '';
}

/**
 * Extract Champion profile fields from a champion-detail block.
 * @param {HTMLElement} block
 */
export function extractChampionDetail(block) {
  const [image, name, jobTitle, quoteBio, communityProfile, productDesignation, colorSelection] = [
    ...block.children,
  ].map((row) => row.firstElementChild);

  const img = image?.querySelector('img');
  const communityLink = communityProfile?.querySelector('a');
  const nameText = name?.textContent.trim() || '';

  return {
    image: img?.getAttribute('src') || '',
    imageAlt: nameText,
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
  const [eyebrowIcon, contentType, title, description, footerIcon, footerText, cta] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const eyebrowIconImg = eyebrowIcon?.querySelector('img');
  const footerIconImg = footerIcon?.querySelector('img');
  const ctaLink = cta?.querySelector('a');

  return {
    eyebrowIcon: eyebrowIconImg?.getAttribute('src') || '',
    contentType: contentType?.textContent.trim() || '',
    title: title?.textContent.trim() || '',
    description: description?.innerHTML.trim() || '',
    footerIcon: footerIconImg?.getAttribute('src') || '',
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

    const associatedContent = [...doc.querySelectorAll('.champion-content')]
      .slice(0, 3)
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
  const championPaths = entries.map((entry) => entry.path).filter((path) => /\/champions\/.+/.test(path));

  const profiles = (await Promise.all(championPaths.map((path) => fetchChampionProfile(path)))).filter(Boolean);

  return profiles.slice(0, MAX_CHAMPIONS);
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
  const stateKey = [...paths].sort().join('|');

  let state;
  try {
    state = JSON.parse(sessionStorage.getItem(ROTATION_STORAGE_KEY) || 'null');
  } catch (error) {
    state = null;
  }

  if (!state || state.key !== stateKey || !Array.isArray(state.order) || state.order.length !== paths.length) {
    state = { key: stateKey, order: shuffle(paths), startIndex: 0 };
  } else {
    state.startIndex = (state.startIndex + 1) % state.order.length;
    if (state.startIndex === 0) {
      state.order = shuffle(paths);
    }
  }

  try {
    sessionStorage.setItem(ROTATION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // ignore storage errors (e.g. private browsing)
  }

  const rotatedPaths = [...state.order.slice(state.startIndex), ...state.order.slice(0, state.startIndex)];
  return rotatedPaths.map((path) => champions.find((champion) => champion.path === path)).filter(Boolean);
}
