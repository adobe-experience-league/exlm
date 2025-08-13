import { fetchPlaceholders } from '../lib-franklin.js';

/**
 * Extracts the skill track fragment URL from the current page path.
 * For a path like /{locale}/learning-collections/{collection}/{fragment}/{step}/...,
 * returns /{locale}/learning-collections/{collection}/{fragment}
 *
 * @returns {string|null} The skill track fragment URL or null if not found
 */
export function getSkillTrackFragmentUrl() {
  const url = window.location.pathname;
  // Match: /{locale}/learning-collections/{collection}/{fragment}/
  const match = url.match(/^\/[a-z-]+\/learning-collections\/[^/]+\/[^/]+/);
  return match ? match[0] : null;
}

/**
 * Fetches the skill track fragment HTML content from the server.
 *
 * @param {string} [path] - The path to fetch the fragment from. If not provided,
 *                         uses the result of getSkillTrackFragmentUrl()
 * @returns {Promise<Document|null>} Parsed HTML document or null if fetch fails
 */
async function fetchSkillTrackFragment(path = getSkillTrackFragmentUrl()) {
  if (!path) return null;
  const fragmentUrl = `${path}.plain.html`;
  const res = await fetch(fragmentUrl);
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch skill track fragment: ${fragmentUrl}`);
    return null;
  }
  const text = await res.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html');
}

/**
 * Determines the current step position and navigation metadata for a skill track.
 *
 * @param {Array<{name: string, url: string}>} allSteps - Array of step objects with name and URL
 * @param {string} skillTrackRecap - URL of the recap step
 * @param {string} skillTrackQuiz - URL of the quiz step
 * @returns {Object} Step metadata object containing:
 *   - {number} currentStep - Index of the current step (1-based)
 *   - {string} nextStep - URL of the next step (null if none)
 *   - {string} prevStep - URL of the previous step (null if none)
 *   - {string} collectionUrl - Base URL of the learning collection
 *   - {boolean} isRecap - Whether current page is the recap step
 *   - {boolean} isQuiz - Whether current page is the quiz step
 */
function getStepMeta(allSteps, skillTrackRecap, skillTrackQuiz) {
  const currentPath = window.location.pathname;
  let currentStep = null;
  let nextStep = null;
  let prevStep = null;
  let currentIdx = -1;

  for (let i = 0; i < allSteps.length; i += 1) {
    if (allSteps[i] && currentPath.startsWith(allSteps[i].url)) {
      currentStep = i + 1; // 1-based index
      currentIdx = i;
      break;
    }
  }
  if (currentIdx === -1) {
    // fallback: try to match by last segment
    const lastSeg = currentPath.split('/').pop();
    for (let i = 0; i < allSteps.length; i += 1) {
      if (allSteps[i].url.split('/').pop() === lastSeg) {
        currentStep = i + 1; // 1-based index
        currentIdx = i;
        break;
      }
    }
  }
  if (currentIdx !== -1) {
    prevStep = allSteps[currentIdx - 1]?.url || null;
    nextStep = allSteps[currentIdx + 1]?.url || null;
  }

  // Collection URL: parent path up to /learning-collections/slug
  let collectionUrl = '';
  const [, matchedUrl] = currentPath.match(/^(\/[a-z-]+\/learning-collections\/[^/]+)/) || [];
  if (matchedUrl) collectionUrl = matchedUrl;

  // isRecap, isQuiz
  const isRecap = !!(skillTrackRecap && currentPath.startsWith(skillTrackRecap));
  const isQuiz = !!(skillTrackQuiz && currentPath.startsWith(skillTrackQuiz));

  return {
    currentStep,
    nextStep,
    prevStep,
    collectionUrl,
    isRecap,
    isQuiz,
  };
}

/**
 * Extracts metadata from a skill track fragment DOM element.
 * Parses the fragment to extract header, description, recap/quiz URLs,
 * and step information.
 *
 * @param {Document} fragment - Parsed HTML document containing skill track data
 * @returns {Promise<Object>} Skill track metadata object containing:
 *   - {string} skillTrackHeader - Title of the skill track
 *   - {string} skillTrackDescription - Description HTML content
 *   - {string} skillTrackRecap - URL of the recap step
 *   - {string} skillTrackQuiz - URL of the quiz step
 *   - {Array<{name: string, url: string}>} skillTrackSteps - Array of step objects
 *   - {number} totalSteps - Total number of steps in the track
 *   - {number} currentStep - Index of the current step (1-based)
 *   - {string|null} nextStep - URL of the next step (null if none)
 *   - {string|null} prevStep - URL of the previous step (null if none)
 *   - {string} collectionUrl - Base URL of the learning collection
 *   - {boolean} isRecap - Whether current page is the recap step
 *   - {boolean} isQuiz - Whether current page is the quiz step
 */
async function extractSkillTrackMeta(fragment) {
  if (!fragment) return {};

  const meta = fragment.querySelector('.skill-track-meta');
  const track = fragment.querySelector('.skill-track');

  const skillTrackHeader = meta?.children[0]?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || '';
  const skillTrackDescription = meta?.children[1]?.innerHTML || '';
  const skillTrackRecap = meta?.children[2]?.querySelector('a')?.getAttribute('href') || '';
  const skillTrackQuiz = meta?.children[3]?.querySelector('a')?.getAttribute('href') || '';

  // Steps
  const stepDivs = Array.from(track?.children || []);
  const allSteps = stepDivs
    .map((div) => {
      const a = div.querySelector('a');
      const nameDiv = div.children?.[1];
      const url = a?.getAttribute('href') || '';
      const name = nameDiv?.textContent?.trim() || '';
      if (!url || !name) return null;
      return { name, url };
    })
    .filter(Boolean);

  // Fetch placeholders for step names
  const placeholders = await fetchPlaceholders();

  // Add recap and quiz steps to allSteps
  if (skillTrackRecap) {
    allSteps.push({
      name: placeholders['skill-reack-recap-step-name'] || 'Recap - Key Takeaways',
      url: skillTrackRecap,
    });
  }
  if (skillTrackQuiz) {
    allSteps.push({ name: placeholders['skill-track-quiz-step-name'] || 'Skill Track Quiz', url: skillTrackQuiz });
  }

  const totalSteps = allSteps.length;

  return {
    skillTrackHeader,
    skillTrackDescription,
    skillTrackRecap,
    skillTrackQuiz,
    skillTrackSteps: allSteps,
    totalSteps,
    ...getStepMeta(allSteps, skillTrackRecap, skillTrackQuiz),
  };
}

export async function getCurrentStepInfo() {
  const fragUrl = getSkillTrackFragmentUrl();
  if (!fragUrl) return null;
  const storageKey = `skill-track-meta:${fragUrl}`;
  let meta = null;

  // Try to get from sessionStorage
  try {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Re-run getStepMeta to update navigation for current page
      if (parsed && Array.isArray(parsed.skillTrackSteps)) {
        const stepMeta = getStepMeta(parsed.skillTrackSteps, parsed.skillTrackRecap, parsed.skillTrackQuiz);
        return { ...parsed, ...stepMeta };
      }
    }
  } catch (e) {
    // ignore parse errors
  }

  // Not cached, fetch and store
  const fragment = await fetchSkillTrackFragment(fragUrl);
  if (!fragment) return null;
  meta = await extractSkillTrackMeta(fragment);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(meta));
  } catch (e) {
    // ignore storage errors
  }
  return meta;
}
