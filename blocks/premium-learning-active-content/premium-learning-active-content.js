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
const placeholders = await fetchLanguagePlaceholders().catch(() => ({}));
const config = getConfig();
const { getPathDetails } = await import('../../scripts/scripts.js');
const pathDetails = getPathDetails();

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

async function buildCarouselSlide(cardData, cohortId, instanceId, progressData, totalReplies) {
  const slide = createTag('div', { class: 'carousel-slide' });

  const cohortCardWrapper = createTag('div', { class: 'cohort-card-wrapper' });
  await buildCard(cohortCardWrapper, cardData);

  // Add metadata below title: Week X of Y • Level • Rating
  const titleElement = cohortCardWrapper.querySelector('.premium-learning-card-title');
  const { duration, level, rating } = cardData.meta || {};

  const metaParts = [duration, level, rating?.average > 0 ? `${rating.average.toFixed(1)} ★` : null].filter(Boolean);

  if (titleElement && metaParts.length > 0) {
    const metaElement = createTag('p', { class: 'premium-learning-card-meta-text' });
    metaElement.textContent = metaParts.join(' • ');
    titleElement.insertAdjacentElement('afterend', metaElement);
  }

  slide.appendChild(cohortCardWrapper);

  const progressCard = buildProgressCard(cardData, progressData, totalReplies);
  slide.appendChild(progressCard);

  return slide;
}

function buildProgressCard(cardData, progressData, totalReplies = 0) {
  const progress = progressData?.progress ?? 0;
  const currentWeek = progressData?.currentWeek ?? 1;
  const totalWeeks = progressData?.totalWeeks ?? 1;
  const modulesRemaining = progressData?.modulesRemaining ?? 0;
  const totalModules = progressData?.totalModules ?? 0;

  const progressCard = createTag('div', { class: 'progress-card' });

  // Build current focus section
  const focusSection = `
    <div class="focus-section">
      <div class="status-label">Current focus</div>
      <div class="status-detail">Week ${currentWeek} of ${totalWeeks}</div>
      ${
        totalModules > 0
          ? `<ul class="status-list"><li>${modulesRemaining} ${
              modulesRemaining === 1 ? 'module' : 'modules'
            } remaining</li></ul>`
          : ''
      }
    </div>
  `;

  // Build activity section with total replies (only show if replies exist)
  const activitySection =
    totalReplies > 0
      ? `
    <div class="activity-section">
      <div class="status-label">Activity</div>
      <div class="status-replies">${totalReplies} total ${totalReplies === 1 ? 'reply' : 'replies'}</div>
    </div>
  `
      : '';

  progressCard.innerHTML = `
  <div class="progress-card-content">
    <h4>Your cohort status</h4>
      <div class="progress-section">
        <div class="status-label">Overall progress</div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}%</div>
        </div>
      </div>
    ${focusSection}
    ${activitySection}
    <p class="button-container"><a href="${cardData?.viewLink}" class="button">Go to cohort</a></p>
    </div>
  `;

  return progressCard;
}

/**
 * Initialize carousel navigation with ResizeObserver
 * Carousel only active on desktop (≥600px), stacked on mobile
 */
function initCarousel(container) {
  const track = container.querySelector('.carousel-track');
  const slides = track.querySelectorAll('.carousel-slide');
  const prevBtn = container.querySelector('.carousel-btn.prev');
  const nextBtn = container.querySelector('.carousel-btn.next');

  let currentIndex = 0;

  const updateCarousel = () => {
    const isMobile = window.innerWidth < 600;

    if (isMobile) {
      track.style.transform = 'none';
      currentIndex = 0;
    } else {
      const slideWidth = slides[0].offsetWidth;
      track.style.transform = `translateX(-${currentIndex * (slideWidth + 24)}px)`;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === slides.length - 1;
    }
  };

  prevBtn.addEventListener('click', () => {
    if (window.innerWidth >= 600 && currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (window.innerWidth >= 600 && currentIndex < slides.length - 1) {
      currentIndex += 1;
      updateCarousel();
    }
  });

  new ResizeObserver(updateCarousel).observe(container);
  updateCarousel();
}

/**
 * Decorate function
 */
export default async function decorate(block) {
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
      10,
      'learningObject,learningObject.instances',
    );

    // Get ALL enrolled cohorts (no filtering)
    const allEnrollments = enrollmentData?.data || [];
    const enrolledLearningObjects = enrollmentData?.included?.filter((item) => item.type === 'learningObject') || [];

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

    for (let i = 0; i < cardsData.length; i += 1) {
      const cohortId = enrolledLearningObjects[i]?.id;
      const instanceId = allEnrollments[i]?.relationships?.loInstance?.data?.id;

      const boardId = await getEngagementBoardId(cohortId, instanceId);
      const boardPostsData = await fetchBoardPosts(boardId);
      const totalReplies = calculateTotalReplies(boardPostsData);

      const cohortProgressData = await fetchCohortProgress(cohortId);
      const progressData = extractProgressData(cohortProgressData);

      // Inject progress data as duration in card meta
      const cardData = cardsData[i];
      if (progressData && cardData.meta) {
        cardData.meta.duration = `Week ${progressData.currentWeek} of ${progressData.totalWeeks}`;
      }

      const slide = await buildCarouselSlide(cardData, cohortId, instanceId, progressData, totalReplies);
      carouselTrack.appendChild(slide);
    }

    carouselContainer.appendChild(carouselTrack);
    carouselContainer.insertAdjacentHTML(
      'beforeend',
      `
      <div class="carousel-nav">
        <button class="carousel-btn prev" aria-label="Previous">‹</button>
        <button class="carousel-btn next" aria-label="Next">›</button>
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
