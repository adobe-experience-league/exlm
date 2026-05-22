import { createTag, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import {
  fetchUserEnrollments,
  fetchNextEnrollmentPage,
  fetchCohortProgress,
  getEngagementBoardId,
  fetchBoardPosts,
} from '../../scripts/data-service/premium-learning-data-service.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import {
  buildLearningObjectSkillLevels,
  formatSkillLevels,
} from '../../scripts/browse-card/browse-cards-premium-learning-adaptor.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

function addShimmer(container) {
  const isDesktop = window.matchMedia('(min-width: 900px)').matches;

  if (isDesktop) {
    // Desktop: custom shimmer
    const shimmerHTML = `
      <div class="active-content-shimmer">
        <div class="shimmer-slide">
          <div class="shimmer-card"></div>
          <div class="shimmer-progress"></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', shimmerHTML);
  } else {
    // Mobile: browse card shimmer
    const shimmer = new BrowseCardShimmer(2);
    shimmer.addShimmer(container);
  }
}

function removeShimmer(container) {
  container.querySelector('.active-content-shimmer')?.remove();
  container.querySelectorAll('.browse-card-shimmer').forEach((el) => el.remove());
}

function showFallbackContentInUEMode(blockElement) {
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  contentDiv.textContent = 'This block will load the Premium learning active content for Premium users only.';
  blockElement.appendChild(contentDiv);
}

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

/**
 * Build custom metadata for active content cards (skill level • rating)
 * @param {Object} cardData - Card data object
 * @returns {HTMLElement|null} Metadata element or null
 */
function buildActiveContentMetadata(cardData) {
  const metaParts = [];

  if (cardData.meta?.level) metaParts.push(cardData.meta.level);
  if (cardData.meta?.rating?.average > 0) {
    metaParts.push(`${cardData.meta.rating.average.toFixed(1)} ★`);
  }

  if (metaParts.length === 0) return null;

  const metaElement = createTag('p', { class: 'premium-learning-card-meta-text' });
  metaParts.forEach((part) => {
    const span = createTag('span');
    span.textContent = part;
    metaElement.appendChild(span);
  });

  return metaElement;
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

async function buildCarouselSlide(cardData, progressData, totalReplies, placeholders, learningObject) {
  const slide = createTag('div', { class: 'carousel-slide' });

  const cohortCardWrapper = createTag('div', { class: 'cohort-card-wrapper' });
  await buildCard(cohortCardWrapper, cardData);

  // Store image URLs on slide element for responsive switching
  const img = cohortCardWrapper.querySelector('.premium-learning-card-figure > img');
  if (img && learningObject?.attributes) {
    const attrs = learningObject.attributes;
    slide.dataset.bannerUrl = attrs.bannerUrl || '';
    slide.dataset.imageUrl = attrs.imageUrl || '';

    // Set correct initial image based on viewport to prevent flash
    const isDesktop = window.matchMedia('(min-width: 900px)').matches;
    img.src = isDesktop ? attrs.bannerUrl || attrs.imageUrl || img.src : attrs.imageUrl || attrs.bannerUrl || img.src;
    slide.dataset.lastViewport = isDesktop ? 'desktop' : 'mobile';
  }

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

  // Replace default metadata with active content metadata
  cohortCardWrapper.querySelector('.premium-learning-card-meta-text')?.remove();

  const titleElement = cohortCardWrapper.querySelector('.premium-learning-card-title');
  const metaElement = buildActiveContentMetadata(cardData);

  if (titleElement && metaElement) {
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

  if (slides.length <= 1 && nav) {
    nav.style.display = 'none';
  }

  const updateCarousel = () => {
    const isDesktop = window.matchMedia('(min-width: 900px)').matches;
    const wasDesktop = slides[0]?.dataset.lastViewport === 'desktop';

    // Only update images when transitioning between desktop and mobile
    if (wasDesktop !== isDesktop) {
      slides.forEach((slide) => {
        const img = slide.querySelector('.premium-learning-card-figure > img');
        if (img) {
          const { bannerUrl, imageUrl } = slide.dataset;
          if (isDesktop) {
            img.src = bannerUrl || imageUrl || img.src;
          } else {
            img.src = imageUrl || bannerUrl || img.src;
          }
        }
        slide.dataset.lastViewport = isDesktop ? 'desktop' : 'mobile';
      });
    }

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
    if (window.matchMedia('(min-width: 900px)').matches && currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (window.matchMedia('(min-width: 900px)').matches && currentIndex < slides.length - 1) {
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
  const [headingElement, descriptionElement] = [...block.children];

  block.innerHTML = '';

  const description = descriptionElement?.innerHTML
    ? `<div class="premium-learning-active-content-header-description">${descriptionElement.innerHTML}</div>`
    : '';

  const headerDiv = createTag('div', { class: 'premium-learning-active-content-header' });
  headerDiv.innerHTML = `
    <div class="premium-learning-active-content-header-content">
      <div class="premium-learning-active-content-header-text">
        <div class="premium-learning-active-content-header-title">${headingElement?.innerHTML || ''}</div>
        ${description}
      </div>
    </div>
  `;
  block.appendChild(headerDiv);
  addShimmer(block);

  // Non-blocking eligibility check — header stays visible until resolved.
  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then(async (isEligible) => {
      if (!isEligible) {
        removeShimmer(block);
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else block.remove();
        return;
      }

      try {
        const allData = [];
        const allIncluded = [];

        let result = await fetchUserEnrollments(
          config,
          'learningProgram',
          10,
          'learningObject,learningObject.instances',
          'Active',
        );

        while (result) {
          const nonCompleted = (result.data || []).filter((enrollment) => enrollment.attributes?.state !== 'COMPLETED');
          const remaining = 4 - allData.length;
          allData.push(...nonCompleted.slice(0, remaining));

          if (result.included) {
            const existingIds = new Set(allIncluded.map((item) => item.id));
            result.included.forEach((item) => {
              if (!existingIds.has(item.id)) {
                allIncluded.push(item);
              }
            });
          }

          if (allData.length >= 4) break;

          const nextUrl = result.links?.next;
          if (!nextUrl) break;

          // eslint-disable-next-line no-await-in-loop
          result = await fetchNextEnrollmentPage(nextUrl);
        }

        const enrollmentData = { data: allData, included: allIncluded };

        // Get learning object IDs from active enrollments
        const activeLearningObjectIds = new Set(
          allData.map((enrollment) => enrollment.relationships?.learningObject?.data?.id).filter(Boolean),
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
        const cardsData = await BrowseCardsPLAdaptor.mapResultsToCardsData(
          {
            data: enrolledLearningObjects,
            included: enrollmentData.included,
          },
          // Preserve 1:1 order with enrollments; catalog-style cohort eligibility does not apply to already-enrolled items.
          { filterInactiveCohortInstances: false },
        );

        // Build carousel
        const carouselContainer = createTag('div', { class: 'carousel-container' });
        const carouselTrack = createTag('div', { class: 'carousel-track' });

        const slides = await Promise.all(
          cardsData.map(async (cardData, i) => {
            const cohortId = enrolledLearningObjects[i]?.id;
            const cohortProgressData = await fetchCohortProgress(cohortId, config);

            const loSkillLevels = buildLearningObjectSkillLevels(cohortProgressData?.included || []);
            const skillLevel = formatSkillLevels(loSkillLevels.get(cohortId), placeholders);
            if (skillLevel && cardData.meta) {
              cardData.meta.level = skillLevel;
            }

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

            return buildCarouselSlide(cardData, progressData, totalReplies, placeholders, enrolledLearningObjects[i]);
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

        removeShimmer(block);
        block.appendChild(carouselContainer);
        initCarousel(carouselContainer);
      } catch (err) {
        removeShimmer(block);
        if (UEAuthorMode) showFallbackContentInUEMode(block);
        else block.remove();
        // eslint-disable-next-line no-console
        console.error('Error fetching active content:', err);
      }
    })
    .catch((err) => {
      removeShimmer(block);
      if (UEAuthorMode) showFallbackContentInUEMode(block);
      else block.remove();
      // eslint-disable-next-line no-console
      console.error('Error resolving PL eligibility for active content:', err);
    });
}
