// eslint-disable-next-line import/no-cycle
import SignupFlowDialog from './signup-flow-dialog.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getConfig } from '../scripts.js';

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
 *
 */
export default async function initSignupFlowHandler() {
  if (!isSignedInUser()) {
    return;
  }

  const SIGNUP_DIALOG_TYPE = {
    INCOMPLETE_PROFILE: 'incomplete-profile',
    NEW_PROFILE: 'new-profile',
  };

  // This value is hard-coded because using a Bulk metadata value failed due to CDN issues.
  const { signUpFlowConfigDate, modalReDisplayDuration } = getConfig();

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
