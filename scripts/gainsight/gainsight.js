// eslint-disable-next-line import/no-cycle
import { adobeIMS, profile } from '../data-service/profile-service.js';
import getLangCode from '../lang-map.js';
// eslint-disable-next-line import/no-cycle
import { getPathDetails } from '../scripts.js';

function identify(data) {
  const id = data.userId?.toLowerCase() || '';
  const org = data.org?.toLowerCase() || '';
  const { lang } = getPathDetails();

  aptrinsic( // eslint-disable-line
    'identify',
    {
      id,
      globalId: id,
      language: getLangCode(lang),
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

export default async function load() {
  if (adobeIMS?.isSignedInUser()) {
    const data = await profile(true);

    /* eslint-disable */
    (function (n, t, a, e, co) {
      var i = 'aptrinsic';
      n[i] =
        n[i] ||
        function () {
          (n[i].q = n[i].q || []).push(arguments);
        };
      n[i].p = e;
      n[i].c = co;
      var r = t.createElement('script');
      r.async = !0;
      r.onload = () => {
        identify(data);
      };
      r.src = a + '?a=' + e;
      var c = t.getElementsByTagName('script')[0];
      c.parentNode.insertBefore(r, c);
    })(window, document, 'https://web-sdk.aptrinsic.com/api/aptrinsic.js', 'AP-PCBATQJJQHRG-2');
    /* eslint-enable */
  }
}
