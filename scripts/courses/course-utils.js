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
 * Checks if a URL contains a specific module by comparing extracted module IDs
 * @param {string} url - The URL to check
 * @param {string} moduleId - The module ID to match against
 * @returns {boolean} True if the URL contains the exact module ID
 */
export function urlContainsModule(url, moduleId) {
  if (!url || !moduleId) return false;
  const { moduleId: urlModuleId } = extractCourseModuleIds(url);
  return urlModuleId === moduleId;
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
    if (allSteps[i] && currentPath === allSteps[i].url) {
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
      name: placeholders?.moduleRecapStepName || 'Recap - Key Takeaways',
      url: moduleRecap,
    });
  }
  if (moduleQuiz) {
    allSteps.push({ name: placeholders?.moduleQuizStepName || 'Module Quiz', url: moduleQuiz });
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
export async function getCurrentStepInfo(placeholders = {}) {
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
  const res = await fetch(courseFragmentUrl);
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
 * description, total time, role, solution, level, course completion page and module URLs.
 *
 * @param {Document} fragment - Parsed HTML document containing course data
 * @returns {Promise<Object>} Course metadata object containing:
 *   - {string} heading - Course title
 *   - {string} description - Course description HTML content
 *   - {string} totalTime - Total course duration
 *   - {Array<string>} modules - Array of module URLs
 *   - {string} role - Course role
 *   - {string} solution - Course solution
 *   - {string} level - Course level
 *   - {string} courseCompletionPage - URL to the course completion page
 */
export async function extractCourseMeta(fragment) {
  if (!fragment) return {};

  const marqueeMeta = fragment.querySelector('.course-marquee');
  const courseBreakdownMeta = fragment.querySelector('.course-breakdown');

  const descriptionElement = marqueeMeta?.children?.[1];
  const description = descriptionElement?.innerHTML || '';

  const [, totalTimeElement, , , courseCompletionElement, ...moduleElements] = courseBreakdownMeta?.children || [];
  const totalTime = totalTimeElement?.textContent?.trim() || '';
  const courseCompletionPage = courseCompletionElement?.querySelector('a')?.getAttribute('href') || '';

  const modules = moduleElements.map((child) => child.querySelector('a')?.getAttribute('href') || '');

  const heading = fragment.querySelector('meta[property="og:title"]')?.content || '';
  const role = fragment.querySelector('meta[name="role"]')?.content || '';
  const solution = fragment.querySelector('meta[name="solution"]')?.content || '';
  const level = fragment.querySelector('meta[name="level"]')?.content || '';

  return {
    heading,
    description,
    totalTime,
    modules,
    role,
    solution,
    level,
    courseCompletionPage,
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

/**
 * Checks if the current step is the last step in the module.
 *
 * @param {Object} stepInfo - The step information object from getCurrentStepInfo()
 * @returns {Promise<boolean>} True if current step is the last step, false otherwise
 */
export async function isLastStep() {
  const stepInfo = await getCurrentStepInfo();
  if (!stepInfo || !stepInfo.moduleSteps || !Array.isArray(stepInfo.moduleSteps)) {
    return false;
  }

  const currentStepIndex = stepInfo.moduleSteps.findIndex((step) => step.url === window.location.pathname);
  return currentStepIndex === stepInfo.moduleSteps.length - 1;
}

// Gets the URL of the first step of the next module.
/**
 * Gets the URL of the first step of the next module.
 *
 * @returns {Promise<string|null>} The URL of the first step of the next module or null if not found
 */
export async function getNextModuleFirstStep(url = window.location.pathname) {
  const courseInfo = await getCurrentCourseMeta(url);
  if (!courseInfo || !courseInfo.modules || !Array.isArray(courseInfo.modules) || courseInfo.modules.length === 0) {
    return null;
  }

  // Extract the current module ID from the URL
  const { moduleId: currentModuleId } = extractCourseModuleIds(url);

  if (!currentModuleId) {
    return null;
  }

  // Find the current module index by comparing extracted module IDs
  const currentModuleIndex = courseInfo.modules.findIndex((moduleUrl) => {
    const { moduleId } = extractCourseModuleIds(moduleUrl);
    return moduleId === currentModuleId;
  });

  // If there's a next module, get its first step
  if (currentModuleIndex !== -1 && currentModuleIndex < courseInfo.modules.length - 1) {
    const nextModuleUrl = courseInfo.modules?.[currentModuleIndex + 1];

    const nextModuleMeta = await getModuleMeta(nextModuleUrl);

    // If we have module steps, return the first one
    if (nextModuleMeta?.moduleSteps?.length > 0) {
      return nextModuleMeta.moduleSteps?.[0]?.url;
    }
  }

  return null;
}

/*
 * Fetches and caches the course index for a given language prefix
 * Uses window-level caching to avoid multiple requests for the same data
 * @param {string} prefix - Language prefix for the course index (default: 'en')
 * @returns {Promise<Array>} Array of course index data
 */
export async function fetchCourseIndex(prefix = 'en') {
  window.courseIndex = window.courseIndex || {};
  const loaded = window.courseIndex[`${prefix}-loaded`];
  if (!loaded) {
    window.courseIndex[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      const url = `/${prefix}/course-index.json`;
      fetch(url)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          window.courseIndex[prefix] = [];
          return {};
        })
        .then((json) => {
          window.courseIndex[prefix] = json?.data ?? [];
          resolve(json?.data ?? []);
        })
        .catch((error) => {
          window.courseIndex[prefix] = [];
          reject(error);
        });
    });
  }
  await window.courseIndex[`${prefix}-loaded`];
  return window.courseIndex[prefix];
}

export function transformCourseMetaToCardModel({ model, placeholders }) {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  let productArray = [];
  if (model.coveoSolution) {
    if (model.coveoSolution.includes(';')) {
      const solutions = model.coveoSolution.split(';').map((s) => s.trim());
      productArray = [...new Set(solutions)];
    } else {
      productArray = [model.coveoSolution];
    }
  }

  return {
    id: model.path?.split('/')?.pop() || '',
    contentType: model.coveoContentType || 'Course',
    badgeTitle: model.coveoContentType || 'Course',
    product: productArray,
    title: model.title,
    description: model.description || '',
    copyLink: baseUrl + model.path,
    viewLink: baseUrl + model.path,
    viewLinkText: placeholders?.browseCardCourseViewLabel || 'View course',
    el_course_duration: model.totalTime || '',
    el_course_module_count: model.modules?.length?.toString() || '',
    el_level: model.level || '',
    meta: {},
  };
}

/**
 * Gets the URL of the course completion page.
 *
 * @param {string} url - The URL path to extract courseId and moduleId from. If not provided, uses current page URL
 * @returns {Promise<string|null>} The URL of the course completion page or null if not found
 */
export async function getCourseCompletionPageUrl(url = window.location.pathname) {
  const courseInfo = await getCurrentCourseMeta(url);
  if (!courseInfo || !courseInfo?.courseCompletionPage) {
    return null;
  }
  return courseInfo.courseCompletionPage;
}

/**
 * Checks if the current module is the last module of the course.
 *
 * @param {string} url - The URL path to extract courseId and moduleId from. If not provided, uses current page URL
 * @returns {Promise<boolean>} True if current module is the last module of the course, false otherwise
 */
export async function isLastModuleOfCourse(url = window.location.pathname) {
  const courseInfo = await getCurrentCourseMeta(url);
  if (!courseInfo || !courseInfo.modules || !Array.isArray(courseInfo.modules) || courseInfo.modules.length === 0) {
    return false;
  }
  const { moduleId: currentModuleId } = extractCourseModuleIds(url);

  if (!currentModuleId) {
    return false;
  }

  const currentModuleIndex = courseInfo.modules.findIndex((moduleUrl) => {
    const { moduleId } = extractCourseModuleIds(moduleUrl);
    return moduleId === currentModuleId;
  });
  return currentModuleIndex === courseInfo.modules.length - 1;
}
