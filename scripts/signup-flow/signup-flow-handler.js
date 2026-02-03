// eslint-disable-next-line import/no-cycle
import SignupFlowDialog from './signup-flow-dialog.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { isAIMCourse } from '../courses/course-utils.js';
import { getConfig } from '../scripts.js';
import { pushAIMAutoSignupEvent } from '../analytics/lib-analytics.js';

/**
 * Fetches the AI Training interest data from the interests API.
 * @returns {Promise<Object|null>} The AI Training interest object with id and Name, or null if not found
 */
async function fetchAITrainingInterest() {
  try {
    const { interestsUrl } = getConfig();
    const response = await fetch(interestsUrl, {
      method: 'GET',
    });
    if (response.ok) {
      const data = await response.json();
      // Find AI Training in the interests data
      const aiTrainingInterest = data.data?.find(
        (interest) => interest.Name && interest.Name.toLowerCase() === 'ai training',
      );
      return aiTrainingInterest || null;
    }
    return null;
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
    const solutionLevels = profileData?.solutionLevels || [];

    // Check if AI Training already exists in interests
    const hasAITraining = interests.some((interest) => interest.toLowerCase() === 'ai training');

    if (hasAITraining) {
      // eslint-disable-next-line no-console
      console.log('AI Training interest already exists in profile');
      return true;
    }

    // Fetch AI Training interest data from API
    const aiTrainingInterest = await fetchAITrainingInterest();

    if (!aiTrainingInterest) {
      // eslint-disable-next-line no-console
      console.error('AI Training interest not found in API');
      return false;
    }

    // Add AI Training to interests and solutionLevels
    const newInterests = [...interests, aiTrainingInterest.Name];
    const newSolutionLevels = [...solutionLevels, `${aiTrainingInterest.id}:Beginner`];

    await defaultProfileClient.updateProfile(
      ['interests', 'solutionLevels'],
      [newInterests, newSolutionLevels],
      true,
    );

    // eslint-disable-next-line no-console
    console.log('AI Training interest added to profile successfully');
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

  // Check if user is on an AIM course page
  // If so, skip the modal and auto-add AI Training interest to profile
  if (isAIMCourse()) {
    // eslint-disable-next-line no-console
    console.log('AIM course detected - skipping signup modal and adding AI Training interest');
    const success = await addAITrainingInterestToProfile();
    pushAIMAutoSignupEvent(success);
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
