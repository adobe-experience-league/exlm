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

const fullSolution = document.querySelector('meta[name="solution"]')?.content || '';
const feature = document.querySelector('meta[name="feature"]')?.content.toLowerCase() || '';
const featureAttribute = document.querySelector('meta[name="feature-attribute"]')?.content.toLowerCase() || '';
const subSolution = document.querySelector('meta[name="sub-solution"]')?.content || '';
const solutionVersion = document.querySelector('meta[name="version"]')?.content || '';
const role = document.querySelector('meta[name="role"]')?.content || '';
const docType = document.querySelector('meta[name="doc-type"]')?.content || '';
const duration = document.querySelector('meta[name="duration"]')?.content || '';

// TQ Tags
const productV2 = document.querySelector('meta[name="tq-products-labels"]')?.content || '';
const subFeatureV2 = document.querySelector('meta[name="tq-subfeatures-labels"]')?.content.toLowerCase() || '';
const featureV2 = document.querySelector('meta[name="tq-features-labels"]')?.content.toLowerCase() || '';
const roleV2 = document.querySelector('meta[name="tq-roles-labels"]')?.content || '';
const levelV2 = document.querySelector('meta[name="tq-levels-labels"]')?.content || '';
const topicV2 = document.querySelector('meta[name="tq-topics-labels"]')?.content || '';
const industryV2 = document.querySelector('meta[name="tq-industries-labels"]')?.content || '';

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

  // Get the previous page URL from document.referrer
  const referrerUrl = document.referrer ? document.referrer.replace(/^https?:\/\//, '').replace(/#.*$/, '') : '';

  if (courses) {
    const { getCurrentStepInfo, getCurrentCourseMeta } = await import('../courses/course-utils.js');

    const stepInfo = await getCurrentStepInfo();
    const courseMeta = await getCurrentCourseMeta();
    const parts = courseMeta?.url.split('/').filter(Boolean).slice(1).join('/');

    const courseTitle = courseMeta?.heading || '';
    const courseId = parts ? `${parts}` : '';

    const courseFullSolution = courseMeta?.solution || '';
    const courseSolution = courseFullSolution.split(',')[0].trim() || '';

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
        if (prevStepIndex >= 0 && stepInfo.moduleSteps?.[prevStepIndex]) {
          const prevStepName = stepInfo.moduleSteps[prevStepIndex].name;
          coursePreviousPageName += `:${courseSolution}:${courseTitle}:${moduleTitle}:${prevStepName}`;
        }
      }
    }

    if (courseId) {
      courseObj = {
        title: courseTitle,
        id: courseId,
        solution: courseSolution,
        fullSolution: courseFullSolution,
        role: courseRole,
        level: courseLevel,
      };
    }
    if (moduleTitle) {
      moduleObj = { title: moduleTitle };
    }
    if (stepTitle) {
      stepObj = { title: stepTitle, type: stepType };
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
      // Prefer IMS authId so userID remains stable across org/account switches
      const stableAuthId = userData?.authId || userData?.userId || '';
      user.userDetails = {
        ...user.userDetails,
        userAccountType: userData.account_type,
        userAuthenticatedStatus: 'logged in',
        userID: stableAuthId,
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

      // get a list of all courses titles and ids with awards.timestamp property
      // Get arrays of completed courses names and their IDs (where awards.timestamp and course.name exist)
      const completedCourses = (userData?.courses_v2 || []).filter(
        (course) => course?.awards?.timestamp && course.name,
      );
      user.userDetails.courses = completedCourses.length ? completedCourses.map((course) => course.name) : [];
      user.userDetails.coursesID = completedCourses.length ? completedCourses.map((course) => course.courseId) : [];

      const courseInfo = (userData.courses_v2 || []).find((c) => c.courseId === courseObj?.id);
      if (courseInfo) {
        if (courseInfo?.modules && Array.isArray(courseInfo?.modules)) {
          let startTime = null;
          courseInfo.modules.forEach((mod) => {
            if (mod?.startedAt) {
              if (!startTime || new Date(mod.startedAt) < new Date(startTime)) {
                startTime = mod.startedAt;
              }
            }
          });
          if (startTime) {
            courseObj.startTime = startTime;
          }

          if (courseInfo?.awards?.timestamp) courseObj.finishTime = courseInfo.awards.timestamp;

          if (courseObj?.startTime && courseObj?.finishTime) {
            const durationMs = new Date(courseObj.finishTime) - new Date(courseObj.startTime);
            courseObj.duration = Math.round(durationMs / 60000); // duration in minutes
          }
        }
      }
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

  if (courses) {
    let certificatePageName;
    if (document.querySelector('.course-completion.block')) {
      certificatePageName = 'certificate completion';
    }
    const subs = [
      'courses',
      courseObj?.solution || '',
      courseObj?.title || '',
      certificatePageName || moduleObj?.title || '',
      stepObj?.title || '',
    ].filter(Boolean);

    name = `xl:learn:${subs.join(':')}`;
  }

  const sections = name.replace(/^xl:(docs|learn):/, '').split(':');

  if (!browse && sections.length > 1 && !courses) {
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
      prevPage: courseObj ? coursePreviousPageName : referrerUrl,
      userAgent: window.navigator.userAgent,
      server: window.location.host,
      siteSection: section,
      siteSubSection1: section1Value,

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
      productV2,
      subFeatureV2,
      featureV2,
      roleV2,
      levelV2,
      topicV2,
      industryV2,
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

/**
 * Generates a component ID in the format: currentURL#componentName
 */
export function generateComponentID(componentElement, componentName) {
  const url = window.location.href.split('#')[0];
  const components = document.querySelectorAll(`[data-block-name="${componentName}"]`);
  return components.length <= 1
    ? `${url}#${componentName}`
    : `${url}#${componentName}${[...components].indexOf(componentElement) + 1 || 1}`;
}

export function pushComponentClick(data) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'componentClick',
    component: data.component || '',
    componentID: data.componentID || '',

    link: {
      contentType: data.contentType || '',
      destinationDomain: data.destinationDomain || '',
      fullSolution: data.fullSolution || '',
      linkLocation: 'body',
      linkTitle: data.linkTitle || '',
      linkType: data.linkType || '',
      solution: data.solution || '',
      position: data.position || '',
      productV2: '',
      featureV2: '',
      subFeatureV2: '',
      topicV2: '',
      industryV2: '',
      roleV2: '',
      levelV2: '',
    },
  });
}

export async function pushLinkClick(e) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const component = e.target.closest('[data-block-name]');

  const viewMoreLess = e.target.parentElement?.classList?.contains('view-more-less');
  const isCourseStartCTA = e.target.closest('.course-breakdown-header-start-button');

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
  } else if (isCourseStartCTA) {
    linkLocation = 'course landing page';
  }

  let linkType = 'other';
  let name = e.target.innerHTML;
  let destinationDomain = e.target.href;
  let linkTitle = e.target.innerHTML || '';

  if (!viewMoreLess && e.target.href?.match(/.(pdf|zip|dmg|exe)$/)) {
    linkType = 'download';
  } else if (viewMoreLess) {
    linkType = 'view more/less';
    destinationDomain = e.target.closest('ul').parentNode.querySelector('p').innerText;
    name = 'ExperienceEventType:web.webInteraction.linkClicks';
  } else if (isCourseStartCTA) {
    linkType = 'Custom';
    destinationDomain = window.location.href;
    const { getCurrentCourseMeta } = await import('../courses/course-utils.js');
    const courseMeta = await getCurrentCourseMeta();
    const courseTitle = courseMeta?.heading;
    linkTitle = `${e.target.innerHTML} | ${courseTitle}`;
  }

  const linkObj = {
    destinationDomain,
    linkLocation,
    linkTitle,
    linkType,
  };

  // Only add solution field if not a course CTA
  if (!isCourseStartCTA) {
    linkObj.solution =
      document.querySelector('meta[name="solution"]') !== null
        ? document.querySelector('meta[name="solution"]').content.split(',')[0].trim()
        : '';
  }

  window.adobeDataLayer.push({
    event: 'linkClicked',
    link: linkObj,
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

  let headerText = '';

  let currentElement = e.target;
  while (currentElement && currentElement !== component) {
    const closestHeader = currentElement.querySelector('h1,h2,h3,h4');
    if (closestHeader) {
      headerText = closestHeader.innerText.trim();
      break;
    }
    currentElement = currentElement.parentElement;
  }

  if (!component) return;

  const componentName = component.dataset.blockName;
  const componentID = generateComponentID(component, componentName);

  // Check if the component is browse card
  const hasBrowseCardClass = (element) => {
    if (!element) return false;
    if (element.classList?.contains('browse-card')) return true;
    return hasBrowseCardClass(element.parentElement);
  };

  // Only trigger componentClick here for non-browse-card components
  if (!hasBrowseCardClass(component) && !hasBrowseCardClass(e.target)) {
    pushComponentClick({
      component: componentName,
      componentID,
      linkTitle,
      linkType: headerText,
      destinationDomain,
    });
  }
}

/**
 * Used to push a video event to the data layer
 * @param {Video} video
 * @param {string} event
 */
export function pushVideoEvent(video, event = 'videoPlay') {
  const { title, description, url } = video;

  const videoDuration = video.duration || '';
  const videoSolution = video.solution || solution || '';
  const videoFullSolution = video.fullSolution || fullSolution || '';
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event,
    video: {
      title,
      description,
      url,
      duration: videoDuration,
      solution: videoSolution,
      fullSolution: videoFullSolution,
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

export function assetInteractionModel(id, assetInteractionType, options) {
  const { filters, trackingInfo } = options || {};
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
    ...(trackingInfo?.course && { courses: trackingInfo.course }),
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
 * Fetches course, module, and step information for analytics events
 * @param {string} stepType - The type of step ('quiz' or 'content')
 * @param {Object} [existingStepInfo] - Optional existing step info object
 * @returns {Promise<Object>} Object containing course, module, and step information
 */
export async function getEventInfo(stepType = 'content', existingStepInfo = null) {
  try {
    const { getCurrentStepInfo, getCurrentCourseMeta } = await import('../courses/course-utils.js');

    const stepInfo = existingStepInfo || (await getCurrentStepInfo());
    const courseMeta = await getCurrentCourseMeta();
    const parts = courseMeta?.url.split('/').filter(Boolean).slice(1).join('/');

    const courseTitle = courseMeta?.heading || '';
    const courseId = parts ? `/${parts}` : '';

    const courseFullSolution = courseMeta?.solution || '';
    const courseSolution = courseFullSolution.split(',')[0].trim() || '';

    const courseRole = courseMeta?.role || '';
    const courseLevel = courseMeta?.level || '';

    const moduleTitle = stepInfo?.moduleHeader || '';

    // Get step title either from meta tag or from step info
    let stepTitle = document.querySelector('meta[property="og:title"]')?.content || '';

    // If we have step info and no title from meta tag, try to get it from step info
    if (stepInfo && !stepTitle && stepInfo.moduleSteps) {
      const currentStep = stepInfo.moduleSteps.find((step) => step.url === window.location.pathname);
      if (currentStep) {
        stepTitle = currentStep.name;
      }
    }

    return {
      courses: {
        title: courseTitle,
        id: courseId,
        solution: courseSolution,
        fullSolution: courseFullSolution,
        role: courseRole,
        level: courseLevel,
      },
      module: {
        title: moduleTitle,
      },
      steps: {
        title: stepTitle,
        type: stepType,
      },
    };
  } catch (e) {
    console.error('Error getting event info:', e);
    return {
      courses: { title: '', id: '', solution: '', fullSolution: '', role: '', level: '' },
      module: { title: '' },
      steps: { title: '', type: stepType },
    };
  }
}

// @returns {Promise<Object>} Object containing course, module, and step information

export async function getQuizEventInfo() {
  return getEventInfo('quiz');
}

/**
 * Used to push a quiz event to the data layer
 * @param {string} eventName - The name of the event (quizStart, quizSubmit, quizCompleted)
 */
export async function pushQuizEvent(eventName) {
  if (!courses) return;

  try {
    const eventData = await getEventInfo('quiz');

    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: eventName,
      ...eventData,
    });
  } catch (e) {
    // Log error but don't throw to prevent breaking the user experience
    console.error(`Error pushing quiz event ${eventName}:`, e);
  }
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
 * Pushes the stepsStart event to the adobeDataLayer when a user begins a step
 * This event should not be triggered for quiz steps as they already have quizstart event
 * @param {Object} stepInfo - The step information object from getCurrentStepInfo()
 */
export async function pushStepsStartEvent(stepInfo) {
  if (!courses || !stepInfo) return;

  // Check if the current step is a quiz step
  const isQuizStep = stepInfo.isQuiz || document.querySelector('.quiz') !== null;

  // Don't trigger the event for quiz steps
  if (isQuizStep) {
    return;
  }

  try {
    const eventData = await getEventInfo('content', stepInfo);

    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({
      event: 'stepsStart',
      ...eventData,
    });
  } catch (e) {
    // Log error but don't throw to prevent breaking the user experience
    console.error('Error pushing stepsStart event:', e);
  }
}

/**
 * Pushes a course certificate event to the Adobe data layer.
 * @param {Object} trackingData - Tracking data
 * @param {string} trackingData.action - The action performed, e.g., 'download' or 'share'
 * @param {string} trackingData.title - Title of the course
 * @param {string} trackingData.id - ID of the course
 * @param {string} trackingData.solution - Solution related to the course
 * @param {string} trackingData.role - Role associated with the course
 * @param {string} trackingData.linkTitle - CTA text for the button
 * @param {string} trackingData.destinationDomain - Destination domain for the link
 */
export function pushCourseCertificateEvent(trackingData) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  let eventName;
  let linkType;
  if (trackingData.action === 'download') {
    eventName = 'courseCertificateDownload';
    linkType = 'Download';
  } else if (trackingData.action === 'share') {
    eventName = 'courseCertificateShare';
    linkType = 'Share';
  }

  const courseSolutionFull = trackingData.fullSolution || trackingData.solution;

  const dataLayerEntry = {
    event: eventName,
    link: {
      linkTitle: trackingData.linkTitle,
      linkLocation: 'Body',
      linkType,
      destinationDomain: trackingData.destinationDomain,
    },
    courses: {
      title: trackingData.title,
      id: trackingData.id,
      solution: trackingData.solution,
      fullSolution: courseSolutionFull,
      role: trackingData.role,
      level: trackingData.level || '',
    },
  };

  window.adobeDataLayer.push(dataLayerEntry);
}

export async function pushCourseCompletionEvent(courseId, currentCourses) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const { getCurrentCourseMeta } = await import('../courses/course-utils.js');
  const courseMeta = await getCurrentCourseMeta();

  const courseInfo = currentCourses.find((c) => c.courseId === courseId);
  let startTime = null;
  const finishTime = courseInfo?.awards?.timestamp || '';
  let courseDuration = null;

  if (courseInfo?.modules && Array.isArray(courseInfo?.modules)) {
    courseInfo.modules.forEach((mod) => {
      if (mod?.startedAt) {
        if (!startTime || new Date(mod.startedAt) < new Date(startTime)) {
          startTime = mod.startedAt;
        }
      }
    });

    if (startTime && finishTime) {
      const durationMs = new Date(finishTime) - new Date(startTime);
      courseDuration = Math.round(durationMs / 60000); // duration in minutes
    }
  }

  const courseFullSolution = courseMeta?.solution || '';
  const courseSolution = courseFullSolution?.split(',')[0].trim() || '';

  window.adobeDataLayer.push({
    event: 'coursesCompleted',
    courses: {
      title: courseMeta?.heading || '',
      id: courseId,
      solution: courseSolution,
      fullSolution: courseFullSolution,
      role: courseMeta?.role || '',
      level: courseMeta?.level || '',
      finishTime,
      duration: courseDuration,
    },
  });
}

export async function pushModuleStartEvent(courseId) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const { getCurrentCourseMeta, getCurrentStepInfo } = await import('../courses/course-utils.js');

  const courseMeta = await getCurrentCourseMeta();
  const stepInfo = await getCurrentStepInfo();

  const courseFullSolution = courseMeta?.solution || '';
  const courseSolution = courseFullSolution?.split(',')[0].trim() || '';

  window.adobeDataLayer.push({
    event: 'moduleStart',
    module: {
      title: stepInfo?.moduleHeader || '',
    },
    courses: {
      title: courseMeta?.heading || '',
      id: courseId || '',
      solution: courseSolution,
      fullSolution: courseFullSolution,
      role: courseMeta?.role || '',
      level: courseMeta?.level || '',
    },
  });
}

export async function pushModuleCompletionEvent(courseId) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const { getCurrentCourseMeta, getCurrentStepInfo } = await import('../courses/course-utils.js');

  const courseMeta = await getCurrentCourseMeta();
  const stepInfo = await getCurrentStepInfo();

  const courseFullSolution = courseMeta?.solution || '';
  const courseSolution = courseFullSolution?.split(',')[0].trim() || '';

  window.adobeDataLayer.push({
    event: 'moduleCompleted',
    module: {
      title: stepInfo?.moduleHeader || '',
    },
    courses: {
      title: courseMeta?.heading || '',
      id: courseId || '',
      solution: courseSolution,
      fullSolution: courseFullSolution,
      role: courseMeta?.role || '',
      level: courseMeta?.level || '',
    },
  });
}

/**
 * Pushes a course start event to the Adobe data layer.
 * @param {Object} courseData - Course data
 * @param {string} courseData.title - Title of the course
 * @param {string} courseData.id - ID of the course
 * @param {string} courseData.solution - Solution related to the course
 * @param {string} courseData.fullSolution - Full solution (comma-separated)
 * @param {string} courseData.role - Role associated with the course
 * @param {string} courseData.level - Level (comma-separated)
 * @param {string} courseData.startTime - Start time of the course
 */
export function pushCourseStartEvent(courseData) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'coursesStart',
    courses: {
      title: courseData.title,
      id: courseData.id,
      solution: courseData.solution,
      fullSolution: courseData.fullSolution || courseData.solution,
      role: courseData.role,
      level: courseData.level || '',
      startTime: courseData.startTime,
    },
  });
}

/**
 * Pushes a browse card click event to the Adobe Data Layer.
 * This event is fired whenever a user clicks on any part of a browse card.
 *
 * @param {string} eventName - The name of the event to be pushed (e.g., "browseCardClicked").
 * @param {Object} cardData - The data object representing the browse card.
 * @param {string} [cardData.contentType] - The type of content represented by the card (e.g., "article", "video").
 * @param {string} [cardData.viewLink] - The destination URL or domain the card points to.
 * @param {string} [cardData.title] - The display title of the card.
 * @param {string} cardHeader - The header or category associated with the card (used as `linkType`).
 * @param {number} cardPosition - The index or position of the card within the list/grid.
 */
export function pushBrowseCardClickEvent(eventName, cardData, cardHeader, cardPosition) {
  window.adobeDataLayer = window.adobeDataLayer || [];
  const product = cardData?.product;
  const cardFullSolution = Array.isArray(product) ? product.join(',') : product || '';

  const cardSolution = Array.isArray(product) ? product[0] : product?.split(',')[0]?.trim() || '';

  // Determining if the card is in list or grid view
  const eventsBlock = document.activeElement?.closest('.upcoming-event-v2, .upcoming-event');
  let viewType = null;
  let hasViewSwitcher = false;

  if (eventsBlock) {
    viewType = eventsBlock.classList.contains('list') ? 'List' : 'Grid';
    hasViewSwitcher = !!eventsBlock.querySelector('.browse-cards-view-switcher');
  }

  const dataLayerEntry = {
    event: eventName,
    link: {
      contentType: cardData?.contentType?.toLowerCase().trim() || '',
      fullSolution: cardFullSolution,
      solution: cardSolution || '',
      destinationDomain: cardData?.viewLink || '',
      linkTitle: cardData?.title || '',
      linkLocation: 'body',
      linkType: hasViewSwitcher && viewType ? `${viewType} | ${cardHeader}` : cardHeader,
      position: cardPosition,
    },
  };

  window.adobeDataLayer.push(dataLayerEntry);

  // Check if the click was on a user-action (bookmark or copy link buttons)
  const isUserAction = document.activeElement?.closest('.user-actions') !== null;

  // Only trigger componentClick event if not a user-action click
  if (!isUserAction) {
    // Get the component name
    let componentName = 'browse-card';
    const browseCardElement = document.activeElement?.closest('[data-block-name]');
    if (browseCardElement && browseCardElement.dataset.blockName) {
      componentName = browseCardElement.dataset.blockName;
    }

    const componentID = generateComponentID(browseCardElement, componentName);

    pushComponentClick({
      component: componentName,
      componentID,
      linkTitle: cardData?.title || '',
      linkType: cardHeader,
      destinationDomain: cardData?.viewLink || '',
      contentType: cardData?.contentType?.toLowerCase().trim() || '',
      solution: cardSolution || '',
      fullSolution: cardFullSolution || '',
      position: cardPosition,
    });
  }
}

/**
 * Pushes a browse filter search event to the Adobe Data Layer.
 * This event is fired whenever a user clicks on any part of a browse card.
 * This event is fired when users interact with search and filter functionality.
 *
 * @param {string} searchType - Type of search: "filter", "search", or "filter+search"
 * @param {string} [filterType] - Comma-separated list of filter categories
 * @param {string} [filterValue] - Comma-separated list of filter values aligned with filterType
 * @param {string} [searchValue] - Keyword entered by user
 * @param {number} results - Integer count of results returned
 */
export function pushBrowseFilterSearchEvent(searchType, filterType, filterValue, searchValue, results) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const dataLayerEntry = {
    event: 'browseFilterSearch',
    input: {
      searchType,
      results,
    },
  };

  // Adding appropriate properties based on searchType
  if (searchType === 'filter' || searchType === 'filter+search') {
    dataLayerEntry.input.filterType = filterType;
    dataLayerEntry.input.filterValue = filterValue;
  }

  if (searchType === 'search' || searchType === 'filter+search') {
    dataLayerEntry.input.searchValue = searchValue;
  }

  window.adobeDataLayer.push(dataLayerEntry);
}

/**
 * Pushes a browse filter search clear event to the Adobe Data Layer.
 * This event is fired when users click the Clear Filters button.
 *
 * @param {string} searchType - Type of search that was used before clearing
 * @param {string} [filterType] - Comma-separated list of filter categories before clearing
 * @param {string} [filterValue] - Comma-separated list of filter values before clearing
 * @param {string} [searchValue] - Keyword entered before clearing
 * @param {number} results - Integer count of results before clearing
 */
export function pushBrowseFilterSearchClearEvent(searchType, filterType, filterValue, searchValue, results) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const dataLayerEntry = {
    event: 'browseFilterSearchClear',
    input: {
      searchType,
      results,
    },
  };

  // Adding appropriate properties based on searchType
  if (searchType === 'filter' || searchType === 'filter+search') {
    dataLayerEntry.input.filterType = filterType;
    dataLayerEntry.input.filterValue = filterValue;
  }

  if (searchType === 'search' || searchType === 'filter+search') {
    dataLayerEntry.input.searchValue = searchValue;
  }

  window.adobeDataLayer.push(dataLayerEntry);
}

/**
 * Pushes a grid toggle event to the Adobe Data Layer.
 * This event is fired when users switch to grid view.
 * @param {string} cardHeader - The header associated with the block.
 */
export function pushGridToggleEvent(cardHeader) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'browseCardGridToggle',
    link: {
      linkType: cardHeader,
    },
  });
}

/**
 * Pushes a list toggle event to the Adobe Data Layer.
 * This event is fired when users switch to list view.
 * @param {string} cardHeader - The header associated with the block.
 */
export function pushListToggleEvent(cardHeader) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'browseCardListToggle',
    link: {
      linkType: cardHeader,
    },
  });
}

function pushComponentImpressionEvent(data) {
  window.adobeDataLayer.push({
    event: 'componentImpression',
    component: data.component || '',
    componentID: data.componentID || '',
    link: {
      contentType: data.contentType || '',
      destinationDomain: data.destinationDomain || '',
      fullSolution: data.fullSolution || '',
      linkLocation: data.linkLocation || '',
      linkTitle: data.linkTitle || '',
      linkType: data.linkType || '',
      solution: data.solution || '',
      productV2: '',
      featureV2: '',
      subFeatureV2: '',
      topicV2: '',
      industryV2: '',
      roleV2: '',
      levelV2: '',
    },
  });
}

export function setupComponentImpressions() {
  window.adobeDataLayer = window.adobeDataLayer || [];

  const visibilityState = new WeakMap();
  const debounceTimers = new WeakMap();
  const DEBOUNCE_TIME = 2000;

  const componentSelectors = [
    '[data-block-name="marquee"]',
    '[data-block-name="columns"]',
    '[data-block-name="announcement-ribbon"]',
    '[data-block-name="media"]',
    '[data-block-name="detailed-teaser"]',
    '[data-block-name="carousel"] [data-panel]',
    '[data-block-name="authorable-card"]',
  ];

  function fireImpression(unit) {
    if (unit.hasAttribute('data-panel') && !unit.classList.contains('active')) {
      return;
    }

    const currentUrl = window.location.href.split('#')[0];
    const component = unit.closest('[data-block-name]');
    const componentName = component?.dataset.blockName || 'unknown';

    let componentID = currentUrl;

    if (component) {
      const allComponentsOfType = document.querySelectorAll(`[data-block-name="${componentName}"]`);

      let instanceNumber = 1;
      for (let i = 0; i < allComponentsOfType.length; i += 1) {
        if (allComponentsOfType[i] === component) break;
        instanceNumber += 1;
      }

      componentID =
        allComponentsOfType.length > 1
          ? `${currentUrl}#${componentName}${instanceNumber}`
          : `${currentUrl}#${componentName}`;
    }

    let links = [];
    let isAuthorableCard = false;

    if (unit.classList.contains('browse-card')) {
      isAuthorableCard = true;
      const anchor = unit.closest('a[href]');
      if (anchor) links = [anchor];
    } else {
      links = unit.querySelectorAll('a[href]');
    }

    if (links.length) {
      links.forEach((link) => {
        let linkTitleText = '';
        let contentType = '';
        let componentSolution = '';
        let componentFullSolution = '';
        let headerText = '';
        if (isAuthorableCard) {
          linkTitleText = unit.querySelector('.browse-card-title-text')?.innerText?.trim() || '';
          headerText = component?.querySelector('h1,h2,h3,h4')?.textContent?.trim() || '';
          contentType =
            unit.closest('[data-analytics-content-type]')?.getAttribute('data-analytics-content-type') || '';
          const baseSolution = unit.querySelector('.browse-card-solution-text')?.innerText?.trim() || '';

          const capitalize = (s) => s.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

          if (baseSolution.toLowerCase() === 'multisolution') {
            const tooltip = unit.querySelector('.tooltip-text')?.textContent?.trim() || '';
            componentFullSolution = tooltip;
            componentSolution = tooltip.split(',')[0].trim();
          } else {
            componentSolution = capitalize(baseSolution);
            componentFullSolution = capitalize(baseSolution);
          }
        } else {
          linkTitleText = link.innerText?.trim() || '';
          headerText =
            unit.querySelector('h1,h2,h3,h4')?.innerText?.trim() ||
            component?.querySelector('h1,h2,h3,h4')?.innerText?.trim() ||
            '';
        }
        pushComponentImpressionEvent({
          component: componentName,
          componentID,
          linkTitle: linkTitleText || '',
          linkType: headerText,
          destinationDomain: link.href || '',
          linkLocation: 'body',
          contentType,
          solution: componentSolution,
          fullSolution: componentFullSolution,
        });
      });
    } else {
      pushComponentImpressionEvent({
        component: componentName,
        componentID,
      });
    }
  }

  function cancelDebounce(unit) {
    const timer = debounceTimers.get(unit);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(unit);
    }
  }

  function startDebounce(unit) {
    cancelDebounce(unit);
    const timer = setTimeout(() => {
      fireImpression(unit);
    }, DEBOUNCE_TIME);
    debounceTimers.set(unit, timer);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const unit = entry.target;
        const isVisible = entry.isIntersecting;
        const wasVisible = visibilityState.get(unit) || false;

        if (unit.dataset.blockName === 'authorable-card') {
          const cards = unit.querySelectorAll('.browse-card');
          if (!cards.length) return;
          cards.forEach((card) => {
            visibilityState.delete(card);
            debounceTimers.delete(card);
            observer.observe(card);
          });
          observer.unobserve(unit);
          return;
        }

        if (!wasVisible && isVisible) {
          visibilityState.set(unit, true);
          startDebounce(unit);
        }

        if (wasVisible && !isVisible) {
          visibilityState.set(unit, false);
          cancelDebounce(unit);
        }
      });
    },
    { threshold: 0.6 },
  );

  document.querySelectorAll(componentSelectors.join(',')).forEach((component) => {
    if (component.dataset.blockName === 'authorable-card') {
      observer.observe(component);
    } else if (component.dataset.blockName === 'columns') {
      component.querySelectorAll(':scope > div > div').forEach((col) => {
        observer.observe(col);
      });
    } else if (component.dataset.blockName === 'carousel') {
      component.querySelectorAll('[data-panel]').forEach((panel) => {
        observer.observe(panel);
      });
    } else {
      observer.observe(component);
    }
  });
}
