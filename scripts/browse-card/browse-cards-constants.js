/* Component Mapping Config Keys & Labels (Placeholder values) */

import { fetchLanguagePlaceholders } from '../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

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
export const BASE_COVEO_ADVANCED_QUERY_UPCOMING_EVENT =
  '(@el_contenttype = "Event") OR (@el_contenttype = "Upcoming Event")';
/**
 * Upcoming events that have not started yet.
 *
 * Coveo stages `el_event_start_time` as a string field, so date operators like
 * `@el_event_start_time >= now` are ignored. Event start is reflected on the
 * standard Date field `@date` (verified against stage Events Hub), which does
 * support `>= now`. Prefer switching `el_event_start_time` to a Date field in
 * Coveo when available, then update this expression.
 *
 * @see https://docs.coveo.com/en/1814/ (date operators, `now`)
 */
export const COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ = '(@el_contenttype = "Event|Upcoming Event" AND @date >= now)';
export const BASE_COVEO_ADVANCED_QUERY_EVENTS = `(@el_contenttype = "Event|On Demand Event") OR ${COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ}`;
/**
 * Exclude stale Upcoming Events while keeping all other content types.
 * Used by Atomic Search (/en/search) which has no Events-only base aq.
 */
export const COVEO_EXCLUDE_STALE_UPCOMING_AQ = `(NOT @el_contenttype = "Event|Upcoming Event") OR ${COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ}`;

export const VIDEO_THUMBNAIL_FORMAT = /^https:\/\/video\.tv\.adobe\.com\/v\/\w+\?format=jpeg$/;

export const COURSE_STATUS = Object.freeze({
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
});
