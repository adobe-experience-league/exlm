import { getCurrentCourses, COURSE_STATUS } from '../../scripts/courses/course-profile.js';
import { transformCourseMetaToCardModel, fetchCourseIndex } from '../../scripts/courses/course-utils.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { createTag, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const DEFAULT_NUM_COURSES = 2;
const MAX_NUM_COURSES = 4;

export default function build(block) {
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

  const setupCoursesUI = (ctaSectionWrapper, courses, contentDiv, placeholders) => {
    ctaSectionWrapper.classList.add('inprogress-courses-cta-wrapper');
    let visibleCourses = DEFAULT_NUM_COURSES;

    if (courses.length > DEFAULT_NUM_COURSES) {
      const showMoreButton = createTag('button', { class: 'secondary' });
      const showMoreText = placeholders?.showMore || 'Show More';
      const showLessText = placeholders?.showLess || 'Show Less';
      showMoreButton.textContent = showMoreText;
      showMoreButton.addEventListener('click', () => {
        visibleCourses = visibleCourses === DEFAULT_NUM_COURSES ? courses.length : DEFAULT_NUM_COURSES;
        showMoreButton.textContent = visibleCourses === courses.length ? showLessText : showMoreText;
        renderCourses(contentDiv, courses, visibleCourses);
      });
      ctaSectionWrapper.appendChild(showMoreButton);
    }

    renderCourses(contentDiv, courses, visibleCourses);
  };

  isSignedInUser().then((isUserSignedIn) => {
    if (!isUserSignedIn) {
      return;
    }

    Promise.all([getCurrentCourses(), defaultProfileClient.getMergedProfile()]).then(
      async ([profileCourses, profileResult]) => {
        const courseIdentifiers = Object.keys(profileCourses);
        if (!courseIdentifiers?.length) {
          return;
        }
        const placeholders = await fetchLanguagePlaceholders();
        const firstName = profileResult?.first_name;
        block.innerHTML = `<div><h3>Keep up the Good work, ${firstName}.</h3></div><div class="inprogress-courses-card-wrapper"></div><div></div>`;
        const lang = document.querySelector('html').lang || 'en';
        const allCourses = await fetchCourseIndex(lang);
        const courseIds = courseIdentifiers.map((id) => `/${lang}/${id}`);
        const filteredCourses = allCourses
          .filter((course) => courseIds.includes(course.path))
          .slice(0, MAX_NUM_COURSES);
        const courses = filteredCourses.map((c) =>
          transformCourseMetaToCardModel({ course: c, placeholders, status: COURSE_STATUS.IN_PROGRESS }),
        );

        const [headerWrappper, contentDiv, ctaSectionWrapper] = Array.from(block.children);
        headerWrappper.classList.add('inprogress-courses-header-wrapper');
        setupCoursesUI(ctaSectionWrapper, courses, contentDiv, placeholders);
      },
    );
  });
}
