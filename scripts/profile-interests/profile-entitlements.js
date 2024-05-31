import { getConfig } from '../scripts.js';
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';

const { jilAPI, ims } = getConfig();

export default async function getProductEntitlements() {
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    try {
      const profileData = await defaultProfileClient.getMergedProfile();
      const userOrgs = profileData?.orgs || [];
      const entitledProducts = [];

      await Promise.all(
        userOrgs.map(async (userOrg) => {
          try {
            const newProfile = await window.adobeIMS.switchProfile(userOrg.userId);
            const accessToken = newProfile.tokenInfo.token;

            const jilEndPoint = jilAPI.replace('#ORG_ID', userOrg.orgId);
            const headers = {
              'x-api-key': ims.client_id,
              Authorization: `Bearer ${accessToken}` || '',
            };

            const response = await fetch(jilEndPoint, {
              headers: { ...headers },
            });

            if (!response.ok) {
              throw new Error(`Error fetching products for ${userOrg.orgName}: ${response.statusText}`);
            }

            const productData = await response.json();
            entitledProducts.push(productData.productArrangementCode);
            // eslint-disable-next-line no-console
            console.log(`Product data for ${userOrg.orgName}:`, productData);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch products for ${userOrg.orgName}:`, error);
          }
        }),
      );
      return entitledProducts;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing user organizations:', error);
    }
  }
  return [];
}
