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
        previousPageName: '',
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

  window.adobeDataLayer.push({
    event: 'linkClicked',
    link: {
      destinationDomain: '<Link HREF Value>',
      linkLocation: '<Position of link on page>',
      linkTitle: '<name of the link clicked>',
      linkType: '<’other’ || ‘exit’ || ‘download’>',
      solution: '<Adobe Solution link pertains to>',
    },
    web: {
      webInteraction: {
        URL: '<Link HREF Value>',
        linkClicks: { value: 1 },
        name: '<name of the link clicked>',
        type: '<’other’ || ‘exit’ || ‘download’>',
      },
    },
  });
  window.setTimeout(() => {
    window.location.href = e.target.href;
  }, 1000);
}
