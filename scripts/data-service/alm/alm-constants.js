/**
 * @fileoverview ALM (Adobe Learning Manager) content type constants
 * Defines content type identifiers and labels for ALM learning objects
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
 * ALM content type definitions
 * Maps ALM learning object types to internal content type identifiers
 * 
 * @constant {Object} ALM_CONTENT_TYPES
 * @property {Object} COHORT - Learning program/cohort type
 * @property {string} COHORT.MAPPING_KEY - Internal identifier for cohorts
 * @property {string} COHORT.LABEL - Display label for cohorts
 * @property {Object} COURSE - Course type
 * @property {string} COURSE.MAPPING_KEY - Internal identifier for courses
 * @property {string} COURSE.LABEL - Display label for courses
 */
const ALM_CONTENT_TYPES = Object.freeze({
  COHORT: {
    MAPPING_KEY: 'alm-cohort',
    LABEL: placeholders.browseCardAlmCohortLabel || 'ALM Cohort',
  },
  COURSE: {
    MAPPING_KEY: 'alm-course',
    LABEL: placeholders.browseCardAlmCourseLabel || 'ALM Course',
  },
});

export default ALM_CONTENT_TYPES;
