import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getModuleMeta } from '../../scripts/courses/course-utils.js';

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

const SKILL_TRACK_CARD_STATUS = {
  DISABLED: 'disabled',
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

function headerDom(title, moduleCount, moduleTime, placeholder) {
  const header = document.createElement('div');
  header.classList.add('course-breakdown-header');
  header.innerHTML = `
        ${title.innerHTML}
        <div class="cb-header-info">
          <span class="icon icon-course-outline"></span>
          <span class="cb-module-count">${moduleCount} ${placeholder.courseBreakdownModuleCountText || 'Modules'}</span>
          <span class="separator">•</span>
          <span class="cb-module-time">${moduleTime.textContent}</span>
        </div>
    `;
  decorateIcons(header);
  return header;
}

function infoCardDom(title, description, placeholders) {
  const card = document.createElement('div');
  card.classList.add('course-breakdown-info-card');
  card.innerHTML = `
      <div>
        ${title.innerHTML}
        <button>
          ${placeholders.courseBreakdownInfoSignInButton || 'Sign In to Start'}
        </button>
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
 * @param {Promise<moduleMeta>} modulePromise - The promise that resolves to the Module meta
 * @param {number} index - The index of the Module card
 * @param {boolean} open - Whether the Module card is open
 * @param {SKILL_TRACK_CARD_STATUS} status - The status of the Module card
 * @param {Object} placeholders - The placeholders object from placeholders.json
 * @returns {HTMLElement}
 */
function moduleCard({
  modulePromise,
  index,
  open = false,
  status = SKILL_TRACK_CARD_STATUS.NOT_STARTED,
  placeholders,
}) {
  // Check if this module is marked as completed via query param
  const finalStatus = isModuleCompleted(index) ? SKILL_TRACK_CARD_STATUS.COMPLETED : status;
  const CardShimmer = moduleCardShimmer();

  const startButtonTextMap = {
    [SKILL_TRACK_CARD_STATUS.DISABLED]: placeholders.courseBreakdownModuleButtonNotStarted || 'Start Module',
    [SKILL_TRACK_CARD_STATUS.NOT_STARTED]: placeholders.courseBreakdownModuleButtonNotStarted || 'Start Module',
    [SKILL_TRACK_CARD_STATUS.IN_PROGRESS]: placeholders.courseBreakdownModuleButtonInProgress || 'Resume Module',
    [SKILL_TRACK_CARD_STATUS.COMPLETED]: placeholders.courseBreakdownModuleButtonCompleted || 'Review Module',
  };
  const startButtonText = startButtonTextMap[finalStatus] || 'Start Module';

  const moduleCardStatusMap = {
    [SKILL_TRACK_CARD_STATUS.DISABLED]: placeholders.courseBreakdownStatusNotStarted || 'Not Started',
    [SKILL_TRACK_CARD_STATUS.NOT_STARTED]: placeholders.courseBreakdownStatusNotStarted || 'Not Started',
    [SKILL_TRACK_CARD_STATUS.IN_PROGRESS]: placeholders.courseBreakdownStatusInProgress || 'In progress',
    [SKILL_TRACK_CARD_STATUS.COMPLETED]: placeholders.courseBreakdownStatusCompleted || 'Complete',
  };
  const moduleCardStatusText = moduleCardStatusMap[finalStatus] || 'Not started';

  modulePromise.then((moduleMeta) => {
    const card = document.createElement('div');
    card.className = 'course-breakdown-module-card';

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
          <span class="cb-module-number ${finalStatus}">
          ${
            finalStatus === SKILL_TRACK_CARD_STATUS.COMPLETED
              ? '<span class="icon icon-checkmark-light"></span>'
              : index + 1
          }
            </span>
          <h3 class="cb-module-title">${moduleMeta.moduleHeader || 'Module Title'}</h3>
        </div>
        <button class="button cb-start-btn ${finalStatus}" >
          <a href="${moduleMeta.moduleSteps[0].url || '#'}">${startButtonText}</a>
        </button>
      </div>
        <div class="cb-steps-info ${open ? 'open' : ''}">
          <span class="cb-steps-info-text">${placeholders.courseBreakdownModuleDetails || 'Module details'}</span>
          <span class="cb-chevron"> <span class="icon icon-chevron"></span></span>
          <span class="cb-steps-status-text ${finalStatus}">${moduleCardStatusText}</span>
        </div>
      </div>
      <div class="cb-steps-list ${open ? 'open' : ''}">
        ${stepsList}
      </div>
    `;

    // Add the status class to the entire card to get the green border for completed modules
    card.classList.add(finalStatus);
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

/**
 * Determines the status of a module based on its index and previous module completion status
 *
 * @param {number} index - The index of the module
 * @param {boolean} prevModuleCompleted - Whether the previous module is completed
 * @returns {Array} - Array containing [moduleStatus, updatedPrevModuleCompleted]
 */
function determineModuleStatus(index, prevModuleCompleted) {
  let moduleStatus;
  let newPrevModuleCompleted = prevModuleCompleted;

  if (index === 0) {
    // First module is always NOT_STARTED unless completed
    moduleStatus = SKILL_TRACK_CARD_STATUS.NOT_STARTED;
  } else if (prevModuleCompleted) {
    // If previous module is completed, this module should be enabled
    moduleStatus = SKILL_TRACK_CARD_STATUS.NOT_STARTED;
  } else {
    // Otherwise, module is disabled
    moduleStatus = SKILL_TRACK_CARD_STATUS.DISABLED;
  }

  // Check if this module is marked as completed via query param
  if (isModuleCompleted(index)) {
    moduleStatus = SKILL_TRACK_CARD_STATUS.COMPLETED;
    newPrevModuleCompleted = true;
  } else {
    newPrevModuleCompleted = false;
  }

  return [moduleStatus, newPrevModuleCompleted];
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

  block.textContent = '';
  block.append(headerDom(title, modules?.length, moduleTime, placeholders));
  block.append(infoCardDom(infoTitle, infoDescription, placeholders));

  // Keep track of previous module status to enable the next module after a completed one
  let prevModuleCompleted = false;

  modules.forEach((module, index) => {
    const moduleFragment = module.querySelector('a')?.getAttribute('href');
    const modulePromise = getModuleMeta(moduleFragment, placeholders);

    // Determine module status using the extracted function
    // The function returns [moduleStatus, newPrevModuleCompleted]
    const [moduleStatus, newPrevModuleCompleted] = determineModuleStatus(index, prevModuleCompleted);

    // Update prevModuleCompleted for the next iteration
    prevModuleCompleted = newPrevModuleCompleted;

    const moduleProp = {
      modulePromise,
      index,
      open: index === 0,
      status: moduleStatus,
      placeholders,
    };

    const moduleCardElement = moduleCard(moduleProp);
    module.innerHTML = '';
    module.append(moduleCardElement);
    block.append(module);
  });
}
