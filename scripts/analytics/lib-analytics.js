/* eslint-disable no-console */

export const microsite = /^\/(developer|events|landing|overview|tools|welcome)/.test(window.location.pathname);
const lang = document.querySelector('html').lang || 'en';
export const search = window.location.pathname === '/search.html' || window.location.pathname === `/${lang}/search`;
export const docs = window.location.pathname.indexOf('/docs') !== -1;
export const courses = document.querySelector('meta[name="theme"]')?.content.includes('course-') || false;
export const browse = document.querySelector('meta[name="theme"]')?.content.includes('browse-') || false;
export const browseProduct = document.querySelector('meta[name="theme"]')?.content.includes('browse-product') || false;
export const playlist = window.location.pathname.indexOf('/playlists') !== -1;
export const solution = document.querySelector('meta[name="solution"]')?.content?.split(',')[0].toLowerCase() || '';
export const type = document.querySelector('meta[name="type"]')?.content?.toLowerCase() || '';

// Store course, module, and step information for reuse across analytics events
let courseInfo = null;
let moduleInfo = null;
let stepInfo = null;

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

  let courseObj = null;
  let moduleObj = null;
  let stepObj = null;
  let coursePreviousPageName = 'xl:learn:courses';

  if (courses) {
    const { getCurrentStepInfo, getCurrentCourseMeta } = await import('../courses/course-utils.js');

    const stepInfo = await getCurrentStepInfo();
    const courseMeta = await getCurrentCourseMeta();
    const parts = courseMeta?.url.split('/').filter(Boolean).slice(1).join('/');

    const courseTitle = courseMeta?.heading || '';
    const courseId = parts ? `/${parts}` : '';
    const courseSolution = courseMeta?.solution || '';
    const courseRole = courseMeta?.role || '';
    const courseLevel = courseMeta?.level || '';

    const moduleTitle = stepInfo?.moduleHeader || '';

    const isStepPage = document.querySelector('meta[name="theme"]')?.content.includes('course-step');
    const stepTitle = isStepPage ? document.querySelector('meta[property="og:title"]')?.content || '' : '';
    // Check if the current step contains a quiz block
    const hasQuizBlock = document.querySelector('.quiz') !== null;
    const stepType = hasQuizBlock ? 'quiz' : 'content';

    if (isStepPage && stepInfo) {
      if (stepInfo.currentStep === 1) {
        // For first step, previous page is the course landing page
        coursePreviousPageName += `:${courseSolution}:${courseTitle}`;
      } else {
        // For other steps, find the previous step name
        const prevStepIndex = stepInfo.currentStep - 2; // 0-based index
        if (prevStepIndex >= 0 && stepInfo.moduleSteps && stepInfo.moduleSteps[prevStepIndex]) {
          const prevStepName = stepInfo.moduleSteps[prevStepIndex].name;
          coursePreviousPageName += `:${courseSolution}:${courseTitle}:${moduleTitle}:${prevStepName}`;
        }
      }
    }

    if (courseId) {
      courseObj = { title: courseTitle, id: courseId, solution: courseSolution, role: courseRole, level: courseLevel };
      // Store course info in global variable for reuse
      courseInfo = courseObj;
    }
    if (moduleTitle) {
      moduleObj = { title: moduleTitle };
      // Store module info in global variable for reuse
      moduleInfo = moduleObj;
    }
    if (stepTitle) {
      stepObj = { title: stepTitle, type: stepType };
      // Store step info in global variable for reuse
      stepInfo = stepObj;
    }
  }

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

  let name = pageName(language);
  const sections = name.replace(/^xl:(docs|learn):/, '').split(':');

  if (!browse && sections.length > 1) {
    sections.shift();
  }
  const mainSiteSection = search ? 'search' : '';
  const containsAtomicSearch = search && !!document.querySelector(`main .atomic-search`);

  // Determine section1 value to avoid nested ternary
  let section1Value = '';
  if (sections[0] === 'perspective') {
    section1Value = 'perspectives';
  } else {
    section1Value = sections[0] || '';
  }

  if (courses) {
    const subs = [
      'courses',
      courseObj?.solution || '',
      courseObj?.title || '',
      moduleObj?.title || '',
      stepObj?.title || '',
    ].filter(Boolean);

    name = `xl:learn:${subs.join(':')}`;
  }

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
      prevPage: courseObj ? coursePreviousPageName : localStorage.getItem('prevPage') || '',
      userAgent: window.navigator.userAgent,
      server: window.location.host,
      siteSection: section,
      siteSubSection1: courseObj ? 'courses' : section1Value,

      siteSubSection2: courseObj ? courseObj.solution || '' : sections[1] || '',

      siteSubSection3: courseObj ? courseObj.title || '' : sections[2] || '',

      siteSubSection4: courseObj ? moduleObj?.title || '' : sections[3] || '',

      siteSubSection5: courseObj ? stepObj?.title || '' : sections[4] || '',
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
          ...(courseObj && { courses: courseObj }),
          ...(moduleObj && { module: moduleObj }),
          ...(stepObj && { steps: stepObj }),
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
      ...(courseObj && { courses: courseObj }),
      ...(moduleObj && { module: moduleObj }),
      ...(stepObj && { steps: stepObj }),
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

/**
 * Helper function to get course and module information for quiz events
 * @returns {Promise<Object>} Object containing course and module information
 */
async function getQuizEventInfo() {
  try {
    const { getCurrentStepInfo, getCurrentCourseMeta } = await import('../courses/course-utils.js');

    const stepInfo = await getCurrentStepInfo();
    const courseMeta = await getCurrentCourseMeta();
    const parts = courseMeta?.url.split('/').filter(Boolean).slice(1).join('/');

    return {
      courseTitle: courseMeta?.heading || '',
      courseId: parts ? `/${parts}` : '',
      courseSolution: courseMeta?.solution || '',
      courseRole: courseMeta?.role || '',
      moduleTitle: stepInfo?.moduleHeader || '',
      stepTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    };
  } catch (e) {
    console.error('Error getting course information for quiz event:', e);
    return {
      courseTitle: '',
      courseId: '',
      courseSolution: '',
      courseRole: '',
      moduleTitle: '',
      stepTitle: '',
    };
  }
}

/**
 * Used to push a quiz event to the data layer
 * @param {string} eventName - The name of the event (quizStart, quizSubmit, quizCompleted)
 */
async function pushQuizEvent(eventName) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  if (courses) {
    // Check if we already have the course, module, and step information from pushPageDataLayer
    if (courseInfo && moduleInfo && stepInfo) {
      // Use the stored information
      window.adobeDataLayer.push({
        event: eventName,
        steps: stepInfo,
        module: moduleInfo,
        courses: courseInfo,
      });
    } else {
      // Fall back to fetching the information if it's not available
      const info = await getQuizEventInfo();

      window.adobeDataLayer.push({
        event: eventName,
        steps: {
          title: info.stepTitle,
          type: 'quiz',
        },
        module: {
          title: info.moduleTitle,
        },
        courses: {
          title: info.courseTitle,
          id: info.courseId,
          solution: info.courseSolution,
          role: info.courseRole,
        },
      });
    }
  }
}

/**
 * Used to push a quiz start event to the data layer
 */
export async function pushQuizStartEvent() {
  await pushQuizEvent('quizStart');
}

/**
 * Used to push a quiz submit event to the data layer
 */
export async function pushQuizSubmitEvent() {
  await pushQuizEvent('quizSubmit');
}

/**
 * Used to push a quiz completed event to the data layer
 * This event is fired only when a user successfully passes the quiz
 */
export async function pushQuizCompletedEvent() {
  await pushQuizEvent('quizCompleted');
}
