/* Component Mapping Config Keys & Labels (Placeholder values) */

import { fetchLanguagePlaceholders } from '../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export const CONTENT_TYPES = Object.freeze({
  COURSE: {
    MAPPING_KEY: 'course',
    LABEL: placeholders.browseCardCourseLabel || 'Course',
  },
  TUTORIAL: {
    MAPPING_KEY: 'tutorial',
    LABEL: placeholders.browseCardTutorialLabel || 'Tutorial',
  },
  DOCUMENTATION: {
    MAPPING_KEY: 'documentation',
    LABEL: placeholders.browseCardDocumentationLabel || 'Documentation',
  },
  TROUBLESHOOTING: {
    MAPPING_KEY: 'troubleshooting',
    LABEL: placeholders.browseCardTroubleshootingLabel || 'Troubleshooting',
  },
  EVENT: {
    MAPPING_KEY: 'event',
    LABEL: placeholders.browseCardEventLabel || 'On-Demand Event',
  },
  COMMUNITY: {
    MAPPING_KEY: 'community',
    LABEL: placeholders.browseCardCommunityLabel || 'Community',
  },
  CERTIFICATION: {
    MAPPING_KEY: 'certification',
    LABEL: placeholders.browseCardCertificationLabel || 'Certification',
  },
  LIVE_EVENT: {
    MAPPING_KEY: 'live-event',
    LABEL: placeholders.browseCardLiveEventLabel || 'Live Event',
  },
  INSTRUCTOR_LED: {
    MAPPING_KEY: 'instructor-led-training',
    LABEL: placeholders.browseCardInstructorLedLabel || 'Instructor-Led',
  },
  PERSPECTIVE: {
    MAPPING_KEY: 'perspective',
    LABEL: placeholders.browseCardPerspectiveLabel || 'Perspective',
  },
});

export const COVEO_SORT_OPTIONS = Object.freeze({
  RELEVANCE: 'relevancy',
  MOST_RECENT: 'date descending',
  MOST_POPULAR: '@el_view_count descending',
});

export const COVEO_DATE_OPTIONS = Object.freeze({
  WITHIN_ONE_MONTH: 'within_one_month',
  WITHIN_SIX_MONTHS: 'within_six_months',
  WITHIN_ONE_YEAR: 'within_one_year',
  MORE_THAN_ONE_YEAR_AGO: 'more_than_one_year_ago',
});

export const ROLE_OPTIONS = Object.freeze({
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  LEADER: 'Leader',
  USER: 'User',
});

export const COMMUNITY_SEARCH_FACET = Object.freeze([
  {
    value: 'Questions',
    state: 'selected',
  },
  {
    value: 'Discussions',
    state: 'selected',
  },
  {
    value: 'Ideas',
    state: 'selected',
  },
  {
    value: 'Blogs',
    state: 'selected',
  },
]);

export const RECOMMENDED_COURSES_CONSTANTS = Object.freeze({
  IN_PROGRESS: {
    MAPPING_KEY: 'inprogress-courses',
    LABEL: placeholders.recommendedCoursesinProgressLabel || 'In Progress courses',
  },
  RECOMMENDED: {
    MAPPING_KEY: 'recommended-courses',
    LABEL: placeholders.recommendedCoursesLabel || 'Recommended courses',
  },
  PATHS: {
    MAPPING_KEY: 'paths',
    LABEL: placeholders.recommendedCoursesPathsLabel || 'Paths',
  },
});

export const AUTHOR_TYPE = Object.freeze({
  EXTERNAL: 'External',
  ADOBE: 'Adobe',
});

export const BASE_COVEO_ADVANCED_QUERY = '(@el_contenttype NOT "Community|User")';
