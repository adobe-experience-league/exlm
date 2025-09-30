import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getModuleMeta } from '../../scripts/courses/course-utils.js';
import { MODULE_STATUS, getCourseStatus, getModuleStatus, getLastAddedModule } from '../../scripts/courses/course-profile.js';

// Function to check if a module is completed based on query parameter
function isModuleCompleted(moduleIndex) {
  const urlParams = new URLSearchParams(window.location.search);
  const completedModules = urlParams.get('completed');

  if (!completedModules) return false;

  // Check if the module index is in the completed modules list
  // Format: ?completed=0,1,2 (comma-separated indices)
  const completedIndices = completedModules.split(',').map((idx) => parseInt(idx, 10));
  return completedIndices.includes(moduleIndex);
}

function headerDom(title, moduleCount, moduleTime, courseStatus, placeholder) {
  const header = document.createElement('div');
  header.classList.add('course-breakdown-header');


  if(courseStatus) {
    const startButtonTextMap = {
      [MODULE_STATUS.NOT_STARTED]: placeholder.courseBreakdownButtonNotStarted || 'Start Learning',
      [MODULE_STATUS.IN_PROGRESS]: placeholder.courseBreakdownButtonInProgress || 'Continue Learning',
      [MODULE_STATUS.COMPLETED]: placeholder.courseBreakdownButtonCompleted || 'Review Course',
    };
    const startButtonText = startButtonTextMap[courseStatus] || 'Start Learning';
    const startButton = document.createElement('a');
    startButton.classList.add("course-breakdown-header-start-button", "button");
    startButton.textContent = startButtonText;
    getLastAddedModule().then((lastAddedModuleUrl)=>{
      startButton.href = lastAddedModuleUrl;
      header.append(startButton);
    })
  }

  header.innerHTML = `
  <div>
        ${title.innerHTML}
        <div class="cb-header-info">
          <span class="icon icon-course-outline"></span>
          <span class="cb-module-count">${moduleCount} ${placeholder.courseBreakdownModuleCountText || 'Modules'}</span>
          <span class="separator">•</span>
          <span class="cb-module-time">${moduleTime.textContent}</span>
        </div>
  </div>
    `;
  decorateIcons(header);
  return header;
}

function infoCardDom(title, description, courseStatus, placeholders) {
  const card = document.createElement('div');
  card.classList.add('course-breakdown-info-card');

  card.innerHTML = `
      <div>
        ${title.innerHTML}
        ${!courseStatus ? `<button>
          ${placeholders.courseBreakdownInfoSignInButton || 'Sign In to Start'}
        </button>` : ''}
        
      </div>
      ${description.innerHTML}
      <div>
        <img src="${window.hlx.codeBasePath}/images/course-certificate.png" alt="Course Certificate placeholder" />
        <p>${
          placeholders.courseBreakdownInfoFooterText ||
          'Plus, earn a Certificate of Completion to share your accomplishment with your network.'
        }</p>
      </div>
    `;
    
    if(!courseStatus) {
      card.querySelector('button')?.addEventListener('click', ()=>{
        window.adobeIMS.signIn();
      })
    }
  return card;
}

function moduleCardShimmer() {
  const card = document.createElement('div');
  card.className = 'course-breakdown-module-card-shimmer';

  card.innerHTML = `
    <div class="cb-module-shimmer-header">
      <span class="cb-shimmer cb-shimmer-circle" style="width:32px;height:32px;"></span>
      <span class="cb-shimmer cb-shimmer-title" style="width:220px;height:20px;"></span>
      <span class="cb-shimmer cb-shimmer-btn" style="width:96px;height:28px;"></span>
    </div>
    <div class="cb-module-shimmer-progress-row">
      <span class="cb-shimmer cb-shimmer-steps-label" style="width:120px;height:16px;"></span>
      <span class="cb-shimmer cb-shimmer-progress-text" style="width:80px;height:16px;"></span>
    </div>
  `;

  return card;
}

/**
 * @param {Promise<{moduleMeta, moduleStatus}>} modulePromise - The promise that resolves to the Module meta and status
 * @param {number} index - The index of the Module card
 * @param {boolean} open - Whether the Module card is open
 * @param {Object} placeholders - The placeholders object from placeholders.json
 * @returns {HTMLElement}
 */
function moduleCard({ modulePromise, index, open = false, placeholders }) {
  const CardShimmer = moduleCardShimmer();

  const startButtonTextMap = {
    [MODULE_STATUS.DISABLED]: placeholders.courseBreakdownModuleButtonNotStarted || 'Start Module',
    [MODULE_STATUS.NOT_STARTED]: placeholders.courseBreakdownModuleButtonNotStarted || 'Start Module',
    [MODULE_STATUS.IN_PROGRESS]: placeholders.courseBreakdownModuleButtonInProgress || 'Resume Module',
    [MODULE_STATUS.COMPLETED]: placeholders.courseBreakdownModuleButtonCompleted || 'Review Module',
  };

  const moduleCardStatusMap = {
    [MODULE_STATUS.DISABLED]: placeholders.courseBreakdownStatusNotStarted || 'Not Started',
    [MODULE_STATUS.NOT_STARTED]: placeholders.courseBreakdownStatusNotStarted || 'Not Started',
    [MODULE_STATUS.IN_PROGRESS]: placeholders.courseBreakdownStatusInProgress || 'In progress',
    [MODULE_STATUS.COMPLETED]: placeholders.courseBreakdownStatusCompleted || 'Complete',
  };

  modulePromise.then(({ moduleMeta, moduleStatusBasedonProfile }) => {
    let moduleStatus = moduleStatusBasedonProfile;
    const card = document.createElement('div');
    card.className = 'course-breakdown-module-card';
    
    // If module is completed via query param, set module status to completed
    if(isModuleCompleted(index)) {
      moduleStatus = MODULE_STATUS.COMPLETED;
    }

    if(!moduleStatus) {
      moduleStatus = MODULE_STATUS.DISABLED;
    }

    const startButtonText = startButtonTextMap[moduleStatus] || 'Start Module';
    const moduleCardStatusText = moduleCardStatusMap[moduleStatus] || 'Not started';


    // Create steps list
    const stepsList =
      moduleMeta.moduleSteps
        ?.map(
          (step, stepIndex) =>
            `
        <div class="cb-step-item">
          <span class="cb-step-number">${stepIndex + 1}.</span>
          <span class="cb-step-title">${step.name}</span>
        </div>
      `,
        )
        .join('') || '';

    card.innerHTML = `
      <div class="cb-module-header">
        <div class="cb-module-title-wrapper">
          <span class="cb-module-number ${moduleStatus}">
          ${moduleStatus === MODULE_STATUS.COMPLETED ? '<span class="icon icon-checkmark-light"></span>' : index + 1}
            </span>
          <h3 class="cb-module-title">${moduleMeta.moduleHeader || 'Module Title'}</h3>
        </div>
        <button class="button cb-start-btn ${moduleStatus}" >
          <a href="${moduleMeta.moduleSteps[0].url || '#'}">${startButtonText}</a>
        </button>
      </div>
        <div class="cb-steps-info ${open ? 'open' : ''}">
          <span class="cb-steps-info-text">${placeholders.courseBreakdownModuleDetails || 'Module details'}</span>
          <span class="cb-chevron"> <span class="icon icon-chevron"></span></span>
          <span class="cb-steps-status-text ${moduleStatus}">${moduleCardStatusText}</span>
        </div>
      </div>
      <div class="cb-steps-list ${open ? 'open' : ''}">
        ${stepsList}
      </div>
    `;

    // Add the status class to the entire card to get the green border for completed modules
    card.classList.add(moduleStatus);
    decorateIcons(card);

    // Add click handler for steps info
    const stepInfo = card.querySelector('.cb-steps-info');
    const stepsListEl = card.querySelector('.cb-steps-list');

    stepInfo.addEventListener('click', () => {
      stepsListEl.classList.toggle('open');
      stepInfo.classList.toggle('open');
    });

    // Replace shimmer with actual card
    CardShimmer.replaceWith(card);
  });
  return CardShimmer;
}


export default async function decorate(block) {
  const [title, moduleTime, infoTitle, infoDescription, ...modules] = block.children;

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const courseStatus = await getCourseStatus();

  block.textContent = '';
  block.append(headerDom(title, modules?.length, moduleTime, courseStatus, placeholders));
  block.append(infoCardDom(infoTitle, infoDescription, courseStatus, placeholders));

  modules.forEach((module, index) => {
    const moduleFragment = module.querySelector('a')?.getAttribute('href');
    const modulePromise = Promise.all([
      getModuleMeta(moduleFragment, placeholders),
      getModuleStatus(moduleFragment)
    ]).then(([moduleMeta, moduleStatusBasedonProfile]) => ({
      moduleMeta,
      moduleStatusBasedonProfile
    }));

    const moduleProp = {
      modulePromise,
      index,
      open: index === 0,
      placeholders,
    };

    const moduleCardElement = moduleCard(moduleProp);
    module.innerHTML = '';
    module.append(moduleCardElement);
    block.append(module);
  });
}
