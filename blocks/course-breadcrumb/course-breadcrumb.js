import { getCurrentCourseMeta, getCurrentStepInfo } from '../../scripts/utils/course-utils.js';
import { fetchLanguagePlaceholders, getPathDetails, matchesAnyTheme } from '../../scripts/scripts.js';

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
  block.classList.add('breadcrumbs');

  // Create breadcrumb container
  const container = document.createElement('div');
  const innerContainer = document.createElement('div');
  container.appendChild(innerContainer);
  block.appendChild(container);

  // Course link (first level) - include language code in URL
  const courseLink = document.createElement('a');
  const { lang } = getPathDetails();
  courseLink.href = `/${lang}/courses`;
  courseLink.textContent = placeholders?.coursesLabel || 'Courses';
  innerContainer.appendChild(courseLink);

  // Course title link (second level)
  const courseTitleLink = document.createElement('a');
  courseTitleLink.href = courseInfo.url;
  courseTitleLink.textContent = courseInfo.heading || '';
  courseTitleLink.title = courseInfo.heading || '';
  innerContainer.appendChild(courseTitleLink);

  // Check if this is a certificate page
  if (isCertificatePage()) {
    const certificateLink = document.createElement('a');
    certificateLink.textContent = placeholders?.coursesCertificate || 'Certificate'; // Preset as Certificate
    certificateLink.style.pointerEvents = 'none';
    innerContainer.appendChild(certificateLink);
  } else {
    // For step pages, add module title (third level)
    const moduleTitleLink = document.createElement('a');
    // Use the first step of the module as the link target
    moduleTitleLink.href = stepInfo.moduleSteps[0]?.url || stepInfo.courseUrl;
    moduleTitleLink.textContent = stepInfo.moduleHeader || '';
    moduleTitleLink.title = stepInfo.moduleHeader || ''; // Add tooltip with full text
    innerContainer.appendChild(moduleTitleLink);

    // Step title (fourth level) - only add if we're on a step page
    const currentStep = stepInfo.moduleSteps.find((step) => step.url === window.location.pathname);
    if (currentStep) {
      const stepLink = document.createElement('a');

      stepLink.textContent = currentStep.name;
      stepLink.style.pointerEvents = 'none';
      innerContainer.appendChild(stepLink);
    }
  }
}
