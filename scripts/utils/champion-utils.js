import ffetch from '../ffetch.js';
import PreferenceStore from '../preferences/preferences.js';

export const MAX_CHAMPIONS = 18;

// matches ffetch.js's own default concurrency (maxInFlight) for the same kind of fetch-each-entry work
const MAX_CONCURRENT_FETCHES = 5;

// Auto index stays /champions only (matches live query-index). Authored picks also allow
// /advocates/ so a future folder rename does not need a runtime change.
const CHAMPION_PROFILE_PATH_RE = /^\/[^/]+\/champions\/[^/]+$/;
const AUTHORED_ADVOCATE_PATH_RE = /^\/[^/]+\/(champions|advocates)\/[^/]+$/;

const AEM_CONTENT_ROOT = '/content/exlm/global';

/**
 * Normalize an authored advocate href/path to an EDS pathname.
 * Handles absolute URLs, AEM content paths, query/hash, trailing slash, and optional .html.
 * @param {string} hrefOrPath
 * @returns {string}
 */
export function normalizeAdvocatePath(hrefOrPath) {
  if (!hrefOrPath || typeof hrefOrPath !== 'string') return '';
  let path = hrefOrPath.trim();
  // reject before URL resolution — `new URL` would collapse `/a/../b` into `/b`
  if (!path || path.startsWith('//') || path.includes('..')) return '';

  try {
    // always go through URL so relative paths also drop ?query / #hash
    path = new URL(path, 'https://dummy.invalid').pathname;
  } catch {
    return '';
  }

  const aemRoot = (typeof window !== 'undefined' && window.hlx?.aemRoot) || AEM_CONTENT_ROOT;
  if (path.startsWith(aemRoot)) {
    path = path.slice(aemRoot.length) || '/';
  }

  path = path.replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
  // `..` already rejected pre-parse; URL resolution collapses any that slipped through.
  // Keep `//` — e.g. `/.//x` can still normalize to a protocol-relative pathname.
  if (path.startsWith('//')) return '';
  return path;
}

/**
 * Profile path under /champions/ — used for automatic champion-index discovery.
 * @param {string} path
 */
export function isChampionProfilePath(path) {
  if (!path || path.includes('..')) return false;
  return CHAMPION_PROFILE_PATH_RE.test(path);
}

/**
 * Profile path under /champions/ or /advocates/ — used for authored content-picker paths.
 * @param {string} path
 */
export function isAdvocateProfilePath(path) {
  if (!path || path.includes('..')) return false;
  return AUTHORED_ADVOCATE_PATH_RE.test(path);
}

/**
 * Normalize, validate, dedupe, and cap authored advocate paths. Single place for selection rules.
 * @param {string[]} paths
 * @returns {string[]}
 */
export function sanitizeAdvocatePaths(paths) {
  const seen = new Set();
  const championPaths = [];
  (paths || []).forEach((hrefOrPath) => {
    if (championPaths.length >= MAX_CHAMPIONS) return;
    const path = normalizeAdvocatePath(hrefOrPath);
    if (!path || !isAdvocateProfilePath(path) || seen.has(path)) return;
    seen.add(path);
    championPaths.push(path);
  });
  return championPaths;
}

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
    .filter((path) => isChampionProfilePath(path))
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

/**
 * Fetch eligible Champion profiles for an explicit list of authored paths.
 * Caps at MAX_CHAMPIONS, batches fetches, skips nulls, preserves input order of successes.
 * @param {string[]} paths
 */
export async function getChampionsByPaths(paths) {
  const championPaths = sanitizeAdvocatePaths(paths);

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
