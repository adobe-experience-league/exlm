import { adobeIMS, profile } from "../data-service/profile-service";
import { ProfileAttributes } from "../session-keys";

function identify (data) {

  const data = sessionStorage.getItem(ProfileAttributes); 
    id = data.userId?.toLowerCase() || '',
    org = data.org?.toLowerCase() || '';

  aptrinsic('identify',
    {
      'id': id,
      'globalId': id,
      'language': '', // TODO: Need five character lang code xx-XX
      'preferredLanguages': (data.preferred_languages || []).join(', '),
      'entitlements': (data.entitlements || []).join(', '),
      'interests': (data.interests || []).join(', '),
      'roles': (data.role || []).join(', '),
      'levels': (data.level || []).join(', '),
      'activeOrg': org,
      'emailOptIns': data.emailOptIn || false,
      'emailVerified': data.emailVerified || false,
      'mrktPerm': data.mrktPerm || ''
    },
    {
      'id': org
    }
  );
}

export async function load () {
  if(adobeIMS?.isSignedInUser()) {
    const data = await profile(true);

    (function (n, t, a, e, co) {
      var i = 'aptrinsic';
      n[i] = n[i] || function () {
        (n[i].q = n[i].q || []).push(arguments);
      };
      n[i].p = e; n[i].c = co;
      var r = t.createElement('script'); r.async = !0; r.onload = () => { identify(data); }; r.src = a + '?a=' + e;
      var c = t.getElementsByTagName('script')[0]; c.parentNode.insertBefore(r, c);
    }(window, document, 'https://web-sdk.aptrinsic.com/api/aptrinsic.js', 'AP-PCBATQJJQHRG-2'));
  }
}
