import { getConfig } from '../scripts.js';
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';

const { jilAPI, ims } = getConfig();

export default async function getProductEntitlements() {
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    try {
      const profileData = await defaultProfileClient.getMergedProfile();
      const userOrgs = profileData?.orgs || [];

      await Promise.all(
        userOrgs.map(async (userOrg) => {
          try {
            const newProfile = await window.adobeIMS.switchProfile(userOrg.userId);
            const accessToken = newProfile.tokenInfo.token;
            sessionStorage.setItem('JIL-token', `Bearer ${accessToken}`);

            const productEndPoint = jilAPI.replace('#ORG_ID', userOrg.orgId);
            const requestHeaders = {
              'x-api-key': ims.client_id,
              Authorization: sessionStorage.getItem('JIL-token') || '',
            };

            const response = await fetch(productEndPoint, {
              headers: { ...requestHeaders },
            });

            if (!response.ok) {
              throw new Error(`Error fetching products for ${userOrg.orgName}: ${response.statusText}`);
            }

            const productData = await response.json();
            // eslint-disable-next-line no-console
            console.log(`Product data for ${userOrg.orgName}:`, productData);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch products for ${userOrg.orgName}:`, error);
          }
        }),
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing user organizations:', error);
    }
  }
}
