/**
 * Course profile utilities
 */

import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import {
  extractCourseModuleIds,
  getCurrentCourseMeta,
  getCourseCompletionPageUrl,
  urlContainsModule,
} from './course-utils.js';
import {
  pushModuleStartEvent,
  pushModuleCompletionEvent,
  pushCourseCompletionEvent,
  pushCourseStartEvent,
} from '../analytics/lib-analytics.js';
import { queueAnalyticsEvent } from '../analytics/analytics-queue.js';

const COURSE_KEY = 'courses_v2';

const COURSE_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

const MODULE_STATUS = {
  DISABLED: 'disabled',
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

/**
 * Utility functions for managing course progress in user profile
 */

/**
 * Find a course in the courses array by courseId
 * @param {Array} courses - Array of course objects
 * @param {string} courseId - Course identifier to find
 * @returns {Object|null} Found course or null
 */
function findCourse(courses, courseId) {
  return courses?.find((course) => course.courseId === courseId) || null;
}

/**
 * Find a module in a course's modules array by moduleId
 * @param {Object} course - Course object
 * @param {string} moduleId - Module identifier to find
 * @returns {Object|null} Found module or null
 */
function findModule(course, moduleId) {
  return course?.modules?.find((module) => module.moduleId === moduleId) || null;
}

/**
 * Get current courses from user profile
 * @returns {Promise<Array>} Current courses array from user profile
 */
async function getCurrentCourses() {
  const profile = await defaultProfileClient.getMergedProfile();
  return profile?.[COURSE_KEY] || [];
}

/**
 * Get the last added module from the current course
 * @returns {Promise<string>} The last added module URL
 */
async function getLastAddedModule() {
  const courses = await getCurrentCourses();
  const courseMeta = await getCurrentCourseMeta();

  const { courseId: currentCourseId } = extractCourseModuleIds(window.location.pathname);
  const currentCourse = findCourse(courses, currentCourseId);

  if (
    courses.length === 0 ||
    !currentCourseId ||
    !currentCourse ||
    !currentCourse.modules ||
    currentCourse.modules.length === 0
  ) {
    return courseMeta?.modules?.[0];
  }

  let latestModuleId = null;
  let latestStartTime = null;

  currentCourse.modules.forEach((module) => {
    if (module?.startedAt && (!latestStartTime || new Date(module.startedAt) > new Date(latestStartTime))) {
      latestStartTime = module.startedAt;
      latestModuleId = module?.moduleId;
    }
  });

  if (!latestModuleId) {
    return courseMeta?.modules?.[0];
  }

  const moduleUrl = courseMeta?.modules?.find((url) => urlContainsModule(url, latestModuleId));

  return moduleUrl || courseMeta?.modules?.[0];
}

/**
 * Get course status based on user profile
 * @param {string} [url] - The URL path to extract courseId from. If not provided, uses current page URL
 * @returns {Promise<string>} Course status: COURSE_STATUS.NOT_STARTED, COURSE_STATUS.IN_PROGRESS, or COURSE_STATUS.COMPLETED
 */
async function getCourseStatus(url = window.location.pathname) {
  // If user is not signed in, return null
  if (!(await isSignedInUser())) {
    return null;
  }

  const { courseId } = extractCourseModuleIds(url);

  if (!courseId) {
    return COURSE_STATUS.NOT_STARTED;
  }

  const courses = await getCurrentCourses();
  const course = findCourse(courses, courseId);

  if (!course) {
    return COURSE_STATUS.NOT_STARTED;
  }

  if (course.awards?.timestamp) {
    return COURSE_STATUS.COMPLETED;
  }

  return COURSE_STATUS.IN_PROGRESS;
}

/**
 * Get module status based on user profile and course metadata
 * @param {string} [url] - The URL path to extract courseId and moduleId from. If not provided, uses current page URL
 * @returns {Promise<string>} Module status: MODULE_STATUS.DISABLED, MODULE_STATUS.NOT_STARTED, MODULE_STATUS.IN_PROGRESS, or MODULE_STATUS.COMPLETED
 */
async function getModuleStatus(url = window.location.pathname) {
  // If user is not signed in, return null
  if (!(await isSignedInUser())) {
    return null;
  }

  const { courseId, moduleId } = extractCourseModuleIds(url);

  if (!courseId || !moduleId) {
    return MODULE_STATUS.DISABLED;
  }

  const [courses, courseMeta] = await Promise.all([getCurrentCourses(), getCurrentCourseMeta()]);

  if (!courseMeta || !courseMeta.modules) {
    return MODULE_STATUS.DISABLED;
  }

  const course = findCourse(courses, courseId);

  if (!course || !course.modules || course.modules.length === 0) {
    // If the module is the first module of the course, return not started
    const firstModuleUrl = courseMeta?.modules?.[0];
    const firstModuleId = firstModuleUrl ? extractCourseModuleIds(firstModuleUrl)?.moduleId : null;
    if (firstModuleId && urlContainsModule(url, firstModuleId)) {
      return MODULE_STATUS.NOT_STARTED;
    }
    return MODULE_STATUS.DISABLED;
  }

  // Check if previous module is finished
  const moduleIndex =
    courseMeta?.modules?.findIndex((moduleUrl) => {
      const { moduleId: metaModuleId } = extractCourseModuleIds(moduleUrl);
      return metaModuleId === moduleId;
    }) ?? -1;

  if (moduleIndex > 0) {
    const prevModuleUrl = courseMeta.modules?.[moduleIndex - 1];
    const { moduleId: prevModuleId } = extractCourseModuleIds(prevModuleUrl);
    const prevModule = findModule(course, prevModuleId);

    if (!prevModule || !prevModule?.finishedAt) {
      return MODULE_STATUS.DISABLED;
    }
  }

  const currentModule = findModule(course, moduleId);

  if (currentModule?.finishedAt) {
    return MODULE_STATUS.COMPLETED;
  }

  if (currentModule?.startedAt) {
    return MODULE_STATUS.IN_PROGRESS;
  }

  return MODULE_STATUS.NOT_STARTED;
}

/**
 * Start a module in a course
 * @param {string} courseId - Course URL identifier
 * @param {string} moduleId - Module URL identifier
 * @returns {Promise<void>}
 */
async function startModule(url = window.location.pathname) {
  const { courseId, moduleId } = extractCourseModuleIds(url);
  const courseMeta = await getCurrentCourseMeta();

  if (!courseMeta) {
    // eslint-disable-next-line no-console
    console.error('Failed to get course metadata');
    return;
  }

  const courses = await getCurrentCourses();
  const updatedCourses = [...courses];
  const startTime = new Date().toISOString();

  // Find existing course or create new one
  let course = findCourse(updatedCourses, courseId);

  if (!course) {
    // Create new course
    course = {
      courseId,
      name: courseMeta.heading,
      modules: [],
    };
    updatedCourses.push(course);
  }

  // Initialize modules array if it doesn't exist
  if (!course.modules) {
    course.modules = [];
  }

  // Find existing module or create new one
  let module = findModule(course, moduleId);

  // Set module start time only if not already set
  if (!module) {
    // Create new module
    module = {
      moduleId,
      startedAt: startTime,
    };
    course.modules.push(module);

    const firstModuleUrl = courseMeta.modules?.[0];
    const isFirstModule = firstModuleUrl && urlContainsModule(firstModuleUrl, moduleId);

    // push course start event
    if (isFirstModule) {
      const courseFullSolution = courseMeta.solution || '';
      const courseSolution = courseFullSolution?.split(',')[0].trim() || '';

      await queueAnalyticsEvent(pushCourseStartEvent, {
        title: courseMeta.heading,
        id: courseId,
        solution: courseSolution,
        fullSolution: courseFullSolution,
        role: courseMeta.role,
        level: courseMeta.level || '',
        startTime,
      });
    }

    await queueAnalyticsEvent(pushModuleStartEvent, courseId);

    // Update the profile with the new courses data
    defaultProfileClient.updateProfile(COURSE_KEY, updatedCourses, true);
  } else if (!module.startedAt) {
    // Module exists but no start time - update it
    module.startedAt = startTime;

    const firstModuleUrl = courseMeta.modules?.[0];
    const isFirstModule = firstModuleUrl && urlContainsModule(firstModuleUrl, moduleId);

    // push course start event
    if (isFirstModule) {
      const courseFullSolution = courseMeta.solution || '';
      const courseSolution = courseFullSolution?.split(',')[0].trim() || '';

      await queueAnalyticsEvent(pushCourseStartEvent, {
        title: courseMeta.heading,
        id: courseId,
        solution: courseSolution,
        fullSolution: courseFullSolution,
        role: courseMeta.role,
        level: courseMeta.level || '',
        startTime,
      });
    }

    await queueAnalyticsEvent(pushModuleStartEvent, courseId);

    // Update the profile with the new courses data
    defaultProfileClient.updateProfile(COURSE_KEY, updatedCourses, true);
  }
}

/**
 * Finish a module in a course
 * @param {string} courseId - Course URL identifier
 * @param {string} moduleId - Module URL identifier
 * @returns {Promise<void>}
 */
async function finishModule(url = window.location.pathname) {
  const { courseId, moduleId } = extractCourseModuleIds(url);
  const courses = await getCurrentCourses();
  const updatedCourses = [...courses];
  const finishTime = new Date().toISOString();

  const course = findCourse(updatedCourses, courseId);
  if (!course) return;

  const module = findModule(course, moduleId);

  // Set module finish time only if not already set
  if (module && !module.finishedAt) {
    module.finishedAt = finishTime;

    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile(COURSE_KEY, updatedCourses, true);
    await queueAnalyticsEvent(pushModuleCompletionEvent, courseId);
  }
}

/**
 * Complete a course
 * @param {string} courseId - Course URL identifier
 * @returns {Promise<void>}
 */
async function completeCourse(url = window.location.pathname) {
  const { courseId, moduleId } = extractCourseModuleIds(url);
  const courses = await getCurrentCourses();
  const updatedCourses = [...courses];

  const course = findCourse(updatedCourses, courseId);

  if (course && !course.awards?.timestamp) {
    const finishTime = new Date().toISOString();

    // Mark the current module as finished if not already
    if (moduleId) {
      const module = findModule(course, moduleId);
      if (module && !module.finishedAt) {
        module.finishedAt = finishTime;
      }
    }

    // Set awards timestamp
    course.awards = {
      timestamp: finishTime,
    };

    // Get the course completion page url and extract the ID (without language)
    const courseCompletionUrl = await getCourseCompletionPageUrl(url);
    if (courseCompletionUrl) {
      const parts = courseCompletionUrl.split('/');
      const idParts = parts.slice(2);
      const id = idParts.join('/');
      course.awards.id = id;
    }

    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile(COURSE_KEY, updatedCourses, true);

    await queueAnalyticsEvent(pushModuleCompletionEvent, courseId);
    await queueAnalyticsEvent(pushCourseCompletionEvent, courseId, updatedCourses);
  }
}

/**
 * Get user's display name from profile
 * @returns {Promise<string|null>} User's display name or null if not available
 */
async function getUserDisplayName() {
  try {
    const profile = await defaultProfileClient.getMergedProfile();
    return profile?.displayName || null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error getting user display name:', e);
    return null;
  }
}

/**
 * Checks if a course is completed
 * @param {string} url - The URL path to extract courseId from. If not provided, uses current page URL
 * @returns {Promise<boolean>} True if course is completed, false otherwise
 */
async function isCourseCompleted(url = window.location.pathname) {
  const { courseId } = extractCourseModuleIds(url);
  const courses = await getCurrentCourses();
  const course = findCourse(courses, courseId);
  return !!course?.awards?.timestamp;
}

export {
  COURSE_STATUS,
  MODULE_STATUS,
  getCurrentCourses,
  getCourseStatus,
  getModuleStatus,
  getLastAddedModule,
  startModule,
  finishModule,
  completeCourse,
  getUserDisplayName,
  isCourseCompleted,
};
