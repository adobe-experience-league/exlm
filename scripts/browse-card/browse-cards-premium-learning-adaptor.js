import browseCardDataModel from '../data-model/browse-cards-model.js';
import PL_CONTENT_TYPES from '../data-service/premium-learning/premium-learning-constants.js';
import { fetchLanguagePlaceholders, getConfig, getPathDetails } from '../scripts.js';

/**
 * Build a map of learning object IDs to their skill levels
 * @param {Array} included - The included array from API response
 * @returns {Map} Map of learning object IDs to Sets of level numbers
 */
export function buildLearningObjectSkillLevels(included) {
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
 * Format skill levels into readable labels using placeholders
 * @param {Set} levels - Set of level numbers
 * @param {Object} placeholders - Placeholders object for localization (premiumLearningProfessional, premiumLearningExpert, premiumLearningMaster)
 * @returns {string} Formatted level labels (e.g., "Professional, Expert")
 */
export function formatSkillLevels(levels, placeholders = {}) {
  if (!levels || levels.size === 0) return '';

  const levelLabels = {
    1: placeholders.premiumLearningProfessional || 'Professional',
    2: placeholders.premiumLearningExpert || 'Expert',
    3: placeholders.premiumLearningMaster || 'Master',
  };

  const labels = [...levels].sort((a, b) => a - b).map((lvl) => levelLabels[lvl] || `Level ${lvl}`);
  return labels.join(', ');
}

/**
 * Module that provides functionality for adapting premium-learning results to BrowseCards data model.
 * @module BrowseCardsPLAdaptor
 */
const BrowseCardsPLAdaptor = (() => {
  /**
   * Helper function to determine content type based on loType field.
   * @param {Object} result - The result object from premium-learning API.
   * @returns {string} The content type mapping key.
   * @private
   */
  const determineContentType = (result) => {
    const loType = result?.attributes?.loType;

    if (loType === 'learningProgram') {
      return PL_CONTENT_TYPES.COHORT.MAPPING_KEY;
    }

    return PL_CONTENT_TYPES.COURSE.MAPPING_KEY;
  };

  /**
   * True when enrollment is closed: current time is after the deadline instant (no grace day).
   * @param {string|Date} deadline - Enrollment deadline from API
   * @returns {boolean}
   * @private
   */
  function isEnrollmentExpired(deadline) {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const deadlineMs = deadlineDate.getTime();
    // e.g. new Date("") → Invalid Date; comparisons with NaN are always false — treat as "not past deadline" explicitly.
    if (Number.isNaN(deadlineMs)) return false;
    return Date.now() > deadlineMs;
  }

  /**
   * @param {Object|null|undefined} instance - Primary learning object instance from PL API `included`
   * @returns {boolean}
   * @private
   */
  function isActiveEnrollableInstance(instance) {
    return (
      !!instance &&
      String(instance.attributes?.state || '').toLowerCase() === 'active' &&
      !isEnrollmentExpired(instance.attributes?.enrollmentDeadline)
    );
  }

  /**
   * First learning-program instance in relationship order that is active and still enrollable.
   * @param {Object} cardData - Primary LO from Premium Learning API `data`
   * @param {Array<Object>} included - `included` from the same payload
   * @returns {Object|undefined} Matching included resource, if any
   * @private
   */
  function findActiveEnrollableCohortInstance(cardData, included) {
    const refs = cardData.relationships?.instances?.data;
    if (!refs?.length) return undefined;
    return refs
      .map((ref) => {
        const id = ref?.id;
        return id ? included.find((i) => i.id === id) : undefined;
      })
      .find(isActiveEnrollableInstance);
  }

  /**
   * Helper function to format duration based on learning type.
   * For learning programs (cohort): shows weeks based on sections count (excluding Week 0 and Quiz Week)
   * For on-demand courses: shows minutes or hours based on duration in seconds
   * @param {object} attributes - The learning object attributes
   * @param {object} placeholders - Optional placeholders for localized labels
   */
  const formatDuration = (attributes, placeholders = {}) => {
    // For learning programs (cohort), use sections count as weeks
    if (attributes?.loType === 'learningProgram') {
      const sections = Array.isArray(attributes?.sections) ? attributes.sections : [];
      const sectionsWithMetadata = sections.filter(
        (section) => Array.isArray(section.localizedMetadata) && section.localizedMetadata.length > 0,
      );
      const totalWeeks = sectionsWithMetadata.length || sections.length;
      if (!totalWeeks) return '';
      // Exclude Week 0 (onboarding) and Quiz Week from displayed duration
      const displayWeeks = totalWeeks > 2 ? totalWeeks - 2 : totalWeeks;
      const label =
        displayWeeks === 1 ? placeholders.premiumLearningWeek || 'week' : placeholders.premiumLearningWeeks || 'weeks';
      return `${displayWeeks} ${label}`;
    }

    // For on-demand courses, use duration in seconds
    const rawSeconds = Number(attributes?.duration) || 0;
    if (!rawSeconds) return '';

    const totalMinutes = rawSeconds / 60;

    // If less than 60 minutes, show in minutes
    if (totalMinutes < 60) {
      const roundedMinutes = Math.max(1, Math.round(totalMinutes));
      const label =
        roundedMinutes === 1 ? placeholders.premiumLearningMin || 'min' : placeholders.premiumLearningMins || 'mins';
      return `${roundedMinutes} ${label}`;
    }

    // 60 minutes or more, show in hours
    const hours = rawSeconds / 3600;
    let roundedHours;
    if (Number.isInteger(hours)) {
      roundedHours = hours;
    } else {
      roundedHours = Number(hours.toFixed(1));
    }
    const label =
      roundedHours === 1 ? placeholders.premiumLearningHour || 'hour' : placeholders.premiumLearningHours || 'hours';
    return `${roundedHours} ${label}`;
  };

  // Constants for date calculations
  const MILLISECONDS_PER_DAY = 86400000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
  const DAYS_THRESHOLD_FOR_COUNTDOWN = 30; // Threshold for counting down days

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

    const deadlineMs = new Date(deadline).getTime();
    const startDate = new Date(deadlineMs + MILLISECONDS_PER_DAY);
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

  const createPLLinkfromID = (contentType, id) => {
    const { cdnOrigin } = getConfig();
    const lang = getPathDetails()?.lang || 'en';
    const extractedID = id.split(':')?.[1] || '';
    const contentTypeParts = contentType.split('-');
    const contentTypePath = contentTypeParts[contentTypeParts.length - 1] || '';
    const premiumlearningLink = `${cdnOrigin}/${lang}/premium/${contentTypePath}/${extractedID}`;
    return premiumlearningLink || '';
  };

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
   * Determine the format label based on loType and tags
   * @param {string} loType - The learning object type (course or learningProgram)
   * @param {Array} tags - Array of tags from the learning object
   * @param {Object} placeholders - Language placeholders for i18n
   * @returns {string} The format label to display
   */
  function getFormatLabel(loType, tags = [], placeholders = {}) {
    if (loType === 'learningProgram') {
      return placeholders.premiumLearningCohortLabel || 'Cohort';
    }

    if (loType === 'course') {
      const hasLiveSession = tags.includes('Live Session');
      return hasLiveSession
        ? placeholders.premiumLearningViltLabel || 'Live Instructor'
        : placeholders.premiumLearningOnDemandLabel || 'On-Demand';
    }

    return '';
  }

  /**
   * Maps a single Premium learning result to the BrowseCards data model.
   * @param {Object} result - The result object from Premium learning API.
   * @param {Array} included - The included data from Premium learning API.
   * @param {Map<string, Object|undefined>} [activeCohortInstanceByLoId] - Precomputed `findActiveEnrollableCohortInstance` per cohort LO id (avoids duplicate scans when used with `mapResultsToCardsData`).
   * @param {Object} [placeholders] - Language placeholders.
   * @returns {Object} The BrowseCards data model.
   * @private
   */
  const mapResultToCardsDataModel = (cardData, included, activeCohortInstanceByLoId, placeholders = {}) => {
    const result = cardData;

    const contentType = determineContentType(result);
    const { id, attributes } = result || {};
    const metadata = attributes?.localizedMetadata?.[0] || {};
    const products = (attributes?.products || []).map((product) => product?.name).filter(Boolean);
    let startLabel = '';

    // Get skill levels for both cohorts and courses
    const skillLevels = formatSkillLevels(buildLearningObjectSkillLevels(included).get(id), placeholders);

    const instances = buildInstances(cardData, included);

    let deadline = null;
    if (contentType === PL_CONTENT_TYPES.COHORT.MAPPING_KEY) {
      const activeInstance = activeCohortInstanceByLoId
        ? activeCohortInstanceByLoId.get(id)
        : findActiveEnrollableCohortInstance(cardData, included);
      const fallbackId = cardData.relationships?.instances?.data?.[0]?.id;
      // Deliberate product tradeoff: with no active instance (bookmarks / filter off), we still surface data[0]'s
      // deadline so the card has metadata; that instance may be expired, so countdown / start labels can be stale.
      const instance = activeInstance || (fallbackId ? included.find((i) => i.id === fallbackId) : undefined);
      deadline = instance?.attributes?.enrollmentDeadline;
      startLabel = getStartLabelFromDeadline(deadline);
    }

    const duration = formatDuration(attributes, placeholders);
    const loType = attributes?.loType || '';
    const tags = attributes?.tags || [];
    const typeLabel = getFormatLabel(loType, tags, placeholders);

    return {
      ...browseCardDataModel,
      id: id || '',
      contentType,
      product: products,
      thumbnail: attributes?.imageUrl || '',
      title: metadata.name || '',
      description: metadata.overview || metadata.description || '',
      viewLink: createPLLinkfromID(contentType, id),
      copyLink: createPLLinkfromID(contentType, id),
      products: attributes?.products ?? [],
      meta: {
        rating: {
          average: attributes?.rating?.averageRating || 0,
          count: attributes?.rating?.ratingsCount || 0,
        },
        duration,
        typeLabel,
        loType,
        description: metadata.description || '',
        startLabel,
        level: skillLevels,
        instances,
        deadline,
        products,
      },
    };
  };

  /**
   * Maps an array of Premium learning results to an array of BrowseCards data models.
   * @param {Object} data - Premium learning API payload (`data`, `included`).
   * @param {{ filterInactiveCohortInstances?: boolean }} [options] - When `filterInactiveCohortInstances` is true (default),
   *   learning programs (cohorts) without an active, enrollable primary instance are omitted. Courses are never filtered here.
   * @returns {Promise<Array>} A promise that resolves with an array of BrowseCards data models.
   */
  const mapResultsToCardsData = async (data, { filterInactiveCohortInstances = true } = {}) => {
    let placeholders = {};
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }

    const included = data.included || [];
    let rows = data.data || [];

    // One scan per cohort LO; reused by the optional filter and by mapResult (avoids duplicate findActiveEnrollableCohortInstance).
    const activeCohortInstanceByLoId = new Map();
    rows.forEach((cardData) => {
      if (determineContentType(cardData) === PL_CONTENT_TYPES.COHORT.MAPPING_KEY) {
        activeCohortInstanceByLoId.set(cardData.id, findActiveEnrollableCohortInstance(cardData, included));
      }
    });

    if (filterInactiveCohortInstances) {
      rows = rows.filter((cardData) => {
        if (determineContentType(cardData) !== PL_CONTENT_TYPES.COHORT.MAPPING_KEY) {
          return true;
        }
        return !!activeCohortInstanceByLoId.get(cardData.id);
      });
    }

    return rows.map((cardData) =>
      mapResultToCardsDataModel(cardData, included, activeCohortInstanceByLoId, placeholders),
    );
  };

  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsPLAdaptor;
