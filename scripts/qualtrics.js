import { feedbackError } from './feedback/feedback.js'; // eslint-disable-line import/no-cycle
import { defaultProfileClient } from './auth/profile.js';

// Set the EXL_PROFILE object for the Qualtrics survey
const setExlProfile = async () => {
  try {
    const userData = await defaultProfileClient.getMergedProfile();

    window.EXL_PROFILE = {};

    if (userData) {
      const emailIsString = typeof userData.email === 'string';
      window.EXL_PROFILE = {
        authenticated: true,
        adobeEmployee: emailIsString ? userData.email.includes('@adobe.com') : false,
        exlRole: userData.role || '',
        exlLearningInterests: userData.interests || [],
        exlExperienceLevel: userData.level || [],
      };
    }
  } catch (e) {
    console.error('Error getting user profile:', e); // eslint-disable-line no-console
  }
};

export default async function loadQualtrics() {
  const profilePromise = setExlProfile();
  const fetchPromise = fetch('/qualtrics.json')
    .then((resp) => {
      if (resp.ok) {
        return resp.json();
      }
      throw new Error(`${resp.status}: ${resp.statusText}`);
    });

  Promise.all([profilePromise, fetchPromise])
    .then(([, json]) => {
      json.data.forEach((item) => {
        const interceptId = item['Intercept Id'];
        const interceptURL = item['Intercept URL'];
        if (interceptId && interceptURL) {
          const c = `${interceptId}_container`;
          let d;
          const o = document.getElementById(c);
          if (o) {
            o.innerHTML = '';
            d = o;
          } else {
            d = document.createElement('div');
            d.id = c;
          }
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.src = interceptURL;
          if (document.body) {
            document.body.appendChild(s);
            document.body.appendChild(d);
          }
        }
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
      feedbackError();
    });
}
