import { getCurrentCourses } from '../../scripts/courses/course-profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

function certificateCard(props) {
  return `
        <div class="course-awards-card">
            <div class="course-badge">
                <span class="icon icon-course-badge-red"></span>
            </div>
            <div class="course-awards-card-content">
                <h4 class="course-awards-card-title">${props.title}</h4>
                <span class="course-tag">${props.tag}</span>
                <span class="course-awards-card-timestamp">${props.timestamp}</span>
                <a href="${props.link}" class="course-awards-card-link">${props.linkText}</a>
            </div>
        </div>
    `;
}

export default async function decorate(block) {
  block.textContent = '';

  const courses = await getCurrentCourses();
  const completedCourses = courses?.filter((course) => course.awards?.timestamp);
  const hasCertificates = completedCourses?.length > 0;

  if (!hasCertificates) {
    block.closest('.section.course-awards-container')?.remove();
    return;
  }
  const certificateCards = completedCourses.map(certificateCard);
  block.innerHTML = certificateCards.join('');
  decorateIcons(block);
}
