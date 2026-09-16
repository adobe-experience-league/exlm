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

/**
 * Upcoming events that have not started yet (Events Hub / Upcoming Event V2).
 *
 * Uses `el_event_start_time` (the same value shown as the event date on cards).
 * Requires Coveo field type **Date** — if the field is still String, `>= now` is
 * ignored and all Upcoming return. Do not use `@date`: on prod it is index/batch
 * time (same for all Upcoming), so `@date >= now` drops every Upcoming.
 *
 * Depends on: Coveo change String → Date for `el_event_start_time` + reindex.
 *
 * @see https://docs.coveo.com/en/1814/ (date operators, `now`)
 * @see EXLM-5361
 */
export const COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ =
  '(@el_contenttype = "Event|Upcoming Event" AND @el_event_start_time >= now)';
/**
 * Parenthesized as a whole (not just its OR operands) so callers can safely
 * AND further clauses onto it without Coveo AQL's AND-before-OR precedence
 * silently reordering the expression (see EXLM-5517 review discussion).
 */
export const BASE_COVEO_ADVANCED_QUERY_EVENTS = `((@el_contenttype = "Event|On Demand Event") OR ${COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ})`;
/**
 * Exclude stale Upcoming Events while keeping all other content types.
 * Used by Atomic Search (/en/search), which has no Events-only base aq, and
 * reused below for the default browse-filters base aq. Parenthesized as a
 * whole for the same AND/OR-precedence reason as BASE_COVEO_ADVANCED_QUERY_EVENTS.
 */
export const COVEO_EXCLUDE_STALE_UPCOMING_AQ = `((NOT @el_contenttype = "Event|Upcoming Event") OR ${COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ})`;
/**
 * Default browse-filters base aq (non-Events-V2 flow, e.g. /en/browse#f-el_contenttype=Event|Upcoming Event).
 * Excludes Community|User content and, per EXLM-5517, stale Upcoming Events.
 */
export const BASE_COVEO_ADVANCED_QUERY = `(@el_contenttype NOT "Community|User") AND ${COVEO_EXCLUDE_STALE_UPCOMING_AQ}`;

export const VIDEO_THUMBNAIL_FORMAT = /^https:\/\/video\.tv\.adobe\.com\/v\/\w+\?format=jpeg$/;

export const COURSE_STATUS = Object.freeze({
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
});
