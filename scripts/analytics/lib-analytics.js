/* eslint-disable no-console */
export const microsite = /^\/(developer|events|landing|overview|tools|welcome)/.test(window.location.pathname);
const lang = document.querySelector('html').lang || 'en';
export const search = window.location.pathname === '/search.html' || window.location.pathname === `/${lang}/search`;
export const docs = window.location.pathname.indexOf('/docs') !== -1;
export const browse = document.querySelector('meta[name="theme"]')?.content.includes('browse-') || false;
export const browseProduct = document.querySelector('meta[name="theme"]')?.content.includes('browse-product') || false;
export const playlist = window.location.pathname.indexOf('/playlists') !== -1;
export const solution = document.querySelector('meta[name="solution"]')?.content?.split(',')[0].toLowerCase() || '';
export const type = document.querySelector('meta[name="type"]')?.content?.toLowerCase() || '';

const fullSolution = document.querySelector('meta[name="solution"]')?.content || '';
const feature = document.querySelector('meta[name="feature"]')?.content.toLowerCase() || '';
const featureAttribute = document.querySelector('meta[name="feature-attribute"]')?.content.toLowerCase() || '';
const subSolution = document.querySelector('meta[name="sub-solution"]')?.content || '';
const solutionVersion = document.querySelector('meta[name="version"]')?.content || '';
const role = document.querySelector('meta[name="role"]')?.content || '';
const docType = document.querySelector('meta[name="doc-type"]')?.content || '';
const duration = document.querySelector('meta[name="duration"]')?.content || '';

const UEFilters = {
  Role: '',
  ContentType: '',
  ExperienceLevel: '',
  KeywordSearch: '',
  BrowseByTopic: '',
  BrowseResults: '',
};

export const pageName = (language) => {
  // Validate if subsolution or solutionversion is not empty
  const lroot = window.location.pathname.endsWith('docs');
  // eslint-disable-next-line prefer-template
  let result = lroot ? ':home' : `:${solution ? solution + ':' : ''}${type ? type + ':' : ''}`;

  if (result.endsWith(':')) {
    if (language === 'en') {
      result += document.querySelector('title').innerText.split('|')[0].trim();
    } else {
      result += document.querySelector('meta[name="english-title"]')
        ? document.querySelector('meta[name="english-title"]').content.split('|')[0].trim()
        : '';
    }
  }

  let responseStr = `xl:`;

  if (docs) {
    responseStr += 'docs';
  } else if (browse) {
    responseStr += 'learn:browse';
  } else {
    responseStr += 'learn';
  }

  responseStr += result;

  return responseStr.toLowerCase();
};

export async function pushPageDataLayer(language, searchTrackingData) {
  window.adobeDataLayer = window.adobeDataLayer || [];
  const user = {
    userDetails: {
      userAccountType: '',
      userAuthenticatedStatus: 'unauthenticated',
      userAuthenticatedSystem: 'ims',
      userID: '',
      userLanguageSetting: [],
      learningInterest: [],
      role: [],
      experienceLevel: [],
      industry: [],
      notificationPref: false,
      org: '',
      orgs: [],
      userCorporateName: '',
    },
  };

  try {
    // eslint-disable-next-line import/no-cycle
    const { defaultProfileClient } = await import('../auth/profile.js');
    const userData = await defaultProfileClient.getMergedProfile();
    if (userData) {
      user.userDetails = {
        ...user.userDetails,
        userAccountType: userData.account_type,
        userAuthenticatedStatus: 'logged in',
        userID: userData.userId || '',
        userLanguageSetting: userData.preferred_languages || ['en-us'],
        learningInterest: userData.interests || [],
        role: userData.role || [],
        experienceLevel: userData.level || [],
        solutionLevel: userData.solutionLevels || [],
        certifications: userData.certifications || [],
        industry: userData.industryInterests || [],
        notificationPref: userData.emailOptIn === true,
        org: userData.org || '',
        orgs: userData.orgs || [],
        userCorporateName: userData.orgs.find((o) => o.orgId === userData.org)?.orgName ?? '',
      };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error getting user profile:', e);
  }

  let section = 'learn';
  if (docs) {
    section = 'docs';
  } else if (microsite) {
    section = 'microsite';
  } else if (search) {
    section = 'search';
  }

  const name = pageName(language);
  const sections = name.replace(/^xl:(docs|learn):/, '').split(':');

  if (!browse && sections.length > 1) {
    sections.shift();
  }
  const mainSiteSection = search ? 'search' : '';
  const containsAtomicSearch = search && !!document.querySelector(`main .atomic-search`);

  const webDetails = {
    webPageDetails: {
      URL: window.location.href,
      cleanURL: window.location.href.replace(/^https?:\/\//, '').replace(/#.*$/, ''),
      domain: window.location.host,
      docrole: role,
      doctype: docType,
      docduration: duration,
      mainSiteSection,
      name,
      gitEdit: document.querySelector('meta[name="git-edit"]')?.content || '',
      exlId: document.querySelector('meta[name="exl-id"]')?.content || '',
      pageLanguage: language,
      pageName: name,
      pageType: 'webpage',
      pageViews: { value: 1 },
      prevPage: localStorage.getItem('prevPage') || '',
      userAgent: window.navigator.userAgent,
      server: window.location.host,
      siteSection: section,
      siteSubSection1: sections[0] === 'perspective' ? 'perspectives' : sections[0] || '',
      siteSubSection2: sections[1] || '',
      siteSubSection3: sections[2] || '',
      siteSubSection4: sections[3] || '',
      siteSubSection5: sections[4] || '',
      solution: browseProduct ? sections[1] : solution,
      solutionVersion,
      subSolution,
      type,
      fullSolution,
      feature,
      featureAttribute,
    },
  };
  if (containsAtomicSearch && !searchTrackingData) {
    document.addEventListener(
      'ATOMIC_SEARCH_PAGE_LOAD_EVENT',
      (e) => {
        const trackingData = e.detail?.trackingData;
        const dataLayer = {
          event: 'page loaded',
          web: webDetails,
          user,
          userGUID: user.userDetails.userID,
        };
        if (trackingData) {
          dataLayer.search = trackingData;
        }
        window.adobeDataLayer.push(dataLayer);
      },
      { once: true },
    );
  } else {
    window.adobeDataLayer.push({
      event: 'page loaded',
      web: webDetails,
      user,
      search: searchTrackingData,
      userGUID: user.userDetails.userID,
    });
  }
}

export function pushLinkClick(e) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const viewMoreLess = e.target.parentElement?.classList?.contains('view-more-less');

  let linkLocation = 'unidentified';
  if (e.target.closest('.rail-right') || e.target.closest('.mini-toc-wrapper')) {
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
  if (!viewMoreLess && e.target.href?.match(/.(pdf|zip|dmg|exe)$/)) {
    linkType = 'download';
  } else if (viewMoreLess) {
    linkType = 'view more/less';
    destinationDomain = e.target.closest('ul').parentNode.querySelector('p').innerText;
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
    ...UEFilters,
    web: {
      webInteraction: {
        URL: e.target.href,
        linkClicks: { value: 1 },
        name,
        // set to other until we have examples of other types
        type: 'other',
      },
      webPageDetails: {
        pageViews: { value: 0 },
      },
    },
    asset: {
      id: '',
      interactionType: '',
    },
  });
}

/**
 * Used to push a video event to the data layer
 * @param {Video} video
 * @param {string} event
 */
export function pushVideoEvent(video, event = 'videoPlay') {
  const { title, description, url } = video;
  const videoDuration = video.duration || '';
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event,
    video: {
      title,
      description,
      url,
      duration: videoDuration,
    },
    web: {
      webPageDetails: {
        type,
        solution,
        feature,
        URL: window.location.href,
        domain: window.location.host,
      },
    },
  });
}

export function assetInteractionModel(id, assetInteractionType, filters) {
  window.adobeDataLayer = window.adobeDataLayer || [];
  const dataLayerFilters = { ...UEFilters };
  Object.assign(dataLayerFilters, filters);

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
    ...dataLayerFilters,
    event: 'assetInteraction',
    asset: {
      id: assetId,
      interactionType: assetInteractionType,
    },
  });
}

/**
 * Used to push a signup modal event to the data layer
 * @param {HTMLButtonElement} target
 * @param {String} action
 */
export function pushSignupEvent(target, action) {
  const signupStep = target.closest('.signup-dialog-container')?.classList[1] || '';
  const stepDLValue = signupStep?.split('-')[0].replace('step', 'step ');
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'signup-dialog',
    eventType: action === 'show-modal' ? 'web.webinteraction.linkClicks' : 'web.webinteraction.assetInteraction',
    signupDialog: {
      action: `sign up dialog ${action}`,
      step: stepDLValue,
      buttontext: action,
    },
    web: {
      webInteraction: {
        URL: '',
        linkClicks: { value: 1 },
        name: `sign up dialog ${stepDLValue}`,
        type: 'other',
      },
      webPageDetails: {
        pageViews: { value: 0 },
      },
    },
  });
}

/**
 * Pushes video metadata to the data layer on page load,
 * including videoId, thumbnail URL, and video URL.
 * @param {string} videoId - The MPC video ID.
 * @param {string} videoUrl - URL to the MPC video.
 * @param {string} thumbnailUrl - Thumbnail image URL.
 */
export function pushVideoMetadataOnLoad(videoId, videoUrl, thumbnailUrl) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'videoMetadata',
    video: {
      url: videoUrl,
      thumbnailUrl,
      id: videoId,
    },
  });
}

/**
 * Used to push a product interests event to the data layer
 * @param {string} id - The product id.
 * @param {string} title - The product interest title.
 * @param {string} type - The product selection/deselection.
 */
export function pushProductInterestsEvent(id, title, selectionType) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'productInterestsEvent',
    productInterests: {
      productId: id,
      productTitle: title,
      productSelectionType: selectionType,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Used to push a guide play event to the data layer
 * @param {Object} guide - Guide information
 * @param {string} guide.title - Guide title in format "guide title:step number:slide title"
 * @param {string} guide.trigger - Action that triggered the event (play, next, previous, autoplay)
 * @param {string} guide.steps - Total number of slides in the guide
 * @param {boolean} audioOn - Whether audio is on or off
 */
export function pushGuidePlayEvent(guide, audioOn) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const audioStatus = audioOn ? 'audio on' : 'audio off';

  window.adobeDataLayer.push({
    event: 'guidePlay',
    guide: {
      title: guide.title,
      trigger: `${guide.trigger}:${audioStatus}`,
      steps: guide.steps,
    },
  });
}

/**
 * Used to push a guide autoplay event to the data layer
 * @param {Object} guide - Guide information
 * @param {string} guide.title - Guide title in format "guide title:step number:slide title"
 * @param {string} guide.trigger - Action that triggered the event (play, next, previous, autoplay)
 * @param {string} guide.steps - Total number of slides in the guide
 * @param {boolean} audioOn - Whether audio is on or off
 * @param {string} stepIndex - Current step index
 * @param {string} blockId - Block identifier for the slides component
 */
export function pushGuideAutoPlayEvent(guide, audioOn) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const audioStatus = audioOn ? 'audio on' : 'audio off';

  window.adobeDataLayer.push({
    event: 'guideAutoPlay',
    guide: {
      title: guide.title,
      trigger: `${guide.trigger}:${audioStatus}`,
      steps: guide.steps,
    },
  });
}
