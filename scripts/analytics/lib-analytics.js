export const microsite = /^\/(developer|events|landing|overview|tools|welcome)/.test(window.location.pathname);
export const search = window.location.pathname === '/search.html';
export const docs = window.location.pathname.indexOf('/docs/') !== -1;
export const lang = window.document.getElementsByTagName('html')[0].getAttribute('lang') || 'en';

export function pageLoadModel() {
  const user = {};
  if (
    sessionStorage[
      'adobeid_ims_profile/ExperienceLeague_Dev/false/AdobeID,account_cluster.read,additional_info.company,additional_info.ownerOrg,avatar,openid,read_organizations,read_pc,session'
    ]
  ) {
    const userData = JSON.parse(
      sessionStorage[
        'adobeid_ims_profile/ExperienceLeague_Dev/false/AdobeID,account_cluster.read,additional_info.company,additional_info.ownerOrg,avatar,openid,read_organizations,read_pc,session'
      ],
    );
    user.userDetails = {};
    user.userDetails.userAccountType = userData.account_type;
    user.userDetails.userAuthenticatedStatus = 'logged in';
    user.userDetails.userID = userData.userId || '';
    user.userDetails.userLanguageSetting = userData.preferred_languages || ['en-us'];
    user.userDetails.learningInterest = userData.interests || [];
    user.userDetails.role = userData.role || [];
    user.userDetails.experienceLevel = userData.level || [];
    user.userDetails.industry = userData.industryInterests || [];
    user.userDetails.notificationPref = userData.emailOptIn === true;
    user.userDetails.org = userData.org || '';
    user.userDetails.orgs = userData.orgs || [];
  }
  let section = 'learn';
  if (docs) {
    section = 'docs';
  } else if (microsite) {
    section = 'microsite';
  } else if (search) {
    section = 'search';
  }

  const solution = document.querySelector('meta[name="solution"]')
    ? document.querySelector('meta[name="solution"]').content.toLowerCase()
    : '';

  const type = document.querySelector('meta[name="type"]')
    ? document.querySelector('meta[name="type"]').content.toLowerCase()
    : '';

  const subSolution =
    document.querySelector('meta[name="sub-solution"]') !== null
      ? document.querySelector('meta[name="sub-solution"]').content
      : '';
  const solutionVersion =
    document.querySelector('meta[name="version"]') !== null
      ? document.querySelector('meta[name="version"]').content
      : '';

  const pageName = () => {
    // Validate if subsolution or solutionversion is not empty
    const lroot = window.location.pathname.endsWith === '/docs';
    let result = lroot ? ':home' : `:${solution}:${type}:`;

    if (result.endsWith(':')) {
      if (lang === 'en') {
        result += document.querySelector('title').innerText.split('|')[0].trim();
      } else {
        // figure out how to get non english pages
      }
    }

    return result.toLowerCase();
  };

  const name = `xl:docs${pageName()}`;

  const sections = name.replace(/^xl:docs:/, '').split(':');

  if (sections.length > 1) {
    sections.shift();
  }

  const mainSiteSection = search ? 'search' : '';

  return {
    event: 'page loaded',
    web: {
      webPageDetails: {
        URL: window.location.href,
        cleanURL: window.location.href.replace(/^https?:\/\//, ''),
        domain: window.location.host,
        mainSiteSection,
        name,
        gitEdit: document.querySelector('meta[name="git-edit"]')
          ? document.querySelector('meta[name="git-edit"]').content
          : '',
        exlId: document.querySelector('meta[name="exl-id"]')
          ? document.querySelector('meta[name="exl-id"]').content
          : '',
        pageLanguage: lang,
        pageName: name,
        pageType: 'webpage',
        pageViews: { value: 1 },
        prevPage: localStorage.getItem('prevPage') || '',
        userAgent: window.navigator.userAgent,
        server: window.location.host,
        siteSection: section,
        siteSubSection1: sections[0] || '',
        siteSubSection2: sections[1] || '',
        siteSubSection3: sections[2] || '',
        siteSubSection4: sections[3] || '',
        siteSubSection5: sections[4] || '',
        solution,
        solutionVersion,
        subSolution,
        type,
      },
    },
    user,
  };
}

export function linkClickModel(e) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const viewMoreLess = e.target.parentElement?.classList?.contains('view-more-less');

  let linkLocation = 'unidentified';
  if (e.target.closest('.rail-right')) {
    linkLocation = 'mtoc';
  } else if (e.target.closest('.rail-left')) {
    linkLocation = 'toc';
  } else if (e.target.closest('.header')) {
    linkLocation = 'header';
  } else if (e.target.closest('.footer')) {
    linkLocation = 'footer';
  } else if (e.target.closest('main') && docs) {
    linkLocation = 'body';
  }

  let linkType = 'other';
  let name = e.target.innerHTML;
  let destinationDomain = e.target.href;
  if (!viewMoreLess && e.target.href.match(/.(pdf|zip|dmg|exe)$/)) {
    linkType = 'download';
  } else if (viewMoreLess) {
    linkType = 'view more/less';
    destinationDomain = document.querySelector('.js-toggle.is-collapsed.is-open').innerHTML;
    name = 'ExperienceEventType:web.webInteraction.linkClicks';
  }

  window.adobeDataLayer.push({
    event: 'linkClicked',
    link: {
      destinationDomain,
      linkLocation,
      linkTitle: e.target.innerHTML || '',
      linkType,
      solution:
        document.querySelector('meta[name="solution"]') !== null
          ? document.querySelector('meta[name="solution"]').content.split(',')[0].trim()
          : '',
    },
    web: {
      webInteraction: {
        URL: e.target.href,
        linkClicks: { value: 1 },
        name,
        // set to other until we have examples of other types
        type: 'Other',
      },
    },
    asset: {
      id: '',
      interactionType: '',
    },
  });
}

export function assetInteractionModel(id, type) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  // assetId is set to the current docs page articleId if id param value is null
  const assetId = id || ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
  window.adobeDataLayer.push({
    link: {
      destinationDomain: '',
      linkLocation: '',
      linkTitle: '',
      linkType: '',
      solution: '',
    },
    event: 'assetInteraction',
    asset: {
      id: assetId,
      interactionType: type,
    },
  });
}
