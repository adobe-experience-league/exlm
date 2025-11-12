import { getCurrentCourses } from '../../scripts/courses/course-profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

let placeholders = {};

function certificateCard(props) {
  const { lang } = getPathDetails();
  const date = new Date(props?.awards?.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
        <div class="course-awards-card">
            <div class="course-badge">
                <span class="icon icon-course-badge"></span>
            </div>
                <h4 class="course-awards-card-title">${props?.name}</h4>
                <div class="course-awards-card-footer">
                  <div class="course-awards-card-timestamp">${
                    placeholders?.courseAwardCertificateCompletedLabel || 'Completed'
                  } ${dateStr || ''}</div>
                  <a href="${window.location.origin}/${lang}/${
                    props?.awards?.id
                  }" class="course-awards-card-link button secondary">${
                    placeholders?.courseAwardCertificateLinkLabel || 'View Certificate'
                  }</a>
                </div>
        </div>
    `;
}

export default async function decorate(block) {
  block.textContent = '';
  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  let courses;
  try {
    courses = await getCurrentCourses();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching courses:', err);
    if (!UEAuthorMode) {
      block.closest('.section.course-awards-container')?.remove();
    }
    return;
  }

  const completedCourses = courses?.filter((course) => course?.awards?.timestamp);

  if (!completedCourses?.length) {
    if (!UEAuthorMode) {
      block.closest('.section.course-awards-container')?.remove();
    }
    return;
  }

  const certificateCards = completedCourses.map(certificateCard);
  block.innerHTML = certificateCards.join('');
  decorateIcons(block);
}
