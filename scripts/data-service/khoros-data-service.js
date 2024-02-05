import { communityProfileUrl } from '../urls.js';

// eslint-disable-next-line
export async function fetchCommunityProfileData() {
  try {
    const response = await fetch(communityProfileUrl, {
      method: 'GET',
      headers: {
        'x-ims-token': await window.adobeIMS?.getAccessToken().token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    // eslint-disable-next-line
    console.log('Error fetching data!!', err);
  }
}
