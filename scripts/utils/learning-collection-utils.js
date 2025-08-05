import { fetchJson, getPathDetails } from '../scripts.js';

// Cache key for session storage
const LEARNING_COLLECTIONS_CACHE_KEY = 'learning_collections_data';

/**
 * Gets cached data from session storage
 * @returns {Array|null} Cached data or null if not found
 */
function getCachedData() {
  try {
    const cached = sessionStorage.getItem(LEARNING_COLLECTIONS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Error reading from session storage:', error);
    return null;
  }
}

/**
 * Stores data in session storage
 * @param {Array} data - Data to cache
 */
function setCachedData(data) {
  try {
    sessionStorage.setItem(LEARNING_COLLECTIONS_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Error writing to session storage:', error);
  }
}

/**
 * Fetches learning collection data from the JSON index file
 * @returns {Promise<Array>} Learning collection data
 */
export async function fetchData() {
  try {
    // Check session storage first
    const cachedData = getCachedData();
    if (cachedData) {
      return cachedData;
    }

    const { lang } = getPathDetails();
    const path = `${window.hlx.codeBasePath}/${lang}/learning-collections.json`;
    const fallback = `${window.hlx.codeBasePath}/en/learning-collections.json`;
    const resp = await fetchJson(path, fallback);
    
    // Cache the fetched data
    setCachedData(resp);
    
    return resp;
  } catch (error) {
    console.error('Error fetching learning collection data:', error);
    return [];
  }
}

/**
 * Extracts the learning collection path from a URL
 * @param {string} url - The URL to parse
 * @returns {string} The learning collection path
 */
function extractLearningCollectionPath(url) {
  if (!url) return null;

  // Remove leading slash if present
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

  // Split by '/' and find learning-collections
  const parts = cleanUrl.split('/');
  const learningCollectionsIndex = parts.findIndex(part => part === 'learning-collections');

  if (learningCollectionsIndex === -1) return null;

  // Return the learning collection identifier (next part after learning-collections)
  return parts[learningCollectionsIndex + 1] || null;
}

/**
 * Extracts the skill track path from a URL
 * @param {string} url - The URL to parse
 * @returns {string} The skill track path
 */
function extractSkillTrackPath(url) {
  if (!url) return null;

  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const parts = cleanUrl.split('/');
  const learningCollectionsIndex = parts.findIndex(part => part === 'learning-collections');

  if (learningCollectionsIndex === -1) return null;

  // Check if there's a skill track part (after learning collection)
  const skillTrackIndex = learningCollectionsIndex + 2;
  return parts[skillTrackIndex] || null;
}

/**
 * Finds the parent skill track data for a given URL
 * @param {Array} data - The learning collection JSON data
 * @param {string} url - The URL to find parent for
 * @returns {Object|null} The parent skill track data
 */
function findParentSkillTrack(data, url) {
  if (!data || !url) return null;

  const collectionPath = extractLearningCollectionPath(url);
  const skillTrackPath = extractSkillTrackPath(url);

  if (!collectionPath || !skillTrackPath) return null;

  // Find the skill track entry
  return data.find(item => {
    const itemPath = item.path || '';
    return itemPath.includes(`/learning-collections/${collectionPath}/${skillTrackPath}`) &&
      itemPath.split('/').length === 5; // Skill track level
  }) || null;
}

/**
 * Gets all steps for a skill track in order
 * @param {Array} data - The learning collection JSON data
 * @param {Array} skillTrackSteps - Array of step URLs from skill track
 * @returns {Array} Array of step data with name, description, url
 */
function getOrderedSteps(data, skillTrackSteps) {
  if (!data || !skillTrackSteps || !Array.isArray(skillTrackSteps)) return [];

  return skillTrackSteps.map(stepUrl => {
    const stepData = data.find(item => item.path === stepUrl);
    return {
      name: stepData?.title || '',
      description: stepData?.description || '',
      url: stepUrl
    };
  });
}

/**
 * Gets comprehensive learning collection information for a given step URL
 * @param {string} url - The step URL to get information for
 * @returns {Promise<Object>} Formatted learning collection step information
 */
export async function getStepInfo(url) {
  try {
    const data = await fetchData();
    if (!data || !url) return null;

    const parentSkillTrack = findParentSkillTrack(data, url);
    if (!parentSkillTrack) return null;

    const collectionPath = extractLearningCollectionPath(url);
    const collectionUrl = `/en/learning-collections/${collectionPath}/`;

    // Get ordered steps
    const skillTrackSteps = getOrderedSteps(data, parentSkillTrack.skillTrackSteps || []);
    
    // Create complete navigation array: steps + recap + quiz
    const allSteps = [...skillTrackSteps];
    
    // Add recap if it exists
    if (parentSkillTrack.skillTrackRecap) {
      const recapData = data.find(item => item.path === parentSkillTrack.skillTrackRecap);
      if (recapData) {
        allSteps.push({
          name: recapData.title || '',
          description: recapData.description || '',
          url: parentSkillTrack.skillTrackRecap
        });
      }
    }
    
    // Add quiz if it exists
    if (parentSkillTrack.skillTrackQuiz) {
      const quizData = data.find(item => item.path === parentSkillTrack.skillTrackQuiz);
      if (quizData) {
        allSteps.push({
          name: quizData.title || '',
          description: quizData.description || '',
          url: parentSkillTrack.skillTrackQuiz
        });
      }
    }
    
    const totalSteps = allSteps.length;

    // Find current step index
    const currentStepIndex = allSteps.findIndex(step => step.url === url);
    const currentStep = currentStepIndex + 1;

    // Get next and previous steps
    const nextStep = currentStepIndex < totalSteps - 1 ? allSteps[currentStepIndex + 1].url : null;
    const prevStep = currentStepIndex > 0 ? allSteps[currentStepIndex - 1].url : null;

    // Check if current page is recap or quiz
    const isRecap = url === parentSkillTrack.skillTrackRecap;
    const isQuiz = url === parentSkillTrack.skillTrackQuiz;

    return {
      skillTrackHeader: parentSkillTrack.skillTrackHeader || '',
      skillTrackDescription: parentSkillTrack.skillTrackDescription || '',
      skillTrackRecap: parentSkillTrack.skillTrackRecap || '',
      skillTrackQuiz: parentSkillTrack.skillTrackQuiz || '',
      skillTrackSteps: allSteps,
      totalSteps,
      currentStep,
      nextStep,
      prevStep,
      collectionUrl,
      isRecap,
      isQuiz,
    };
  } catch (error) {
    console.error('Error getting learning collection step info:', error);
    return null;
  }
}

/**
 * Gets learning collection step information for the current page URL
 * @returns {Promise<Object>} Formatted learning collection step information
 */
export async function getCurrentStepInfo() {
  const currentUrl = window.location.pathname;
  return getStepInfo(currentUrl);
}

