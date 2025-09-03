import { fetchLanguagePlaceholders } from '../scripts.js';

/**
 * Extracts the module fragment URL from the current page path.
 * For a path like /{locale}/courses/{collection}/{fragment}/{step}/...,
 * returns /{locale}/courses/{collection}/{fragment}
 *
 * @returns {string|null} The module fragment URL or null if not found
 */
/**
 * Extracts the module fragment URL from the current page path.
 * For a path like /{locale}/courses/{collection}/{fragment}/{step}/...,
 * returns /{locale}/courses/{collection}/{fragment}
 *
 * @returns {string|null} The module fragment URL or null if not found
 */
export function getModuleFragmentUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  // find "courses" in the path
  const idx = parts.indexOf("courses");
  if (idx > 0 && parts.length > idx + 2) {
    const locale = parts[idx - 1];
    const collection = parts[idx + 1];
    const fragment = parts[idx + 2];
    return `/${locale}/courses/${collection}/${fragment}`;
  }
  return null;
}

/**
 * Fetches the module fragment HTML content from the server.
 *
 * @param {string} [path] - The path to fetch the fragment from. If not provided,
 *                         uses the result of getModuleFragmentUrl()
 * @returns {Promise<Document|null>} Parsed HTML document or null if fetch fails
 */
async function fetchModuleFragment(path = getModuleFragmentUrl()) {
  if (!path) return null;
  const fragmentUrl = `${path}.plain.html`;
  const res = await fetch(fragmentUrl);
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch module fragment: ${fragmentUrl}`);
    return null;
  }
  const text = await res.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html');
}

/**
 * Determines the current step position and navigation metadata for a module.
 *
 * @param {Array<{name: string, url: string}>} allSteps - Array of step objects with name and URL
 * @param {string} moduleRecap - URL of the recap step
 * @param {string} moduleQuiz - URL of the quiz step
 * @returns {Object} Step metadata object containing:
 *   - {number} currentStep - Index of the current step (1-based)
 *   - {string} nextStep - URL of the next step (null if none)
 *   - {string} prevStep - URL of the previous step (null if none)
 *   - {string} courseUrl - Base URL of the course
 *   - {boolean} isRecap - Whether current page is the recap step
 *   - {boolean} isQuiz - Whether current page is the quiz step
 */
function getStepMeta(allSteps, moduleRecap, moduleQuiz) {
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

  // Course URL: parent path up to /courses/slug
  let courseUrl = '';
  const [, matchedUrl] = currentPath.match(/^(\/[a-z-]+\/courses\/[^/]+)/) || [];
  if (matchedUrl) courseUrl = matchedUrl;

  // isRecap, isQuiz
  const isRecap = !!(moduleRecap && currentPath.startsWith(moduleRecap));
  const isQuiz = !!(moduleQuiz && currentPath.startsWith(moduleQuiz));

  return {
    currentStep,
    nextStep,
    prevStep,
    courseUrl,
    isRecap,
    isQuiz,
  };
}

/**
 * Extracts metadata from a module fragment DOM element.
 * Parses the fragment to extract header, description, recap/quiz URLs,
 * and step information.
 *
 * @param {Document} fragment - Parsed HTML document containing module data
 * @returns {Promise<Object>} module metadata object containing:
 *   - {string} moduleHeader - Title of the module
 *   - {string} moduleDescription - Description HTML content
 *   - {string} moduleRecap - URL of the recap step
 *   - {string} moduleQuiz - URL of the quiz step
 *   - {Array<{name: string, url: string}>} moduleSteps - Array of step objects
 *   - {number} totalSteps - Total number of steps in the track
 *   - {number} currentStep - Index of the current step (1-based)
 *   - {string|null} nextStep - URL of the next step (null if none)
 *   - {string|null} prevStep - URL of the previous step (null if none)
 *   - {string} courseUrl - Base URL of the course
 *   - {boolean} isRecap - Whether current page is the recap step
 *   - {boolean} isQuiz - Whether current page is the quiz step
 */
async function extractModuleMeta(fragment) {
  if (!fragment) return {};

  const meta = fragment.querySelector('.module-meta');
  const track = fragment.querySelector('.module');

  const moduleHeader = meta?.children[0]?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || '';
  const moduleDescription = meta?.children[1]?.innerHTML || '';
  const moduleRecap = meta?.children[2]?.querySelector('a')?.getAttribute('href') || '';
  const moduleQuiz = meta?.children[3]?.querySelector('a')?.getAttribute('href') || '';

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
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  // Add recap and quiz steps to allSteps
  if (moduleRecap) {
    allSteps.push({
      name: placeholders['module-recap-step-name'] || 'Recap - Key Takeaways',
      url: moduleRecap,
    });
  }
  if (moduleQuiz) {
    allSteps.push({ name: placeholders['module-quiz-step-name'] || 'Module Quiz', url: moduleQuiz });
  }

  const totalSteps = allSteps.length;

  return {
    moduleHeader,
    moduleDescription,
    moduleRecap,
    moduleQuiz,
    moduleSteps: allSteps,
    totalSteps,
    ...getStepMeta(allSteps, moduleRecap, moduleQuiz),
  };
}

export async function getCurrentStepInfo() {
  const fragUrl = getModuleFragmentUrl();
  if (!fragUrl) return null;
  const storageKey = `module-meta:${fragUrl}`;
  let meta = null;

  // Try to get from sessionStorage
  try {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Re-run getStepMeta to update navigation for current page
      if (parsed && Array.isArray(parsed.moduleSteps)) {
        const stepMeta = getStepMeta(parsed.moduleSteps, parsed.moduleRecap, parsed.moduleQuiz);
        return { ...parsed, ...stepMeta };
      }
    }
  } catch (e) {
    // ignore parse errors
  }

  // Not cached, fetch and store
  const fragment = await fetchModuleFragment(fragUrl);
  if (!fragment) return null;
  meta = await extractModuleMeta(fragment);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(meta));
  } catch (e) {
    // ignore storage errors
  }
  return meta;
}
