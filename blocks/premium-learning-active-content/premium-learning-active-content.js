import { createTag, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import {
  fetchUserEnrollments,
  fetchCohortProgress,
  getEngagementBoardId,
  fetchBoardPosts,
} from '../../scripts/data-service/premium-learning-data-service.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function calculateTotalReplies(postsData) {
  if (!postsData?.data) return 0;
  const posts = postsData.data.length;
  const comments = postsData.data.reduce((sum, post) => sum + (post.attributes?.commentCount || 0), 0);
  return posts + comments;
}

function extractProgressData(cohortData) {
  if (!cohortData?.data) return null;

  const { data, included = [] } = cohortData;
  const lpEnrollment = included.find(
    (item) =>
      item.type === 'learningObjectInstanceEnrollment' && item.relationships?.learningObject?.data?.id === data.id,
  );

  const progress = lpEnrollment?.attributes?.progressPercent || 0;
  const totalWeeks = data.attributes?.sections?.length || 0;

  const resourceGrades = included.filter((item) => item.type === 'learningObjectResourceGrade');
  const totalModules = resourceGrades.length;
  const completedModules = resourceGrades.filter((g) => g.attributes?.completed).length;
  const modulesRemaining = Math.max(0, totalModules - completedModules);
  const currentWeek = totalWeeks > 0 ? Math.ceil((progress / 100) * totalWeeks) || 1 : 1;

  return { progress, currentWeek, totalWeeks, modulesRemaining, totalModules, completedModules };
}

function buildProgressCard(cardData, progressData, placeholders, totalReplies = 0) {
  const progress = progressData?.progress ?? 0;
  const currentWeek = progressData?.currentWeek ?? 1;
  const totalWeeks = progressData?.totalWeeks ?? 1;
  const modulesRemaining = progressData?.modulesRemaining ?? 0;
  const totalModules = progressData?.totalModules ?? 0;

  const progressCard = createTag('div', { class: 'progress-card' });

  // Build current focus section
  const focusSection = `
    <div class="focus-section">
      <div class="status-label">${placeholders?.premiumLearningCurrentFocus || 'Current focus'}</div>
      <div class="status-detail">${placeholders?.premiumLearningWeek || 'Week'} ${currentWeek} ${
        placeholders?.of || 'of'
      } ${totalWeeks}</div>
      ${
        totalModules > 0
          ? `<ul class="status-list"><li><span class="status-number">${modulesRemaining}</span> ${
              modulesRemaining === 1
                ? placeholders?.premiumLearningModule || 'module'
                : placeholders?.premiumLearningModules || 'modules'
            } ${placeholders?.premiumLearningRemaining || 'remaining'}</li></ul>`
          : ''
      }
    </div>
  `;

  // Build activity section with total replies
  const activitySection =
    totalReplies > 0
      ? `
    <div class="activity-section">
      <div class="status-label">${placeholders?.premiumLearningActivity || 'Activity'}</div>
      <div class="status-replies"><span class="status-number">${totalReplies}</span> ${
        placeholders?.premiumLearningTotal || 'total'
      } ${
        totalReplies === 1
          ? placeholders?.premiumLearningReply || 'reply'
          : placeholders?.premiumLearningReplies || 'replies'
      }</div>
    </div>
  `
      : '';

  progressCard.innerHTML = `
  <div class="progress-card-content">
    <h4>${placeholders?.premiumLearningYourCohortStatus || 'Your cohort status'}</h4>
      <div class="progress-section">
        <div class="status-label">${placeholders?.premiumLearningOverallProgress || 'Overall progress'}</div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}%</div>
        </div>
      </div>
    ${focusSection}
    ${activitySection}
    </div>
  `;

  const goBtn = createTag('a', { class: 'button' }, placeholders?.premiumLearningGoToCohort || 'Go to cohort');
  const viewLink = cardData?.viewLink || '';
  if (viewLink.startsWith('https://') || viewLink.startsWith('http://') || viewLink.startsWith('/')) {
    goBtn.href = viewLink;
  }
  const buttonContainer = createTag('p', { class: 'button-container' }, goBtn);
  progressCard.querySelector('.progress-card-content').appendChild(buttonContainer);

  return progressCard;
}

async function buildCarouselSlide(cardData, progressData, totalReplies, placeholders) {
  const slide = createTag('div', { class: 'carousel-slide' });

  const cohortCardWrapper = createTag('div', { class: 'cohort-card-wrapper' });
  await buildCard(cohortCardWrapper, cardData);

  // Add "In Progress" label to thumbnail
  const figureElement = cohortCardWrapper.querySelector('.premium-learning-card-figure');
  if (figureElement) {
    const progressLabel = createTag('div', { class: 'cohort-progress-label' });
    progressLabel.textContent = placeholders?.premiumLearningInProgress || 'In Progress';

    const startLabelContainer = figureElement.querySelector('.premium-learning-card-start-label-container');
    if (startLabelContainer) {
      const labelsWrapper = createTag('div', { class: 'cohort-labels-wrapper' });
      labelsWrapper.appendChild(startLabelContainer.cloneNode(true));
      labelsWrapper.appendChild(progressLabel);
      startLabelContainer.replaceWith(labelsWrapper);
    } else {
      figureElement.appendChild(progressLabel);
    }
  }

  // Add metadata below card title
  const titleElement = cohortCardWrapper.querySelector('.premium-learning-card-title');
  const metaParts = [
    cardData.meta?.duration,
    cardData.meta?.level,
    cardData.meta?.rating?.average > 0
      ? `${cardData.meta.rating.average.toFixed(1)} <span class="rating-star">★</span>`
      : null,
  ].filter(Boolean);

  if (titleElement && metaParts.length > 0) {
    const metaElement = createTag('p', { class: 'premium-learning-card-meta-text' });
    metaParts.forEach((part, index) => {
      metaElement.appendChild(createTag('span', { class: 'meta-part' }, part));
      if (index < metaParts.length - 1) {
        metaElement.appendChild(createTag('span', { class: 'meta-bullet' }, '•'));
      }
    });
    titleElement.insertAdjacentElement('afterend', metaElement);
  }

  slide.appendChild(cohortCardWrapper);

  const progressCard = buildProgressCard(cardData, progressData, placeholders, totalReplies);
  slide.appendChild(progressCard);

  return slide;
}

/**
 * Initialize carousel navigation with ResizeObserver
 * Carousel only active on desktop (≥600px), stacked as cards on mobile
 */
function initCarousel(container) {
  const track = container.querySelector('.carousel-track');
  const slides = track.querySelectorAll('.carousel-slide');
  const prevBtn = container.querySelector('.carousel-btn.prev');
  const nextBtn = container.querySelector('.carousel-btn.next');
  const nav = container.querySelector('.carousel-nav');

  let currentIndex = 0;

  if (slides.length <= 1) {
    if (nav) nav.style.display = 'none';
    return;
  }

  const updateCarousel = () => {
    const isDesktop = window.innerWidth >= 900;

    if (!isDesktop) {
      track.style.transform = 'none';
      currentIndex = 0;
      return;
    }

    // Desktop: Carousel behavior
    const containerWidth = container.offsetWidth;
    const slideWidth = containerWidth * 0.75;
    const spacing = containerWidth * 0.25 + 24;

    track.style.transform = `translateX(-${currentIndex * (slideWidth + spacing)}px)`;

    prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
    nextBtn.style.display = currentIndex === slides.length - 1 ? 'none' : 'flex';
  };

  prevBtn.addEventListener('click', () => {
    if (window.innerWidth >= 900 && currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (window.innerWidth >= 900 && currentIndex < slides.length - 1) {
      currentIndex += 1;
      updateCarousel();
    }
  });

  const ro = new ResizeObserver(updateCarousel);
  ro.observe(container);

  // Disconnect observer when container is removed from DOM
  new MutationObserver((_, mo) => {
    if (!document.contains(container)) {
      ro.disconnect();
      mo.disconnect();
    }
  }).observe(document.body, { childList: true, subtree: true });

  updateCarousel();
}

/**
 * Decorate function
 */
export default async function decorate(block) {
  const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));
  const config = getConfig();
  const [headingElement, descriptionElement, ctaElement] = [...block.children];

  block.innerHTML = '';

  const description = descriptionElement?.innerHTML
    ? `<div class="premium-learning-active-content-header-description">${descriptionElement.innerHTML}</div>`
    : '';
  const cta = ctaElement?.innerHTML ? decorateCustomButtons(ctaElement) : '';

  const headerDiv = createTag('div', { class: 'premium-learning-active-content-header' });
  headerDiv.innerHTML = `
    <div class="premium-learning-active-content-header-content">
      <div class="premium-learning-active-content-header-text">
        ${headingElement?.innerHTML || ''}
        ${description}
      </div>
      <div class="premium-learning-active-content-cta">
        ${cta}
      </div>
    </div>
  `;
  block.appendChild(headerDiv);

  try {
    const enrollmentData = await fetchUserEnrollments(
      config,
      'learningProgram',
      4,
      'learningObject,learningObject.instances',
    );

    const activeInstances =
      enrollmentData?.included?.filter(
        (item) => item.type === 'learningObjectInstance' && item.attributes?.state === 'Active',
      ) || [];

    const activeInstanceIds = new Set(activeInstances.map((instance) => instance.id));

    // Filter enrollments to only include active instances
    const allEnrollments = (enrollmentData?.data || []).filter((enrollment) => {
      const hasActiveInstance =
        enrollment.relationships?.loInstance?.data?.id &&
        activeInstanceIds.has(enrollment.relationships.loInstance.data.id);
      const isNotCompleted = enrollment.attributes?.state !== 'COMPLETED';
      return hasActiveInstance && isNotCompleted;
    });

    // Get learning object IDs from active enrollments
    const activeLearningObjectIds = new Set(
      allEnrollments.map((enrollment) => enrollment.relationships?.learningObject?.data?.id).filter(Boolean),
    );

    // Filter learning objects to only include active ones
    const enrolledLearningObjects =
      enrollmentData?.included?.filter(
        (item) => item.type === 'learningObject' && activeLearningObjectIds.has(item.id),
      ) || [];

    // Map to card data
    const { default: BrowseCardsPLAdaptor } = await import(
      '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js'
    );
    const cardsData = await BrowseCardsPLAdaptor.mapResultsToCardsData({
      data: enrolledLearningObjects,
      included: enrollmentData.included,
    });

    // Build carousel
    const carouselContainer = createTag('div', { class: 'carousel-container' });
    const carouselTrack = createTag('div', { class: 'carousel-track' });

    const slides = await Promise.all(
      cardsData.map(async (cardData, i) => {
        const cohortId = enrolledLearningObjects[i]?.id;
        const cohortProgressData = await fetchCohortProgress(cohortId, config);

        const defaultInstance = cohortProgressData?.included?.find(
          (item) =>
            item.type === 'learningObjectInstance' &&
            item.attributes?.isDefault === true &&
            item.relationships?.learningObject?.data?.id === cohortId,
        );

        const instanceId = defaultInstance?.id;
        const boardId = await getEngagementBoardId(cohortId, instanceId, config);

        const progressData = extractProgressData(cohortProgressData);
        const boardPostsData = await fetchBoardPosts(boardId, config);
        const totalReplies = calculateTotalReplies(boardPostsData);

        if (progressData && cardData.meta) {
          cardData.meta.duration = `${placeholders?.premiumLearningWeek || 'Week'} ${progressData.currentWeek} ${
            placeholders?.of || 'of'
          } ${progressData.totalWeeks}`;
        }

        return buildCarouselSlide(cardData, progressData, totalReplies, placeholders);
      }),
    );

    slides.forEach((slide) => carouselTrack.appendChild(slide));

    carouselContainer.appendChild(carouselTrack);
    carouselContainer.insertAdjacentHTML(
      'beforeend',
      `
      <div class="carousel-nav">
        <button class="carousel-btn prev" aria-label="Previous">
          <img src="/icons/front-arrow.svg" alt="Previous" />
        </button>
        <button class="carousel-btn next" aria-label="Next">
          <img src="/icons/front-arrow.svg" alt="Next" />
        </button>
      </div>
    `,
    );

    block.appendChild(carouselContainer);
    initCarousel(carouselContainer);
  } catch (err) {
    if (!UEAuthorMode) {
      block.remove();
    }
    // eslint-disable-next-line no-console
    console.error('Error fetching active content:', err);
  }
}
