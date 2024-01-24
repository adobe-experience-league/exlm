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

  return {
    event: 'page loaded',
    web: {
      webPageDetails: {
        URL: window.location.href,
        cleanURL: window.location.href.replace(/^https?:\/\//, ''),
        domain: window.location.host,
        mainSiteSection: '',
        name: document.title,
        gitEdit: document.querySelector('meta[name="git-edit"]')
          ? document.querySelector('meta[name="git-edit"]').content
          : '',
        exlId: document.querySelector('meta[name="exl-id"]')
          ? document.querySelector('meta[name="exl-id"]').content
          : '',
        pageLanguage: window.document.getElementsByTagName('html')[0].getAttribute('lang') || 'en',
        pageName: `xl${window.location.pathname.replaceAll('/', ':').replaceAll('-', ' ')}`,
        pageType: document.querySelector('meta[name="type"]')
          ? document.querySelector('meta[name="type"]').content
          : 'webpage',
        pageViews: { value: 1 },
        prevPage: document.querySelector('meta[name="prev-page"]')
          ? document.querySelector('meta[name="prev-page"]').content
          : '',
        userAgent: window.navigator.userAgent,
        recordid: '',
        server: window.location.host,
        siteSection: '',
        siteSubSection1: '',
        siteSubSection2: '',
        siteSubSection3: '',
        siteSubSection4: '',
        siteSubSection5: '',
        solution: document.querySelector('meta[name="solution"]')
          ? document.querySelector('meta[name="solution"]').content
          : '',
        solutionVersion: '',
        subSolution: '',
        type: document.querySelector('meta[name="type"]') ? document.querySelector('meta[name="type"]').content : '',
      },
    },
    user,
  };
}

export function linkClickModel(e) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  let linkTarget = '';
  if (e.target.parentElement.className.indexOf('marquee-cta') !== -1 && window.location.pathname === '/') {
    linkTarget = 'banner-homepage';
  } else if (e.target.closest('.browse-rail')) {
    linkTarget = 'docs-right-sidebar';
  }

  let linkType = 'other';

  if (e.target.href.match(/.(zip|dmg|exe)$/)) {
    linkType = 'download';
  }

  window.adobeDataLayer.push({
    event: 'linkClicked',
    link: {
      destinationDomain: e.target.href,
      linkLocation: linkTarget,
      linkTitle: e.target.innerHTML || '',
      // set to other until we have examples of other types
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
        name: e.target.innerHTML,
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
