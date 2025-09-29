// Module utils

/**
 * Extracts courseId and moduleId from a URL path
 * @param {string} [url] - The URL path to extract from. If not provided, uses current page URL
 * @returns {Object} Object containing courseId and moduleId
 *   - {string|null} courseId - The course identifier
 *   - {string|null} moduleId - The module identifier (null if not found)
 */
export function extractCourseModuleIds(url = window.location.pathname) {
  const segments = url.split('/').filter(Boolean);
  const coursesIndex = segments.indexOf('courses');

  if (coursesIndex === -1 || coursesIndex >= segments.length - 1) {
    return { courseId: null, moduleId: null };
  }

  const courseId = `${segments[coursesIndex]}/${segments[coursesIndex + 1]}`;
  const moduleSegment = segments[coursesIndex + 2];
  const moduleId = moduleSegment ? `${courseId}/${moduleSegment}` : null;

  return { courseId, moduleId };
}

/**
 * Extracts the module fragment URL from the current page path.
 * For a path like /{locale}/courses/{collection}/{fragment}/{step}/...,
 * returns /{locale}/courses/{collection}/{fragment}
 *
 * @returns {string|null} The module fragment URL or null if not found
 */
export function getModuleFragmentUrl(url = window.location.pathname) {
  const parts = url.split('/').filter(Boolean);
  // find "courses" in the path
  const idx = parts.indexOf('courses');
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
async function fetchModuleFragment(url = window.location.pathname) {
  const path = getModuleFragmentUrl(url);
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
async function extractModuleMeta(fragment, placeholders) {
  if (!fragment) return {};

  const meta = fragment.querySelector('.module-meta');
  const track = fragment.querySelector('.module');

  const moduleHeader = meta?.children[0]?.textContent?.trim() || '';
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

/**
 * Gets current step information for the module with caching support.
 * Retrieves module metadata from cache or fetches from server if not cached.
 * Updates step navigation metadata for the current page.
 *
 * @returns {Promise<Object|null>} Module metadata object containing:
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
export async function getCurrentStepInfo(url = window.location.pathname, placeholders = {}) {
  const fragUrl = getModuleFragmentUrl(url);
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
    // eslint-disable-next-line no-console
    console.error(e);
  }

  // Not cached, fetch and store
  const fragment = await fetchModuleFragment(fragUrl);
  if (!fragment) return null;
  meta = await extractModuleMeta(fragment, placeholders);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(meta));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return { ...meta, ...getStepMeta(meta?.moduleSteps, meta?.moduleRecap, meta?.moduleQuiz) };
}

/**
 * Gets module metadata for a specific module fragment URL with caching support.
 * Retrieves cached metadata or fetches from server if not cached.
 *
 * @param {string} moduleFragmentUrl - The module fragment URL to get metadata for
 * @returns {Promise<Object|null>} Module metadata object containing:
 *   - {string} moduleHeader - Title of the module
 *   - {string} moduleDescription - Description HTML content
 *   - {string} moduleRecap - URL of the recap step
 *   - {string} moduleQuiz - URL of the quiz step
 *   - {Array<{name: string, url: string}>} moduleSteps - Array of step objects
 *   - {number} totalSteps - Total number of steps in the track
 */
export async function getModuleMeta(url = window.location.pathname, placeholders = {}) {
  const moduleFragmentUrl = getModuleFragmentUrl(url);
  if (!moduleFragmentUrl) return null;
  const storageKey = `module-meta:${moduleFragmentUrl}`;
  let meta = null;

  try {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed?.moduleSteps)) {
        return parsed;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  const fragment = await fetchModuleFragment(moduleFragmentUrl);
  if (!fragment) return null;
  meta = await extractModuleMeta(fragment, placeholders);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(meta));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return meta;
}

// Course utils

/**
 * Extracts the course fragment URL from the current page path.
 * For a path like /{locale}/courses/{collection}/{fragment}/{step}/...,
 * returns /{locale}/courses/{collection}
 *
 * @returns {string|null} The course fragment URL or null if not found
 */
export function getCourseFragmentUrl(url = window.location.pathname) {
  const parts = url.split('/').filter(Boolean);
  const idx = parts.indexOf('courses');
  if (idx > 0 && parts.length > idx + 1) {
    const locale = parts[idx - 1];
    const collection = parts[idx + 1];
    return `/${locale}/courses/${collection}`;
  }
  return null;
}

/**
 * Fetches the course fragment HTML content from the server.
 *
 * @param {string} courseFragmentUrl - The course fragment URL to fetch
 * @returns {Promise<Document|null>} Parsed HTML document or null if fetch fails
 */
export async function fetchCourseFragment(url = window.location.pathname) {
  const courseFragmentUrl = getCourseFragmentUrl(url);
  if (!courseFragmentUrl) return null;
  const fragmentUrl = `${courseFragmentUrl}.plain.html`;
  const res = await fetch(fragmentUrl);
  if (!res.ok) {
    return null;
  }
  const text = await res.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html');
}

/**
 * Extracts metadata from a course fragment DOM element.
 * Parses the fragment to extract course information including heading,
 * description, total time, and module URLs.
 *
 * @param {Document} fragment - Parsed HTML document containing course data
 * @returns {Promise<Object>} Course metadata object containing:
 *   - {string} heading - Course title
 *   - {string} description - Course description HTML content
 *   - {string} totalTime - Total course duration
 *   - {Array<string>} modules - Array of module URLs
 */
export async function extractCourseMeta(fragment) {
  if (!fragment) return {};

  const marqueeMeta = fragment.querySelector('.course-marquee');
  const heading = marqueeMeta?.children[0]?.textContent?.trim() || '';
  const description = marqueeMeta?.children[1]?.innerHTML || '';
  const courseBreakdownMeta = fragment.querySelector('.course-breakdown');
  const totalTime = courseBreakdownMeta?.children[1]?.textContent?.trim() || '';
  const modules =
    courseBreakdownMeta?.children.length > 4
      ? [...courseBreakdownMeta.children].slice(4).map((child) => child.querySelector('a')?.getAttribute('href') || '')
      : [];
  return {
    heading,
    description,
    totalTime,
    modules,
  };
}

/**
 * Gets current course metadata with caching support.
 * Retrieves course metadata from cache or fetches from server if not cached.
 *
 * @param {string} [courseFragmentUrl] - The course fragment URL to get metadata for.
 *                                      If not provided, uses getCourseFragmentUrl()
 * @returns {Promise<Object|null>} Course metadata object containing:
 *   - {string} heading - Course title
 *   - {string} description - Course description HTML content
 *   - {string} totalTime - Total course duration
 *   - {Array<string>} modules - Array of module URLs
 *   - {string} url - The course fragment URL
 */
export async function getCurrentCourseMeta(url = window.location.pathname) {
  const courseFragmentUrl = getCourseFragmentUrl(url);
  if (!courseFragmentUrl) return null;
  const storageKey = `course-meta:${courseFragmentUrl}`;
  let meta = null;

  try {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed?.modules)) {
        return parsed;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  const fragment = await fetchCourseFragment(courseFragmentUrl);
  if (!fragment) return null;

  meta = await extractCourseMeta(fragment);
  meta.url = courseFragmentUrl;

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(meta));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return meta;
}
