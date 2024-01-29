import { communityProfileUrl } from '../urls.js';

// eslint-disable-next-line
export async function fetchCommunityProfileData(imsToken) {
  try {
    const response = await fetch(communityProfileUrl, {
      method: 'GET',
      headers: {
        'x-ims-token': imsToken,
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