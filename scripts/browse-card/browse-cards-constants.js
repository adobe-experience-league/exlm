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
 * Upcoming Event content-type clause used by Events Hub / Upcoming Event V2.
 *
 * Do **not** use `@date >= now` here: on prod Coveo, `@date` is document index time
 * (not event start), so that predicate drops *all* Upcoming — including future ones.
 * `el_event_start_time` is a String field, so Coveo date operators on it are ignored.
 *
 * Fetch all Upcoming via this aq, then drop stale rows client-side with
 * {@link isStaleUpcomingCoveoResult} / {@link filterStaleUpcomingCoveoResults}.
 *
 * Prefer a Coveo Date field mapped from event start when available, then restore a date aq.
 *
 * @see https://docs.coveo.com/en/1814/ (date operators, `now`)
 */
export const COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ = '(@el_contenttype = "Event|Upcoming Event")';
export const BASE_COVEO_ADVANCED_QUERY_EVENTS = `(@el_contenttype = "Event|On Demand Event") OR ${COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ}`;
/**
 * Atomic Search (/en/search): keep non-Upcoming results, and only Upcoming whose `@date >= now`.
 *
 * Intentionally still uses `@date` (not the Events Hub client-side path). On prod this may
 * hide Upcoming in global search until event start is mapped to a Date field — preferred to
 * surfacing expired Upcoming in `/en/search`. Events Hub filters via `el_event_start_time`.
 *
 * Keep this expression independent of {@link COVEO_UPCOMING_EVENT_STILL_FUTURE_AQ} so it does
 * not collapse into a tautology.
 */
export const COVEO_EXCLUDE_STALE_UPCOMING_AQ =
  '(NOT @el_contenttype = "Event|Upcoming Event") OR (@el_contenttype = "Event|Upcoming Event" AND @date >= now)';

const UPCOMING_EVENT_CONTENT_TYPE = 'Event|Upcoming Event';

/**
 * True when a Coveo result is an Upcoming Event whose `el_event_start_time` is in the past.
 * @param {Object} result - Raw Coveo result (or `{ raw }` shape)
 * @returns {boolean}
 */
export function isStaleUpcomingCoveoResult(result) {
  const raw = result?.raw || result || {};
  const contentType = raw.el_contenttype;
  const types = Array.isArray(contentType) ? contentType : [contentType];
  const isUpcoming = types.some((t) => String(t || '').trim() === UPCOMING_EVENT_CONTENT_TYPE);
  if (!isUpcoming) return false;

  const start = raw.el_event_start_time;
  if (!start) return false;
  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) return false;
  return startMs < Date.now();
}

/**
 * Drops stale Upcoming Event hits; leaves all other content types unchanged.
 * @param {Array} results
 * @returns {Array}
 */
export function filterStaleUpcomingCoveoResults(results = []) {
  if (!Array.isArray(results) || !results.length) return results || [];
  return results.filter((result) => !isStaleUpcomingCoveoResult(result));
}

export const VIDEO_THUMBNAIL_FORMAT = /^https:\/\/video\.tv\.adobe\.com\/v\/\w+\?format=jpeg$/;

export const COURSE_STATUS = Object.freeze({
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
});
