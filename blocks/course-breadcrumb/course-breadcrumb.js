import { getCurrentCourseMeta, getCurrentStepInfo } from '../../scripts/utils/course-utils.js';
import { fetchLanguagePlaceholders, getPathDetails, matchesAnyTheme, htmlToElement } from '../../scripts/scripts.js';

/**
 * Checks if the current page is a certificate page.
 * Certificate pages have the 'course-certificate' theme.
 *
 * @returns {boolean} True if the current page is a certificate page, false otherwise
 */
function isCertificatePage() {
  return matchesAnyTheme(/course-certificate/);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  // Get course and step information
  const courseInfo = await getCurrentCourseMeta();
  const stepInfo = await getCurrentStepInfo(placeholders);

  if (!courseInfo || !stepInfo) {
    // eslint-disable-next-line no-console
    console.warn('No course or step info available for course-breadcrumb');
    return;
  }

  // Clear existing content
  block.textContent = '';
  // No need to add 'breadcrumbs' class as we're using course-breadcrumb selectors in CSS

  const { lang } = getPathDetails();

  // Determine the breadcrumb links based on page type
  const currentStep = !isCertificatePage()
    ? stepInfo.moduleSteps.find((step) => step.url === window.location.pathname)
    : null;

  const breadcrumbLinks = `
    <a href="/${lang}/courses" class="course-breadcrumb-courses">${placeholders?.coursesLabel || 'Courses'}</a>
    <a href="${courseInfo.url}" title="${courseInfo.heading || ''}" class="course-breadcrumb-course-title">${
      courseInfo.heading || ''
    }</a>
    ${
      isCertificatePage()
        ? `<a class="course-breadcrumb-certificate course-breadcrumb-current" style="pointer-events: none">${
            placeholders?.coursesCertificate || 'Certificate'
          }</a>`
        : `<a href="${stepInfo.moduleSteps[0]?.url || stepInfo.courseUrl}" title="${
            stepInfo.moduleHeader || ''
          }" class="course-breadcrumb-module">${stepInfo.moduleHeader || ''}</a>
         ${
           currentStep
             ? `<a class="course-breadcrumb-step course-breadcrumb-current" style="pointer-events: none">${currentStep.name}</a>`
             : ''
         }`
    }
  `;

  const breadcrumbHTML = htmlToElement(`
    <div class="course-breadcrumb-container">
      <div class="course-breadcrumb-items">${breadcrumbLinks}</div>
    </div>
  `);

  block.appendChild(breadcrumbHTML);
}
