import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getSkillTrackMeta } from '../../scripts/utils/course-utils.js';

function Header(title) {
  // TODO: Add number of modules and steps
  const header = document.createElement('div');
  header.classList.add('course-breakdown-header');
  header.innerHTML = `
        ${title.innerHTML}
    `;
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

function SkillTrackCard(SkillTrackPromise, open = false) {
  const CardShimmer = SkillTrackCardShimmer();
  SkillTrackPromise.then((skillTrackMeta) => {
    const card = document.createElement('div');
    card.className = 'course-breakdown-skill-track-card';

    // Calculate completed steps (for now, assume 0 completed)
    const completedSteps = 0;
    const totalSteps = skillTrackMeta.totalSteps || skillTrackMeta.skillTrackSteps?.length || 0;

    // Create progress dots
    const progressDots =
      skillTrackMeta.skillTrackSteps
        ?.map((step, index) => {
          const isCompleted = index < completedSteps;
          return `<span class="cb-progress-dot ${isCompleted ? 'completed' : ''}" title="${step.name}"></span>`;
        })
        .join('') || '';

    // Create steps list
    const stepsList =
      skillTrackMeta.skillTrackSteps
        ?.map((step, index) => {
          const isCompleted = index < completedSteps;
          return `
        <div class="cb-step-item">
          <span class="cb-step-number">${index + 1}</span>
          <span class="cb-step-title">${step.name}</span>
          <span class="cb-step-status ${isCompleted ? 'completed' : ''}"></span>
        </div>
      `;
        })
        .join('') || '';

    card.innerHTML = `
      <div class="cb-skill-track-header">
        <span class="cb-module-number">1</span>
        <h3 class="cb-module-title">${skillTrackMeta.skillTrackHeader || 'Module Title'}</h3>
        <button class="cb-start-btn">Start Module</button>
      </div>
      <div class="cb-skill-track-progress-row">
        <div class="cb-steps-info">
          <span class="cb-steps-count">${totalSteps} Steps in this Module</span>
          <span class="cb-chevron ${open ? 'open' : ''}">▼</span>
        </div>
        <div class="cb-progress-bar">
          ${progressDots}
        </div>
        <span class="cb-progress-text">${completedSteps} of ${totalSteps} Complete</span>
      </div>
      <div class="cb-steps-list ${open ? 'open' : ''}">
        ${stepsList}
      </div>
    `;

    // Add click handler for chevron
    const chevron = card.querySelector('.cb-chevron');
    const stepsListEl = card.querySelector('.cb-steps-list');

    chevron.addEventListener('click', () => {
      stepsListEl.classList.toggle('open');
      chevron.classList.toggle('open');
    });

    // Replace shimmer with actual card
    CardShimmer.replaceWith(card);
  });
  return CardShimmer;
}

export default async function decorate(block) {
  const [title, infoTitle, infoDescription, ...skillTracks] = block.children;

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  
  block.textContent = '';
  block.append(Header(title, placeholders));
  block.append(InfoCard(infoTitle, infoDescription, placeholders));

  skillTracks.forEach((skillTrack, index) => {
    const skillTrackFragment = skillTrack.querySelector('a')?.getAttribute('href');
    const SkillTrackPromise = getSkillTrackMeta(skillTrackFragment);
    const SkillTrackCardElement = SkillTrackCard(SkillTrackPromise, index === 0);
    skillTrack.innerHTML = '';
    skillTrack.append(SkillTrackCardElement);
    block.append(skillTrack);
  });
}
