

import { defaultProfileClient } from '../auth/profile.js';

/**
 * Utility functions for managing course progress in user profile
 */

/**
 * Start a module in a course
 * @param {string} courseId - Course identifier
 * @param {string} name - Course name
 * @param {string} description - Course description
 * @param {string} moduleId - Module identifier
 * @returns {Promise<void>}
 */
async function startModule(courseId, name, description, moduleId) {
  const profile = await defaultProfileClient.getMergedProfile();
  const courses = profile.courses || {};
  const updatedCourses = { ...courses };
  const startTime = new Date().toISOString();
  
  // Initialize course if it doesn't exist
  if (!updatedCourses[courseId]) {
    updatedCourses[courseId] = {
      name,
      description,
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
 * @param {string} courseId - Course identifier
 * @param {string} moduleId - Module identifier
 * @returns {Promise<void>}
 */
async function finishModule(courseId, moduleId) {
  const profile = await defaultProfileClient.getMergedProfile();
  const courses = profile.courses || {};
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
 * @param {string} courseId - Course identifier
 * @returns {Promise<void>}
 */
async function completeCourse(courseId) {
  const profile = await defaultProfileClient.getMergedProfile();
  const courses = profile.courses || {};
  const updatedCourses = { ...courses };
  
  if (updatedCourses[courseId] && !updatedCourses[courseId].awardGranted) {
    updatedCourses[courseId].awardGranted = new Date().toISOString();
    
    // Update the profile with the new courses data
    await defaultProfileClient.updateProfile('courses', updatedCourses, true);
  }
}


export {
  startModule,
  finishModule,
  completeCourse
};
