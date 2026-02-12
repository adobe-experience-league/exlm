import browseCardDataModel from '../data-model/browse-cards-model.js';
import ALM_CONTENT_TYPES from '../data-service/alm/alm-constants.js';
import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';

/**
 * Module that provides functionality for adapting ALM results to BrowseCards data model.
 * @module BrowseCardsALMAdaptor
 */
const BrowseCardsALMAdaptor = (() => {
  /**
   * Helper function to determine content type based on loType field.
   * @param {Object} result - The result object from ALM API.
   * @returns {string} The content type mapping key.
   * @private
   */
  const determineContentType = (result) => {
    const loType = result?.attributes?.loType;

    if (loType === 'learningProgram') {
      return ALM_CONTENT_TYPES.COHORT.MAPPING_KEY;
    }

    return ALM_CONTENT_TYPES.COURSE.MAPPING_KEY;
  };

  /**
   * Helper function to format duration from seconds to human-readable format.
   * @param {number} durationInSeconds - Duration in seconds from API.
   * @returns {string} Human-readable duration string.
   * @private
   */
  const formatDuration = (durationInSeconds) => {
    if (!durationInSeconds) return '';

    const seconds = parseInt(durationInSeconds, 10);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  // Constants for date calculations
  const MILLISECONDS_PER_DAY = 86400000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
  const DAYS_THRESHOLD_FOR_COUNTDOWN = 30; // Threshold for counting down days

  /**
   * Level labels mapping for skill levels
   */
  const LEVEL_LABELS = {
    1: 'Professional',
    2: 'Expert',
    3: 'Master',
  };



    /**
   * Normalize a date to midnight (00:00:00) for calendar day comparison
   * @param {Date} date - Date to normalize
   * @returns {Date} Normalized date at midnight
   */
  function normalizeToMidnight(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Calculate difference in calendar days between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Number of days between dates
   */
  function getDaysDifference(startDate, endDate) {
    const diffTime = endDate - startDate;
    return Math.round(diffTime / MILLISECONDS_PER_DAY);
  }

  /**
 * Compute the start label based on enrollment deadline.
 * Start date = enrollmentDeadline + 1 day.
 *
 * Rules:
 *  - Start date has passed or is today → return empty string
 *  - Start date within next 7 days → "Starts in X day(s)"
 *  - Start date beyond 7 days → "Starting soon"
 *
 * @param {string|Date} deadline - Enrollment deadline date
 * @returns {string} Start label text or empty string
 */
 function getStartLabelFromDeadline(deadline) {
  if (!deadline) return '';

  const startDate = new Date(new Date(deadline).getTime() + MILLISECONDS_PER_DAY);
  const today = normalizeToMidnight(new Date());
  const normalizedStartDate = normalizeToMidnight(startDate);

  const daysUntilStart = getDaysDifference(today, normalizedStartDate);

  if (daysUntilStart <= 0) return '';

  if (daysUntilStart <= DAYS_THRESHOLD_FOR_COUNTDOWN) {
    const dayLabel = daysUntilStart === 1 ? 'day' : 'days';
    return `Starts in ${daysUntilStart} ${dayLabel}`;
  }

  return 'Starting soon';
}

  const createALMLinkfromID = (contentType, id) => {

    const { cdnOrigin } = getConfig();
    const extractedID = id.split(':')?.[1] || '';
    const contentTypePath = contentType.split('-')[1] || '';
    const almLink = `${cdnOrigin}/en/premium/${contentTypePath}/${extractedID}`;
    return almLink || '';
  }

  /**
 * Check if a course is new (created within the last 90 days)
 * @param {Object} course - The course/learning object
 * @returns {boolean} True if the course is new (created within 90 days)
 */
 function isNewCourse(course) {
  const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
  const attrs = course.attributes || {};

  // Premium Learning Shows nee tag for only courses but designs show the tag for only cohorts - confirm 
  // const isOnDemand = attrs.loType === 'course';
  // if (!isOnDemand) return false;

  const createdDate = attrs.dateCreated ? new Date(attrs.dateCreated) : null;

  if (!createdDate) return false;

  const now = Date.now();
  const days90 = 90 * ONE_DAY_IN_SECONDS * 1000;


  return now - createdDate.getTime() <= days90;
}

/**
 * Build a map of learning object IDs to their skill levels
 * @param {Array} included - The included array from API response
 * @returns {Map} Map of learning object IDs to Sets of level numbers
 */
function buildLearningObjectSkillLevels(included) {
  const skillLevelById = new Map();
  const loSkillLevels = new Map();

  included.forEach((item) => {
    if (item.type === 'skillLevel') {
      const levelNum = parseInt(item.attributes?.level, 10);
      if (!Number.isNaN(levelNum)) {
        skillLevelById.set(item.id, levelNum);
      }
    }
  });

  included.forEach((item) => {
    if (item.type === 'learningObjectSkill') {
      const loId = item.attributes?.learningObjectId;
      const levelId = item.relationships?.skillLevel?.data?.id;
      const levelNum = levelId ? skillLevelById.get(levelId) : null;
      if (loId && levelNum) {
        if (!loSkillLevels.has(loId)) loSkillLevels.set(loId, new Set());
        loSkillLevels.get(loId).add(levelNum);
      }
    }
  });

  return loSkillLevels;
}

/**
 * Format skill levels into readable labels
 * @param {Set} levels - Set of level numbers
 * @param {Object} placeholders - Placeholders object with levelTbd key
 * @returns {string} Formatted level labels (e.g., "Professional, Expert")
 */
function formatSkillLevels(levels, placeholders = {}) {
  if (!levels || levels.size === 0) return placeholders.levelTbd || '';
  const labels = [...levels]
    .sort((a, b) => a - b)
    .map((lvl) => LEVEL_LABELS[lvl] || `Level ${lvl}`);
  return labels.join(', ');
}

function buildInstances(cardData, included) {
  const instances = cardData.relationships?.instances?.data;
  if (!instances) return [];
  return instances.map((instance) => {
    const instanceData = included.find((i) => i.id === instance.id);
    return {
      id: instanceData.id,
      name: instanceData.attributes?.localizedMetadata?.[0]?.name || '',
      locale: instanceData.attributes?.localizedMetadata?.[0]?.locale || '',
    };
  });
}

  /**
   * Maps a single ALM result to the BrowseCards data model.
   * @param {Object} result - The result object from ALM API.
   * @param {Array} included - The included data from ALM API.
   * @param {Object} placeholders - Language placeholders.
   * @returns {Object} The BrowseCards data model.
   * @private
   */
  const mapResultToCardsDataModel = (cardData, included, placeholders = {}) => {

    const result = cardData;

    const contentType = determineContentType(result);
    const { id, attributes } = result || {};
    const metadata = attributes?.localizedMetadata?.[0] || {};
    let startLabel = '';

    const loSkillLevels = buildLearningObjectSkillLevels(included);
    const skillLevels = formatSkillLevels(loSkillLevels.get(id), placeholders);

    const instances = buildInstances(cardData, included);
    
    if (contentType === ALM_CONTENT_TYPES.COHORT.MAPPING_KEY) {
      const instanceId = cardData.relationships?.instances?.data?.[0]?.id;

      const instance = included.find((i) => i.id === instanceId);
      const deadline = instance?.attributes?.enrollmentDeadline;
      startLabel = getStartLabelFromDeadline(deadline);
    }

    const isNew = isNewCourse(result);

    return {
      ...browseCardDataModel,
      id: id || '',
      contentType,
      thumbnail: attributes?.imageUrl || '',
      title: metadata.name || '',
      viewLink: createALMLinkfromID(contentType, id),
      copyLink: createALMLinkfromID(contentType, id),
      meta: {
        rating: {
          average: attributes?.rating?.averageRating || 0,
          count: attributes?.rating?.ratingsCount || 0,
        },
        duration: formatDuration(attributes?.duration),
        loFormat: attributes?.loFormat || '',
        loType: attributes?.loType || '',
        description: metadata.description || '',
        startLabel,
        isNew,
        level: skillLevels, // TODO: Add when field is available in API
        instances, // TODO: Add when field is available in API
      },
    };
  };

  /**
   * Maps an array of ALM results to an array of BrowseCards data models.
   * @param {Array} data - The array of result objects from ALM API.
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data) => {
    let placeholders = {};
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }

    return data.data.map((cardData) => mapResultToCardsDataModel(cardData, data.included, placeholders));
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsALMAdaptor;
