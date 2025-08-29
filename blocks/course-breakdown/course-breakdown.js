import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getSkillTrackMeta } from '../../scripts/utils/course-utils.js';

const SKILL_TRACK_CARD_STATUS = {
  DISABLED: 'disabled',
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

function Header(title, moduleCount, moduleTime, placeholder) {
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

function InfoCard(title, description, placeholders) {
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
        <img src="/images/course-certificate.png" alt="Course Certificate placeholder" />
        <p>${
          placeholders.courseBreakdownInfoFooterText ||
          'Plus, earn a Certificate of Completion to share your accomplishment with your network.'
        }</p>
      </div>
    `;
  return card;
}

function SkillTrackCardShimmer() {
  const card = document.createElement('div');
  card.className = 'course-breakdown-skill-track-card-shimmer';

  card.innerHTML = `
    <div class="cb-skill-track-shimmer-header">
      <span class="cb-shimmer cb-shimmer-circle" style="width:32px;height:32px;"></span>
      <span class="cb-shimmer cb-shimmer-title" style="width:220px;height:20px;"></span>
      <span class="cb-shimmer cb-shimmer-btn" style="width:96px;height:28px;"></span>
    </div>
    <div class="cb-skill-track-shimmer-progress-row">
      <span class="cb-shimmer cb-shimmer-steps-label" style="width:120px;height:16px;"></span>
      <div class="cb-shimmer-progress-bar">
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
        <span class="cb-shimmer cb-shimmer-progress-dot" style="width:20px;height:20px;"></span>
      </div>
      <span class="cb-shimmer cb-shimmer-progress-text" style="width:80px;height:16px;"></span>
    </div>
  `;

  return card;
}

/**
 * @param {Promise<SkillTrackMeta>} SkillTrackPromise - The promise that resolves to the skill track meta
 * @param {number} index - The index of the skill track card
 * @param {boolean} open - Whether the skill track card is open
 * @param {SKILL_TRACK_CARD_STATUS} status - The status of the skill track card
 * @param {Object} placeholders - The placeholders object from placeholders.json
 * @returns {HTMLElement}
 */
function SkillTrackCard({
  SkillTrackPromise,
  index,
  open = false,
  status = SKILL_TRACK_CARD_STATUS.NOT_STARTED,
  placeholders,
}) {
  const CardShimmer = SkillTrackCardShimmer();

  const startButtonTextMap = {
    [SKILL_TRACK_CARD_STATUS.DISABLED]: placeholders.courseBreakdownModuleButtonDisabled || 'Start Module',
    [SKILL_TRACK_CARD_STATUS.NOT_STARTED]: placeholders.courseBreakdownModuleButtonNotStarted || 'Start Module',
    [SKILL_TRACK_CARD_STATUS.IN_PROGRESS]: placeholders.courseBreakdownModuleButtonInProgress || 'Resume Module',
    [SKILL_TRACK_CARD_STATUS.COMPLETED]: placeholders.courseBreakdownModuleButtonCompleted || 'Review Module',
  };
  const startButtonText = startButtonTextMap[status] || 'Start Module';

  const skillTrackCardStatusMap = {
    [SKILL_TRACK_CARD_STATUS.DISABLED]: placeholders.courseBreakdownStatusDisabled || 'Not Started',
    [SKILL_TRACK_CARD_STATUS.NOT_STARTED]: placeholders.courseBreakdownStatusNotStarted || 'Not Started',
    [SKILL_TRACK_CARD_STATUS.IN_PROGRESS]: placeholders.courseBreakdownStatusInProgress || 'In progress',
    [SKILL_TRACK_CARD_STATUS.COMPLETED]: placeholders.courseBreakdownStatusCompleted || 'Completed',
  };
  const skillTrackCardStatusText = skillTrackCardStatusMap[status] || 'Not started';

  SkillTrackPromise.then((skillTrackMeta) => {
    const card = document.createElement('div');
    card.className = 'course-breakdown-skill-track-card';

    // Create steps list
    const stepsList =
      skillTrackMeta.skillTrackSteps
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
      <div class="cb-skill-track-header">
        <span class="cb-module-number ${status}">
        ${status === SKILL_TRACK_CARD_STATUS.COMPLETED ? '<span class="icon icon-checkmark-light"></span>' : index + 1}
          </span>
        <h3 class="cb-module-title">${skillTrackMeta.skillTrackHeader || 'Module Title'}</h3>
        <button class="button cb-start-btn ${status}" >
          <a href="${skillTrackMeta.skillTrackSteps[0].url || '#'}">${startButtonText}</a>
        </button>
      </div>
        <div class="cb-steps-info ${open ? 'open' : ''}">
          <span class="cb-steps-info-text">${placeholders.CourseBreakdownModuleDetails || 'Module Details'}</span>
          <span class="cb-chevron"> <span class="icon icon-chevron"></span></span>
          <span class="cb-steps-status-text ${status}">${skillTrackCardStatusText}</span>
        </div>
      </div>
      <div class="cb-steps-list ${open ? 'open' : ''}">
        ${stepsList}
      </div>
    `;

    card.classList.add(status);
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
  const [title, moduleTime, infoTitle, infoDescription, ...skillTracks] = block.children;

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  block.textContent = '';
  block.append(Header(title, skillTracks?.length, moduleTime, placeholders));
  block.append(InfoCard(infoTitle, infoDescription, placeholders));

  skillTracks.forEach((skillTrack, index) => {
    const skillTrackFragment = skillTrack.querySelector('a')?.getAttribute('href');
    const SkillTrackPromise = getSkillTrackMeta(skillTrackFragment);

    const skillTrackProp = {
      SkillTrackPromise,
      index,
      open: index === 0,
      status: index === 0 ? SKILL_TRACK_CARD_STATUS.NOT_STARTED : SKILL_TRACK_CARD_STATUS.DISABLED,
      placeholders,
    };

    const SkillTrackCardElement = SkillTrackCard(skillTrackProp);
    skillTrack.innerHTML = '';
    skillTrack.append(SkillTrackCardElement);
    block.append(skillTrack);
  });
}
