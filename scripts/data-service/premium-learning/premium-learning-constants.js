/**
 * @fileoverview Premium Learningcontent type constants
 * Defines content type identifiers and labels for Premium Learning objects
 */

import { fetchLanguagePlaceholders } from '../../scripts.js';

/* Load placeholders for localized labels */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Premium Learning content type definitions
 * Maps Premium Learning object types to internal content type identifiers
 *
 * @constant {Object} PL_CONTENT_TYPES
 * @property {Object} COHORT - Learning program/cohort type
 * @property {string} COHORT.MAPPING_KEY - Internal identifier for cohorts
 * @property {string} COHORT.LABEL - Display label for cohorts
 * @property {Object} COURSE - Course type
 * @property {string} COURSE.MAPPING_KEY - Internal identifier for courses
 * @property {string} COURSE.LABEL - Display label for courses
 */
const PL_CONTENT_TYPES = Object.freeze({
  COHORT: {
    MAPPING_KEY: 'premium-learning-cohort',
    LABEL: placeholders.browseCardPremiumLearningCohortLabel || 'Premium Learning Cohort',
  },
  COURSE: {
    MAPPING_KEY: 'premium-learning-course',
    LABEL: placeholders.browseCardPremiumLearningCourseLabel || 'Premium Learning Course',
  },
});

export default PL_CONTENT_TYPES;
