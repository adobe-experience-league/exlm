

import { defaultProfileClient } from '../auth/profile.js';
import { extractCourseModuleIds, getCurrentCourseMeta } from './course-utils.js';

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
 * Start a module in a course
 * @param {string} courseId - Course URL identifier
 * @param {string} moduleId - Module URL identifier
 * @returns {Promise<void>}
 */
async function startModule(url = window.location.pathname) {
  const { courseId, moduleId } = extractCourseModuleIds(url);
  const courseMeta = await getCurrentCourseMeta();
  
  if (!courseMeta) {
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
      modules: {}
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
      started: startTime
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
      finished: finishTime
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
  getCurrentCourses,
  startModule,
  finishModule,
  completeCourse
};
