/**
 * Course profile utilities
 */

import { defaultProfileClient } from '../auth/profile.js';
import { extractCourseModuleIds, getCurrentCourseMeta } from './course-utils.js';

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
 * Get current courses from user profile
 * @returns {Promise<Object>} Current courses object from user profile
 */
async function getCurrentCourses() {
  const profile = await defaultProfileClient.getMergedProfile();
  return profile.courses || {};
}

/**
 * Get course status based on user profile
 * @param {string} [url] - The URL path to extract courseId from. If not provided, uses current page URL
 * @returns {Promise<string>} Course status: COURSE_STATUS.NOT_STARTED, COURSE_STATUS.IN_PROGRESS, or COURSE_STATUS.COMPLETED
 */
async function getCourseStatus(url = window.location.pathname) {
  const { courseId } = extractCourseModuleIds(url);

  if (!courseId) {
    return COURSE_STATUS.NOT_STARTED;
  }

  const courses = await getCurrentCourses();
  const course = courses[courseId];

  if (!course) {
    return COURSE_STATUS.NOT_STARTED;
  }

  if (course.awardGranted) {
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
  const { courseId, moduleId } = extractCourseModuleIds(url);

  if (!courseId || !moduleId) {
    return MODULE_STATUS.DISABLED;
  }

  const [courses, courseMeta] = await Promise.all([getCurrentCourses(), getCurrentCourseMeta()]);

  if (!courseMeta || !courseMeta.modules) {
    return MODULE_STATUS.DISABLED;
  }

  const course = courses[courseId];
  if (!course || !course.modules) {
    return MODULE_STATUS.NOT_STARTED;
  }

  // Check if previous module is finished
  const moduleIndex = courseMeta.modules.findIndex((moduleUrl) => {
    const { moduleId: metaModuleId } = extractCourseModuleIds(moduleUrl);
    return metaModuleId === moduleId;
  });

  if (moduleIndex > 0) {
    const prevModuleUrl = courseMeta.modules[moduleIndex - 1];
    const { moduleId: prevModuleId } = extractCourseModuleIds(prevModuleUrl);
    const prevModule = course.modules[prevModuleId];

    if (!prevModule || !prevModule.finished) {
      return MODULE_STATUS.DISABLED;
    }
  }

  const currentModule = course.modules[moduleId];

  if (currentModule.finished) {
    return MODULE_STATUS.COMPLETED;
  }

  if (currentModule.started) {
    return MODULE_STATUS.IN_PROGRESS;
  }

  if (!currentModule) {
    return MODULE_STATUS.NOT_STARTED;
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
  const updatedCourses = { ...courses };
  const startTime = new Date().toISOString();

  // Initialize course if it doesn't exist
  if (!updatedCourses[courseId]) {
    updatedCourses[courseId] = {
      name: courseMeta.heading,
      description: courseMeta.description,
      modules: {},
    };
  }

  // Initialize module if it doesn't exist
  if (!updatedCourses[courseId].modules) {
    updatedCourses[courseId].modules = {};
  }

  // Set module start time only if not already set
  if (!updatedCourses[courseId].modules[moduleId]?.started) {
    updatedCourses[courseId].modules[moduleId] = {
      ...updatedCourses[courseId].modules[moduleId],
      started: startTime,
    };

    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile('courses', updatedCourses, true);
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
  const updatedCourses = { ...courses };
  const finishTime = new Date().toISOString();

  // Set module finish time only if not already set
  if (!updatedCourses[courseId].modules[moduleId]?.finished) {
    updatedCourses[courseId].modules[moduleId] = {
      ...updatedCourses[courseId].modules[moduleId],
      finished: finishTime,
    };

    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile('courses', updatedCourses, true);
  }
}

/**
 * Complete a course
 * @param {string} courseId - Course URL identifier
 * @returns {Promise<void>}
 */
async function completeCourse(url = window.location.pathname) {
  const { courseId } = extractCourseModuleIds(url);
  const courses = await getCurrentCourses();
  const updatedCourses = { ...courses };

  if (updatedCourses[courseId] && !updatedCourses[courseId].awardGranted) {
    updatedCourses[courseId].awardGranted = new Date().toISOString();

    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile('courses', updatedCourses, true);
  }
}

export {
  COURSE_STATUS,
  MODULE_STATUS,
  getCurrentCourses,
  getCourseStatus,
  getModuleStatus,
  startModule,
  finishModule,
  completeCourse,
};
