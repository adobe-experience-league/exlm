import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const DEFAULT_NUM_COURSES = 2;

function replaceProfileText(field, value) {
  return field.replace('{adobeIMS.first_name}', value);
}

const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

export default function decorate(block) {
  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
  const renderCourses = (contentDiv, courses, limit) => {
    const fragment = document.createDocumentFragment();
    contentDiv.innerHTML = '';
    const coursesToRender = courses.slice(0, limit);

    coursesToRender.forEach((cardData) => {
      const cardDiv = document.createElement('div');
      buildCard(contentDiv, cardDiv, cardData);
      fragment.appendChild(cardDiv);
    });

    const op = coursesToRender.length % 2 !== 0 ? 'add' : 'remove';
    contentDiv.classList[op]('single-card-block');

    contentDiv.appendChild(fragment);
  };

  const setupCoursesUI = (ctaSectionWrapper, cardModels, contentDiv, placeholders) => {
    ctaSectionWrapper.classList.add('inprogress-courses-cta-wrapper');
    let visibleCourses = DEFAULT_NUM_COURSES;

    if (cardModels.length > DEFAULT_NUM_COURSES) {
      const showMoreButton = createTag('button', { class: 'secondary' });
      const showMoreText = placeholders?.seeMore || 'See More';
      const showLessText = placeholders?.seeLess || 'See Less';
      showMoreButton.textContent = showMoreText;
      showMoreButton.addEventListener('click', () => {
        visibleCourses = visibleCourses === DEFAULT_NUM_COURSES ? cardModels.length : DEFAULT_NUM_COURSES;
        const showLess = visibleCourses === cardModels.length;
        showMoreButton.textContent = showLess ? showLessText : showMoreText;
        renderCourses(contentDiv, cardModels, visibleCourses);
        if (!showLess) {
          block.scrollIntoView({ behavior: 'auto' });
        }
      });
      ctaSectionWrapper.appendChild(showMoreButton);
    }

    renderCourses(contentDiv, cardModels, visibleCourses);
  };
  const [firstRow] = block.querySelectorAll(':scope div > div');
  const configuredHeadingText = firstRow?.innerHTML;
  const inprogressCoursesBlock = document.createRange().createContextualFragment(`
    <div class="inprogress-courses-header-wrapper"></div>
    <div class="inprogress-courses-card-wrapper"></div>
    <div class="inprogress-courses-cta-wrapper"></div>
  `);
  block.textContent = '';
  block.append(inprogressCoursesBlock);

  const headerEl = block.querySelector('.inprogress-courses-header-wrapper');
  const contentDiv = block.querySelector('.inprogress-courses-card-wrapper');

  if (UEAuthorMode) {
    headerEl.innerHTML = configuredHeadingText ? replaceProfileText(configuredHeadingText, 'First Name') : '';
    contentDiv.textContent = 'This block will load the in progress courses from the profile.';
  } else {
    isSignedInUser().then(async (isUserSignedIn) => {
      if (!isUserSignedIn) {
        block.classList.add('inprogress-courses-hidden');
        return;
      }
      const { getCurrentCourses, COURSE_STATUS } = await import('../../scripts/courses/course-profile.js');
      Promise.all([getCurrentCourses(), defaultProfileClient.getMergedProfile()]).then(
        async ([profileCourses, profileResult]) => {
          const courseIdentifiers = profileCourses.map((c) => c.courseId);
          if (!courseIdentifiers?.length) {
            block.classList.add('inprogress-courses-hidden');
            return;
          }
          const [
            { transformCourseMetaToCardModel, fetchCourseIndex, getCurrentCourseMeta },
            { default: BrowseCardsCourseEnricher },
            placeholders,
          ] = await Promise.all([
            import('../../scripts/courses/course-utils.js'),
            import('../../scripts/browse-card/browse-cards-course-enricher.js'),
            fetchLanguagePlaceholders(),
          ]);

          const firstName = convertToTitleCase(profileResult?.first_name);
          const maskedFirstName = `<span data-cs-mask>${firstName}</span>`;
          headerEl.innerHTML = configuredHeadingText ? replaceProfileText(configuredHeadingText, maskedFirstName) : '';
          const lang = document.querySelector('html').lang || 'en';
          const allCourses = await fetchCourseIndex(lang);
          const courseIds = courseIdentifiers.map((id) => `/${lang}/${id}`);
          const filteredCourses = allCourses.filter((course) => courseIds.includes(course.path));

          // Transform course metadata to card models and include course metadata
          const cardModels = await Promise.all(
            filteredCourses.map(async (model) => {
              // Get full course metadata to ensure we have all the fields
              const courseMeta = await getCurrentCourseMeta(model.path);
              return transformCourseMetaToCardModel({
                model: {
                  ...model,
                  level: courseMeta?.level || '',
                  totalTime: courseMeta?.totalTime || '',
                  modules: courseMeta?.modules || [],
                },
                placeholders,
              });
            }),
          );

          const courses = BrowseCardsCourseEnricher.enrichCardsWithCourseStatus(cardModels, profileCourses);
          const inProgressCourses = courses.filter(
            (course) => course.meta?.courseInfo?.courseStatus === COURSE_STATUS.IN_PROGRESS,
          );

          if (inProgressCourses.length === 0) {
            block.classList.add('inprogress-courses-hidden');
            return;
          }

          // Find the latest module start time for each course and use it for sorting
          inProgressCourses.forEach((course) => {
            const courseIdWithPrefix = `courses/${course.id}`;
            const profileCourse = profileCourses.find((pc) => pc.courseId === courseIdWithPrefix);

            course.latestModuleStartTime = profileCourse?.modules?.length
              ? Math.max(...profileCourse.modules.map((m) => (m.startedAt ? new Date(m.startedAt).getTime() : 0)))
              : 0;
          });

          // Sort courses by latest module start time (most recent first)
          inProgressCourses.sort((a, b) => b.latestModuleStartTime - a.latestModuleStartTime);

          const ctaSectionWrapper = block.querySelector('.inprogress-courses-cta-wrapper');
          setupCoursesUI(ctaSectionWrapper, inProgressCourses, contentDiv, placeholders);
        },
      );
    });
  }
}
