// eslint-disable-next-line import/no-cycle
import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { loadScript } from '../lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { getPathDetails } from '../scripts.js';

// lang code mappings specific to gainsight.
const langMap = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  nl: 'nl-NL',
  'pt-br': 'pt-BR',
  sv: 'sv-SE',
  'zh-hans': 'zh-CN',
  'zh-hant': 'zh-TW',
};

function identify(data) {
  const id = data.userId?.toLowerCase() || '';
  const org = data.org?.toLowerCase() || '';
  const { lang } = getPathDetails();

  // eslint-disable-next-line
  aptrinsic(
    'identify',
    {
      id,
      globalId: id,
      language: langMap[lang] || lang,
      preferredLanguages: (data.preferred_languages || []).join(', '),
      entitlements: (data.entitlements || []).join(', '),
      interests: (data.interests || []).join(', '),
      roles: (data.role || []).join(', '),
      levels: (data.level || []).join(', '),
      activeOrg: org,
      emailOptIns: data.emailOptIn || false,
      emailVerified: data.emailVerified || false,
      mrktPerm: data.mrktPerm || '',
    },
    {
      id: org,
    },
  );
}

// an identical version of what gainsight admin gives, unminified, more readable and modern APIs
// see: README.md
async function loadGinsightScript(tagId, co) {
  window.aptrinsic =
    window.aptrinsic ||
    function aptrinsic(...args) {
      (window.aptrinsic.q = window.aptrinsic.q || []).push(args);
    };
  window.aptrinsic.p = tagId;
  window.aptrinsic.c = co; // admin script adds this, but it is not used, not sure what it is for
  return loadScript(`https://web-sdk.aptrinsic.com/api/aptrinsic.js?a=${tagId}`, { async: true });
}

export default async function loadGainsight() {
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profilePromise = defaultProfileClient.getMergedProfile();
    const loadGainsightPromise = loadGinsightScript('AP-PCBATQJJQHRG-2');
    Promise.all([profilePromise, loadGainsightPromise]).then(([profileData]) => {
      identify(profileData);
    });
  }
}
