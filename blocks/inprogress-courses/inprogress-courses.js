import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const DEFAULT_NUM_COURSES = 2;
const MAX_NUM_COURSES = 4;

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
      const showMoreText = placeholders?.showMore || 'Show More';
      const showLessText = placeholders?.showLess || 'Show Less';
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
  if (UEAuthorMode) {
    block.innerHTML = `<div><h3>Keep up the Good work, firstName.</h3></div><div class="inprogress-courses-card-wrapper">This block will load the in progress courses from the profile.</div><div></div>`;
  } else {
    isSignedInUser().then(async (isUserSignedIn) => {
      if (!isUserSignedIn) {
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
            { transformCourseMetaToCardModel, fetchCourseIndex },
            { default: BrowseCardsCourseEnricher },
            placeholders,
          ] = await Promise.all([
            import('../../scripts/courses/course-utils.js'),
            import('../../scripts/browse-card/browse-cards-course-enricher.js'),
            fetchLanguagePlaceholders(),
          ]);
          const firstName = profileResult?.first_name;
          const headerText = placeholders?.inprogressCoursesHeader || 'Keep up the Good work';
          block.innerHTML = `<div><h3>${headerText}, ${firstName}.</h3></div><div class="inprogress-courses-card-wrapper"></div><div></div>`;
          const lang = document.querySelector('html').lang || 'en';
          const allCourses = await fetchCourseIndex(lang);
          const courseIds = courseIdentifiers.map((id) => `/${lang}/${id}`);
          const filteredCourses = allCourses.filter((course) => courseIds.includes(course.path));

          const cardModels = filteredCourses.map((model) => transformCourseMetaToCardModel({ model, placeholders }));
          const courses = BrowseCardsCourseEnricher.enrichCardsWithCourseStatus(cardModels, profileCourses);
          const inProgressCourses = courses
            .filter((course) => course.meta?.courseInfo?.courseStatus === COURSE_STATUS.IN_PROGRESS)
            .slice(0, MAX_NUM_COURSES);
          if (inProgressCourses.length === 0) {
            block.classList.add('inprogress-courses-hidden');
            return;
          }

          const [headerWrappper, contentDiv, ctaSectionWrapper] = Array.from(block.children);
          headerWrappper.classList.add('inprogress-courses-header-wrapper');
          setupCoursesUI(ctaSectionWrapper, inProgressCourses, contentDiv, placeholders);
        },
      );
    });
  }
}
