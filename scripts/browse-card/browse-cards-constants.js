/* API and Component Mapping Keys */
export const CONTENT_TYPES = Object.freeze({
  COURSE: {
    MAPPING_KEY: 'course',
    LABEL: 'Course',
  },
  TUTORIAL: {
    MAPPING_KEY: 'tutorial',
    LABEL: 'Tutorial',
  },
  EVENT: {
    MAPPING_KEY: 'event',
    LABEL: 'On-Demand Event',
  },
  COMMUNITY: {
    MAPPING_KEY: 'community',
    LABEL: 'Community',
  },
  LIVE_EVENTS: {
    MAPPING_KEY: 'live-events',
    LABEL: 'Live Events',
  },
  INSTRUCTOR_LED_TRANING: {
    MAPPING_KEY: 'instructor-led-training',
    LABEL: 'Instructor-Led',
  },
  CERTIFICATION: {
    MAPPING_KEY: 'certification',
    LABEL: 'Certification',
  },
  TROUBLESHOOTING: {
    MAPPING_KEY: 'troubleshooting',
    LABEL: 'Troubleshooting',
  },
  DOCUMENTATION: {
    MAPPING_KEY: 'documentation',
    LABEL: 'Documentation',
  },
});

export const COVEO_SORT_OPTIONS = Object.freeze({
  RELEVANCE: 'relevancy',
  MOST_RECENT: 'date descending',
  MOST_POPULAR: '@el_view_count descending',
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
