import { fetchLanguagePlaceholders } from '../../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

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

export const CONTENT_TYPES = Object.freeze({
  PLAYLIST: {
    MAPPING_KEY: 'playlist',
    LABEL: placeholders.browseCardPlaylistLabel || 'Playlist',
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
    MAPPING_KEY: 'on-demand-event',
    LABEL: placeholders.browseCardEventLabel || 'On-Demand Event',
  },
  ON_DEMAND_EVENT: {
    MAPPING_KEY: 'on-demand-event',
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
  UPCOMING_EVENT: {
    MAPPING_KEY: 'upcoming-event',
    LABEL: placeholders.browseCardUpcomingEventLabel || 'Upcoming Event',
  },
  UPCOMING_EVENT_V2: {
    MAPPING_KEY: 'upcoming-event',
    LABEL: placeholders.browseCardUpcomingEventLabel || 'Upcoming Event',
  },
  INSTRUCTOR_LED: {
    MAPPING_KEY: 'instructor-led-training',
    LABEL: placeholders.browseCardInstructorLedLabel || 'Instructor-Led',
  },
  PERSPECTIVE: {
    MAPPING_KEY: 'perspective',
    LABEL: placeholders.browseCardPerspectiveLabel || 'Perspective',
  },
  'VIDEO CLIP': {
    MAPPING_KEY: 'video-clip',
    LABEL: placeholders.browseCardVideoClipLabel || 'Video Clip',
  },
  COURSE: {
    MAPPING_KEY: 'course',
    LABEL: placeholders.browseCardCourseLabel || 'Course',
  },
});

/**
 * Parses hierarchical Coveo content type values
 * Handles: "Event|On Demand Event" -> "on-demand-event"
 * Handles: "Event|Upcoming Event" -> "upcoming-event"
 */
export function parseContentType(contentTypeValue) {
  if (!contentTypeValue || typeof contentTypeValue !== 'string') {
    return '';
  }

  // Handle hierarchical format: "Event|On Demand Event" or "Event|Upcoming Event"
  if (contentTypeValue.includes('|')) {
    const parts = contentTypeValue.split('|');
    const result = parts[parts.length - 1].trim().toLowerCase().replace(/\s+/g, '-');
    // eslint-disable-next-line no-console
    console.log('[parseContentType] Input:', contentTypeValue, '-> Output:', result);
    return result;
  }

  // Backward compatibility: simple format
  const result = contentTypeValue.trim().toLowerCase().replace(/\s+/g, '-');
  // eslint-disable-next-line no-console
  console.log('[parseContentType] Simple format Input:', contentTypeValue, '-> Output:', result);
  return result;
}

/**
 * Gets display value from hierarchical content type
 * "Event|On Demand Event" -> "On Demand Event"
 */
export function getContentTypeDisplayValue(contentTypeValue) {
  if (!contentTypeValue || typeof contentTypeValue !== 'string') {
    return '';
  }

  if (contentTypeValue.includes('|')) {
    const parts = contentTypeValue.split('|');
    return parts[parts.length - 1].trim();
  }

  return contentTypeValue.trim();
}
