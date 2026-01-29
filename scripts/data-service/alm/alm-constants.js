import { fetchLanguagePlaceholders } from '../../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

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
