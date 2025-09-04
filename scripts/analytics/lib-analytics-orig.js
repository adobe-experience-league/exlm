export const docs = window.location.pathname.startsWith('/docs/');
export const error = window.urlError === true;
export const { lang } = document.querySelector('html').lang;
export const microsite = /^\/(developer|events|landing|overview|tools|welcome)/.test(window.location.pathname);
export const { origin } = window.location.origin;
export const render = window.requestAnimationFrame;
export const root = window.location.pathname === '/';
export const search = window.location.pathname === '/search.html' || window.location.pathname === `/${lang}/search`;

function locale() {
  sessionStorage.setItem('lang', lang);
}

locale();

const counter = new Map();
const user = {
  userDetails: {
    userAccountType: '',
    userAuthenticatedStatus: 'unauthenticated',
    userAuthenticatedSystem: 'ims',
    userCorporateName: '',
    userID: '',
    userLanguageSetting: [],
    learningInterest: [],
    role: [],
    experienceLevel: [],
    industry: [],
    notificationPref: false,
    org: '',
    orgs: [],
  },
};

export const adobeDataLayerMap = {
  '#home': 'xl:learn:home',
  '#learn': 'xl:learn:all learning',
  '#dashboard/learning': 'xl:learn:recommended courses',
  '#courses': 'xl:learn:courses',
  '#quick-how-tos': 'xl:learn:all courses',
  '#search': 'xl:learn:search',
  '#recommended': 'xl:learn:recommended courses',
  '#instructor-led': 'xl:learn:instructor led training',
  '#feedback': 'xl:learn:feedback panel',
  '#support': 'xl:learn:support:',
  '#dashboard/welcome': 'xl:learn:welcome',
  '#dashboard/profile': 'xl:learn:profile:edit',
  '#dashboard/awards': 'xl:learn:my awards',
  '#dashboard/bookmarks': 'xl:learn:my bookmarks',
  '#recommended/solutions/analytics': 'xl:learn:explore:analytics',
  '#recommended/solutions/campaign': 'xl:learn:explore:campaign',
  '#recommended/solutions/advertising-cloud': 'xl:learn:explore:advertising cloud',
  '#recommended/solutions/target': 'xl:learn:explore:target',
  '#recommended/solutions/audience-manager': 'xl:learn:explore:audience manager',
  '#recommended/solutions/experience-manager': 'xl:learn:explore:experience manager',
  '#recommended/solutions/experience-platform': 'xl:learn:explore:experience platform',
  '#recommended/solutions/marketo': 'xl:learn:explore:marketo engage',
  '#recommended/solutions/adobe-sign': 'xl:learn:explore:sign',
  '#recommended/solutions/acrobat-dc': 'xl:learn:explore:acrobat dc',
  '#recommended/use-cases/analytics-audiences': 'xl:learn:explore:analytics audiences',
  '#recommended/use-cases/content-experiences': 'xl:learn:explore:content experience',
  '#recommended/use-cases/campaign-management': 'xl:learn:explore:campaign management',
  '#recommended/use-cases/personalization-testing': 'xl:learn:explore:personalization testing',
  '#recommended/use-cases/advertising': 'xl:learn:explore:advertising',
};

async function docsPageDetails() {
  const type =
    document.querySelector('meta[name="type"]') !== null
      ? document.querySelector('meta[name="type"]').content.split(',')[0].trim().toLowerCase()
      : '';
  let solution =
    document.querySelector('meta[name="solution"]') !== null
      ? document.querySelector('meta[name="solution"]').content.split(',')[0].trim().toLowerCase()
      : // eslint-disable-next-line no-useless-escape
        `fb ${((/^\/docs\/([^\/]+)\//.exec(window.location.pathname) || [])[1] || '')
          .replace(/[-\d+\s+]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()}`;
  const subsolution =
    document.querySelector('meta[name="sub-solution"]') !== null
      ? document.querySelector('meta[name="sub-solution"]').content.split(',')[0].trim().toLowerCase()
      : '';
  const solutionversion =
    document.querySelector('meta[name="version"]') !== null
      ? document.querySelector('meta[name="version"]').content
      : '';
  const feature =
    document.querySelector('meta[name="feature"]') !== null
      ? document.querySelector('meta[name="feature"]').content
      : '';

  if (solution.trim() === 'fb') {
    solution = '';
  }

  const lroot = window.location.pathname === '/docs/';
  const id = (document.querySelector('meta[name="id"]') || {}).content || '';
  const translate = async (arg = '') => {
    let result;

    try {
      const res = await fetch(`/api/articles/${arg}?lang=en`);
      const data = await res.json();

      if (res.ok) {
        result = data.data;
      } else {
        result = null;
      }
    } catch (err) {
      result = null;
    }

    return result;
  };
  const pageName = async () => {
    // Validate if subsolution or solutionversion is not empty
    let result = lroot ? ':home' : `:${solution}:${type}:`;

    if (result.endsWith(':')) {
      if (lang === 'en') {
        result += document.querySelector('title').innerText.split('|')[0].trim();
      } else {
        const data = id.length > 0 ? await translate(id) : null;

        if (data !== null) {
          result += data.Title.split('|')[0].trim();
        }
      }
    }

    return result.toLowerCase();
  };
  const name = `xl:docs${await pageName()}`;
  const sections = name.replace(/^xl:docs:/, '').split(':');

  if (sections.length > 1) {
    sections.shift();
  }

  return [name, sections, solution, subsolution, solutionversion, feature];
}

function micrositePageDetails() {
  const struct = window.location.pathname.split('/');
  let name = `xl:microsite:${struct[1]}`;

  if (typeof struct[2] === 'string' && struct[2].length > 0) {
    name += `:${struct[2].replace(/\s+/g, '-')}`;
  }

  return [name, ['microsite']];
}

export function queryMap(arg = '') {
  return new Map(arg.split('&').map((i) => i.split('=').map((x, xdx) => (xdx === 0 ? x : decodeURIComponent(x)))));
}

export async function webPageDetails(
  arg = root ? window.location.hash : '',
  views = true,
  type = 'webpage',
  section = 'learn',
) {
  const identify = (larg) =>
    adobeDataLayerMap[larg] ||
    adobeDataLayerMap[
      Reflect.ownKeys(adobeDataLayerMap)
        .sort()
        .filter((i) => i.startsWith(larg))[0]
    ] ||
    '';
  const state = queryMap(window.location.hash.replace(/^#/, ''));
  let previousPageName = '';
  let pageName;
  let webSection = section;
  let sections;
  let solution;
  let subsolution;
  let solutionversion;
  let feature;

  if (docs) {
    [pageName, sections, solution, subsolution, solutionversion, feature] = await docsPageDetails();
  } else if (microsite) {
    [pageName, sections] = micrositePageDetails();
  } else if (search) {
    pageName = 'xl:learn:search';
    webSection = 'search';
    sections = ['search page'];
  } else {
    // eslint-disable-next-line no-nested-ternary
    pageName = error ? 'xl:error' : root ? identify(arg) : 'xl:other';
    sections = pageName.replace(/^xl:learn:/, '').split(':');
    previousPageName = root
      ? window.adobeDataLayer
          .filter((i) => 'event' in i && i.event === 'page loaded' && i.web.webPageDetails.pageName !== pageName)
          .reduce((a, v) => v.web.webPageDetails.pageName, '')
      : '';
  }

  let n = counter.get(arg) || 0;

  counter.set(arg, (n += 1));

  const result = {
    pageViews: {
      value: n,
    },
    name: pageName,
    pageName,
    prevPage: previousPageName,
    previousPageName,
    pageType: type,
    URL: window.location.href,
    domain: window.location.hostname,
    server: window.location.hostname,
    feature: feature?.toLowerCase(),
    siteSection: webSection,
    siteSubSection1: sections[0] || '',
    siteSubSection2: sections[1] || '',
    siteSubSection3: sections[2] || '',
    siteSubSection4: sections[3] || '',
    siteSubSection5: sections[4] || '',
    // eslint-disable-next-line no-nested-ternary
    solution: docs ? solution || '' : sections[0] === 'explore' ? sections[1] || '' : '',
    fullSolution: document.querySelector('meta[name="solution"]')?.content || '',
    subSolution: subsolution,
    solutionVersion: solutionversion,
  };

  if (search) {
    result.mainSiteSection = 'search';
    result.name = 'xl:learn:search';
    result.pageName = 'xl:learn:search';
    result.searchTerm = (state.get('q') || '').trim();
    result.siteSection = 'search';
    result.siteSubSection1 = 'search page';
  }

  if (views === false) {
    delete result.pageViews;
  }

  return result;
}

export function adobeDataLayerTrack(arg = {}) {
  if ('web' in arg && 'webPageDetails' in arg.web) {
    if ('name' in arg.web.webPageDetails && 'pageName' in arg.web.webPageDetails === false) {
      arg.web.webPageDetails.pageName = arg.web.webPageDetails.name;
    }

    if ('appVersion' in window && Number.isNaN(window.appVersion) === false) {
      arg.web.webPageDetails.version = window.appVersion;
    }

    if ('pageLanguage' in arg.web.webPageDetails === false) {
      arg.web.webPageDetails.pageLanguage = lang;
    }
  }

  if ('user' in arg === false) {
    arg.user = user;
  }

  window.adobeDataLayer.push(arg);
}

export function trackInteraction(interactionType, id) {
  adobeDataLayerTrack(
    // eslint-disable-next-line prefer-object-spread
    Object.assign(
      {},
      {
        event: 'assetInteraction',
        asset: {
          // Docs pages should just use the meta value, but learning pages need to set their own id
          id: id || ((document.querySelector('meta[name="id"]') || {}).content || '').trim(),
          interactionType,
        },
      },
    ),
  );
}

// Mutating `window` for interop
window.adobeDataLayer = window.adobeDataLayer || [];
window.adobeDataLayer.ready = false;
window.adobeDataLayerMap = adobeDataLayerMap;
window.adobeDataLayerTrack = adobeDataLayerTrack;
window.appVersion = 0;
/*  this needs to be reimplemented.
o.once('auth', (data = null) => {
  if (data !== null) {
    user.userDetails.userAccountType = data.account_type || '';
    user.userDetails.userAuthenticatedStatus = 'logged in';
    user.userDetails.userID = data.userId || '';
    user.userDetails.userLanguageSetting = data.preferred_languages || ['en-us'];
    user.userDetails.learningInterest = data.interests || [];
    user.userDetails.role = data.role || [];
    user.userDetails.experienceLevel = data.level || [];
    user.userDetails.industry = data.industryInterests || [];
    user.userDetails.notificationPref = data.emailOptIn === true;
    user.userDetails.org = data.org || '';
    user.userDetails.orgs = data.orgs || [];
  }

  window.adobeDataLayer.ready = true;
  adobeDataLayerTrack({event: 'user updated'});
});
*/

(async function iife() {
  const ckeys = await caches.keys();
  const version = parseInt(
    (
      ckeys
        .filter((i) => i.startsWith('app-v'))
        .sort()
        .pop() || '0'
    ).replace('app-v', ''),
    10,
  );

  window.appVersion = version;
})();
