// eslint-disable-next-line import/no-cycle
import initializeSignupFlow from '../signup-flow/signup-flow.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getConfig } from '../scripts.js';

export default async function showSignupModal() {
  if (!isSignedInUser()) {
    return;
  }

  // This value is hard-coded. Using a Bulk metadata Value for this did not work due to CDN issues;
  //  some pages had the metadata while others did not.
  const { signUpFlowConfigDate } = getConfig();

  const configDate = new Date(signUpFlowConfigDate);
  const profileData = await defaultProfileClient.getMergedProfile();
  const profileTimeStamp = new Date(profileData.timestamp);
  const interests = profileData.interests ?? [];
  const modalSeen = await defaultProfileClient.getLatestInteraction('modalSeen');
  if (modalSeen) {
    return;
  }
  const todayStartTimeStamp = new Date();
  todayStartTimeStamp.setHours(0, 0, 0, 0);
  if (profileTimeStamp < todayStartTimeStamp && interests.length === 0) {
    initializeSignupFlow(true);
  } else if (profileTimeStamp >= configDate) {
    initializeSignupFlow();
  }
}

export async function addModalSeenInteraction() {
  const modelInteraction = await defaultProfileClient.getLatestInteraction('modalSeen');
  if (!modelInteraction) {
    const modalSeen = [{ event: 'modalSeen', timestamp: new Date().toISOString(), modalSeen: true }];
    await defaultProfileClient.updateProfile('interactions', modalSeen);
  }
}
