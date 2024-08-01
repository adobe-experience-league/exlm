import { getMetadata } from '../lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import initializeSignupFlow from '../signup-flow/signup-flow.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';

export default async function showSignupModal() {
  if (!isSignedInUser()) {
    return;
  }
  const configDateString = getMetadata('signup-flow-config-date');
  const configDate = new Date(configDateString);
  const profileData = await defaultProfileClient.getMergedProfile();
  const profileTimeStamp = new Date(profileData.timestamp);
  const modelSeen = await defaultProfileClient.getLatestInteraction('modelSeen');
  if (profileTimeStamp >= configDate && !modelSeen) {
    initializeSignupFlow();
  }
}

export async function addModalSeenInteraction() {
  const modelInteraction = await defaultProfileClient.getLatestInteraction('modelSeen');
  if (!modelInteraction) {
    const modelSeen = [{ event: 'modelSeen', timestamp: new Date().toISOString(), modelSeen: true }];
    await defaultProfileClient.updateProfile('interactions', modelSeen);
  }
}
