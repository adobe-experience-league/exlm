import { feedbackError } from './feedback/feedback.js'; // eslint-disable-line import/no-cycle
import { defaultProfileClient } from './auth/profile.js';

// Default EXL_PROFILE object
const defaultProfile = {
  authenticated: false,
  adobeEmployee: false,
  exlRole: '',
  exlLearningInterests: [],
  exlExperienceLevel: [],
};

// Map from our url langs to qualtrics lang codes
const langMap = {
  en: 'EN',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  it: 'IT',
  ja: 'JA',
  ko: 'KO',
  nl: 'NL',
  'pt-br': 'PT',
  sv: 'SV',
  'zh-hans': 'ZH-S',
  'zh-hant': 'ZH-T',
};

// Set the EXL_PROFILE object for the Qualtrics survey - UGP-10760
const setExlProfile = async () => {
  try {
    const userData = await defaultProfileClient.getMergedProfile();

    if (userData) {
      const emailIsString = typeof userData.email === 'string';
      window.EXL_PROFILE = {
        authenticated: true,
        adobeEmployee: emailIsString ? userData.email.includes('@adobe.com') : false,
        exlRole: userData.role || '',
        exlLearningInterests: Array.isArray(userData.interests) ? userData.interests : [],
        exlExperienceLevel: Array.isArray(userData.level) ? userData.level : [],
      };
    } else {
      window.EXL_PROFILE = { ...defaultProfile };
    }
  } catch (e) {
    console.error('Error getting user profile:', e); // eslint-disable-line no-console
    window.EXL_PROFILE = { ...defaultProfile };
  }
};

/**
 * Copies all meta tags to window.EXL_META
 * These are consumed by Qualtrics to pass additional data along with intercepts.
 */
const addMetaTagsToWindow = () => {
  window.EXL_META = {};

  document.querySelectorAll('meta').forEach((tag) => {
    if (
      typeof tag.name === 'string' &&
      tag.name.length > 0 &&
      typeof tag.content === 'string' &&
      tag.content.length > 0
    ) {
      window.EXL_META[tag.name] = tag.content;
    }
  });

  window.EXL_META.lang = document.documentElement.lang || 'en';
  window.EXL_META.qualtricsLang = langMap[document.documentElement.lang] || 'EN';
};

export default async function loadQualtrics() {
  addMetaTagsToWindow();
  const profilePromise = setExlProfile();
  const fetchPromise = fetch('/qualtrics.json').then((resp) => {
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
          const containerId = `${interceptId}_container`;
          let container = document.getElementById(containerId);
          if (!container) {
            container = document.createElement('div');
            container.id = containerId;
          } else {
            container.innerHTML = ''; // Clear existing content
          }

          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = interceptURL;

          if (document.body) {
            document.body.appendChild(script);
            document.body.appendChild(container);
          }
        }
      });
    })
    .catch((error) => {
      console.error('Error loading Qualtrics surveys:', error); // eslint-disable-line no-console
      feedbackError();
    });
}
