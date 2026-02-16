// eslint-disable-next-line import/no-cycle
import SignupFlowDialog from './signup-flow-dialog.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getMetadata } from '../lib-franklin.js';

const AI_TRAINING_INTEREST_NAME = 'ai training';

/**
 * Checks if the current page is an AIM (AI Marketing) training course.
 * Detects by checking for "AI Training" in both solution and coveo-solution metadata.
 *
 * @returns {boolean} True if the current page is tagged with AI Training solution
 */
function isAIMCourse() {
  const coveoSolution = getMetadata('coveo-solution');
  const solution = getMetadata('solution');
  const allSolutions = `${coveoSolution},${solution}`.toLowerCase();
  return allSolutions.includes(AI_TRAINING_INTEREST_NAME);
}

/**
 * Fetches the AI Training interest data from the interests API.
 * @returns {Promise<Object|null>} The AI Training interest object with id and Name, or null if not found
 */
async function fetchAITrainingInterest() {
  try {
    // Access config from window.exlm.config to avoid importing from scripts.js (which would create a cycle)
    const interestsUrl = window.exlm?.config?.interestsUrl;
    if (!interestsUrl) {
      return null;
    }
    const response = await fetch(interestsUrl, {
      method: 'GET',
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const interests = data.data || [];
    const aiTrainingInterest = interests.find((interest) => interest.Name?.toLowerCase() === AI_TRAINING_INTEREST_NAME);
    return aiTrainingInterest || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching AI Training interest:', error);
    return null;
  }
}

/**
 * Automatically adds AI Training interest to the user's profile.
 * Called when a user signs in from an AIM course page.
 * @returns {Promise<boolean>} True if successfully added, false otherwise
 */
async function addAITrainingInterestToProfile() {
  try {
    const profileData = await defaultProfileClient.getMergedProfile();
    const interests = profileData?.interests || [];
    const hasAITraining = interests.some((interest) => interest.toLowerCase() === AI_TRAINING_INTEREST_NAME);

    if (hasAITraining) {
      return true;
    }

    const aiTrainingInterest = await fetchAITrainingInterest();

    if (!aiTrainingInterest) {
      return false;
    }

    const interactions = profileData?.interactions ?? [];
    const modalSeenInteraction = interactions.find((interaction) => interaction.event === 'modalSeen');

    const solutionLevels = profileData?.solutionLevels || [];
    const newInterests = [...interests, aiTrainingInterest.Name];
    const newSolutionLevels = [...solutionLevels, `${aiTrainingInterest.id}:Beginner`];

    const keysToUpdate = ['interests', 'solutionLevels'];
    const valuesToUpdate = [newInterests, newSolutionLevels];

    if (!modalSeenInteraction) {
      const otherInteractions = interactions.filter((interaction) => interaction.event !== 'modalSeen');
      otherInteractions.push({ event: 'modalSeen', timestamp: new Date().toISOString(), modalSeen: true });

      valuesToUpdate.push(otherInteractions);
      keysToUpdate.push('interactions');
    }

    await defaultProfileClient.updateProfile(keysToUpdate, valuesToUpdate, true);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error adding AI Training interest to profile:', error);
    return false;
  }
}

/**
 * Safely subtracts months from a given date, handling edge cases (e.g., February).
 * @param {Date} date - The original date
 * @param {number} months - The number of months to subtract
 * @returns {Date} The adjusted date
 */
function subtractMonths(date, months) {
  const newDate = new Date(date);
  const targetMonth = newDate.getMonth() - months;

  newDate.setMonth(targetMonth);

  // Ensure the day is valid in the new month (e.g., moving from March 31 to February should return Feb 28/29)
  if (newDate.getMonth() !== (targetMonth + 12) % 12) {
    newDate.setDate(0); // Set to the last valid day of the previous month
  }

  return newDate;
}

/**
 * Displays the signup modal based on the user's profile timestamp and interactions.
 *
 * - If the user has a profile timestamp older than today, the incomplete signup modal is shown.
 * - If the user has a profile timestamp that is newer than or equal to the signup modal configuration date,
 *   the new profile modal is shown.
 * - If the user has no interests and the modal has been seen before, the function checks if the
 *   modal should be re-displayed based on the `modalReDisplayDuration` value (in months).
 * - For AIM (AI Marketing) courses, the modal is skipped and AI Training interest is auto-added.
 *
 */
export default async function initSignupFlowHandler(signUpFlowConfigDate, modalReDisplayDuration) {
  if (!isSignedInUser()) {
    return;
  }

  if (isAIMCourse()) {
    await addAITrainingInterestToProfile();
    return;
  }

  const SIGNUP_DIALOG_TYPE = {
    INCOMPLETE_PROFILE: 'incomplete-profile',
    NEW_PROFILE: 'new-profile',
  };

  const configDate = new Date(signUpFlowConfigDate);
  const profileData = await defaultProfileClient.getMergedProfile();
  const interactions = profileData.interactions ?? [];
  const interests = profileData.interests ?? [];
  const profileTimeStamp = new Date(profileData.timestamp);
  const modalSeenInteraction = await defaultProfileClient.getLatestInteraction('modalSeen');

  const todayStartTimeStamp = new Date();
  todayStartTimeStamp.setHours(0, 0, 0, 0);

  if (modalSeenInteraction) {
    const modalSeenTimeStamp = new Date(modalSeenInteraction.timestamp);
    const modalReDisplayDate = subtractMonths(todayStartTimeStamp, modalReDisplayDuration);

    // Display Incomplete Sign up modal again if no interests and modalSeen timestamp is older than the configured date
    if (interests.length === 0 && modalSeenTimeStamp < modalReDisplayDate) {
      SignupFlowDialog.init(SIGNUP_DIALOG_TYPE.INCOMPLETE_PROFILE);
      const updatedInteractions = interactions.filter((interaction) => interaction.event !== 'modalSeen');

      // Push the updated modalSeen event with the new timestamp
      const currentTimestamp = new Date().toISOString();
      updatedInteractions.push({
        event: 'modalSeen',
        timestamp: currentTimestamp,
        modalSeen: true,
      });

      await defaultProfileClient.updateProfile('interactions', updatedInteractions, true);
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (profileTimeStamp < todayStartTimeStamp) {
      SignupFlowDialog.init(SIGNUP_DIALOG_TYPE.INCOMPLETE_PROFILE);
    } else if (profileTimeStamp >= configDate) {
      SignupFlowDialog.init(SIGNUP_DIALOG_TYPE.NEW_PROFILE);
    }
  }
}
